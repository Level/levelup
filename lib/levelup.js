'use strict'

const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const DeferredLevelDOWN = require('deferred-leveldown')
const IteratorStream = require('level-iterator-stream')
const Batch = require('./batch')
const errors = require('level-errors')
const supports = require('level-supports')
const catering = require('catering')
const getCallback = require('./common').getCallback
const getOptions = require('./common').getOptions

// TODO: after we drop node 10, also use queueMicrotask() in node
const nextTick = require('./next-tick')

const WriteError = errors.WriteError
const ReadError = errors.ReadError
const NotFoundError = errors.NotFoundError
const OpenError = errors.OpenError
const InitializationError = errors.InitializationError

function LevelUP (db, options, callback) {
  if (!(this instanceof LevelUP)) {
    return new LevelUP(db, options, callback)
  }

  let error

  EventEmitter.call(this)
  this.setMaxListeners(Infinity)

  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  options = options || {}

  if (!db || typeof db !== 'object') {
    error = new InitializationError('First argument must be an abstract-leveldown compliant store')
    if (typeof callback === 'function') {
      return nextTick(callback, error)
    }
    throw error
  }

  if (typeof db.status !== 'string') {
    throw new Error('.status required, old abstract-leveldown')
  }

  this.options = getOptions(options)
  this._db = db
  this.db = null
  this.open(callback || ((err) => {
    if (err) this.emit('error', err)
  }))

  // Create manifest based on deferred-leveldown's
  this.supports = supports(this.db.supports, {
    status: true,
    deferredOpen: true,
    openCallback: true,
    promises: true,
    streams: true
  })

  // Experimental: enrich levelup interface
  for (const method of Object.keys(this.supports.additionalMethods)) {
    if (this[method] != null) continue

    // Don't do this.db[method].bind() because this.db is dynamic.
    this[method] = function (...args) {
      return this.db[method](...args)
    }
  }
}

LevelUP.prototype.emit = EventEmitter.prototype.emit
LevelUP.prototype.once = EventEmitter.prototype.once
inherits(LevelUP, EventEmitter)

// TODO: tests
Object.defineProperty(LevelUP.prototype, 'status', {
  enumerable: true,
  get () {
    return this.db.status
  }
})

// TODO: tests
LevelUP.prototype.isOperational = function () {
  return this.db.status === 'open' || this.db.status === 'opening'
}

LevelUP.prototype.open = function (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts
    opts = null
  }

  callback = catering.fromCallback(callback)

  if (!opts) {
    opts = this.options
  }

  // 1) Don't check db.status until levelup has opened,
  // in order for levelup events to be consistent
  if (this.db && this.isOpen()) {
    nextTick(callback, null, this)
    return callback.promise
  }

  if (this.db && this._isOpening()) {
    this.once('open', () => { callback(null, this) })
    return callback.promise
  }

  // 2) Instead let deferred-leveldown handle already-open cases.
  // TODO: ideally though, levelup would have its own status
  this.db = new DeferredLevelDOWN(this._db)
  this.emit('opening')

  this.db.open(opts, (err) => {
    if (err) {
      return callback(new OpenError(err))
    }
    this.db = this._db
    callback(null, this)
    this.emit('open')
    this.emit('ready')
  })

  return callback.promise
}

LevelUP.prototype.close = function (callback) {
  callback = catering.fromCallback(callback)

  if (this.isOpen()) {
    this.db.close((err, ...rest) => {
      this.emit('closed')
      callback(err, ...rest)
    })
    this.emit('closing')
  } else if (this.isClosed()) {
    nextTick(callback)
  } else if (this.db.status === 'closing') {
    this.once('closed', callback)
  } else if (this._isOpening()) {
    this.once('open', () => {
      this.close(callback)
    })
  }

  return callback.promise
}

// TODO: remove in future major
LevelUP.prototype.isOpen = function () {
  return this.db.status === 'open'
}

// TODO: remove in future major
LevelUP.prototype._isOpening = function () {
  return this.db.status === 'opening'
}

// TODO: remove in future major
LevelUP.prototype.isClosed = function () {
  return (/^clos|new/).test(this.db.status)
}

LevelUP.prototype.get = function (key, options, callback) {
  callback = getCallback(options, callback)
  callback = catering.fromCallback(callback)

  if (maybeError(this, callback)) {
    return callback.promise
  }

  options = getOptions(options)

  this.db.get(key, options, function (err, value) {
    if (err) {
      if ((/notfound/i).test(err) || err.notFound) {
        err = new NotFoundError('Key not found in database [' + key + ']', err)
      } else {
        err = new ReadError(err)
      }
      return callback(err)
    }
    callback(null, value)
  })

  return callback.promise
}

LevelUP.prototype.getMany = function (keys, options, callback) {
  return this.db.getMany(keys, options, callback)
}

LevelUP.prototype.put = function (key, value, options, callback) {
  callback = getCallback(options, callback)
  callback = catering.fromCallback(callback)

  if (maybeError(this, callback)) {
    return callback.promise
  }

  options = getOptions(options)

  this.db.put(key, value, options, (err) => {
    if (err) {
      return callback(new WriteError(err))
    }
    this.emit('put', key, value)
    callback()
  })

  return callback.promise
}

LevelUP.prototype.del = function (key, options, callback) {
  callback = getCallback(options, callback)
  callback = catering.fromCallback(callback)

  if (maybeError(this, callback)) {
    return callback.promise
  }

  options = getOptions(options)

  this.db.del(key, options, (err) => {
    if (err) {
      return callback(new WriteError(err))
    }
    this.emit('del', key)
    callback()
  })

  return callback.promise
}

LevelUP.prototype.batch = function (arr, options, callback) {
  if (!arguments.length) {
    return new Batch(this)
  }

  if (typeof arr === 'function') callback = arr
  else callback = getCallback(options, callback)

  callback = catering.fromCallback(callback)

  if (maybeError(this, callback)) {
    return callback.promise
  }

  options = getOptions(options)

  this.db.batch(arr, options, (err) => {
    if (err) {
      return callback(new WriteError(err))
    }
    this.emit('batch', arr)
    callback()
  })

  return callback.promise
}

LevelUP.prototype.iterator = function (options) {
  return this.db.iterator(options)
}

LevelUP.prototype.clear = function (options, callback) {
  callback = getCallback(options, callback)
  options = getOptions(options)
  callback = catering.fromCallback(callback)

  if (maybeError(this, callback)) {
    return callback.promise
  }

  this.db.clear(options, (err) => {
    if (err) {
      return callback(new WriteError(err))
    }
    this.emit('clear', options)
    callback()
  })

  return callback.promise
}

LevelUP.prototype.readStream =
LevelUP.prototype.createReadStream = function (options) {
  options = Object.assign({ keys: true, values: true }, options)
  if (typeof options.limit !== 'number') { options.limit = -1 }
  return new IteratorStream(this.db.iterator(options), options)
}

LevelUP.prototype.keyStream =
LevelUP.prototype.createKeyStream = function (options) {
  return this.createReadStream(Object.assign({}, options, { keys: true, values: false }))
}

LevelUP.prototype.valueStream =
LevelUP.prototype.createValueStream = function (options) {
  return this.createReadStream(Object.assign({}, options, { keys: false, values: true }))
}

LevelUP.prototype.toString = function () {
  return 'LevelUP'
}

LevelUP.prototype.type = 'levelup'

// Expose nextTick for API parity with abstract-leveldown
LevelUP.prototype._nextTick = nextTick

function maybeError (db, callback) {
  if (!db.isOperational()) {
    nextTick(callback, new ReadError('Database is not open'))
    return true
  }

  return false
}

LevelUP.errors = errors
module.exports = LevelUP
