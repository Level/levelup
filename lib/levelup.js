/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License
 * <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits
var extend = require('xtend')
var DeferredLevelDOWN = require('deferred-leveldown')
var IteratorStream = require('level-iterator-stream')
var Batch = require('./batch')
var errors = require('level-errors')
var assert = require('assert')
var promisify = require('./promisify')

var WriteError = errors.WriteError
var ReadError = errors.ReadError
var NotFoundError = errors.NotFoundError
var OpenError = errors.OpenError
var InitializationError = errors.InitializationError

// Possible AbstractLevelDOWN#status values:
//  - 'new'     - newly created, not opened or closed
//  - 'opening' - waiting for the database to be opened, post open()
//  - 'open'    - successfully opened the database, available for use
//  - 'closing' - waiting for the database to be closed, post close()
//  - 'closed'  - database has been successfully closed, should not be
//                 used except for another open() operation

function LevelUP (db, options, callback) {
  if (!(this instanceof LevelUP)) {
    return new LevelUP(db, options, callback)
  }

  var error

  EventEmitter.call(this)
  this.setMaxListeners(Infinity)

  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  options = options || {}

  if (!db || typeof db !== 'object') {
    error = new InitializationError('Must provide db')
    if (typeof callback === 'function') {
      return process.nextTick(callback, error)
    }
    throw error
  }

  assert.equal(typeof db.status, 'string', '.status required, old abstract-leveldown')

  this.options = getOptions(options)
  this._db = db
  this.db = new DeferredLevelDOWN(db)
  this.open(callback)
}

LevelUP.prototype.emit = EventEmitter.prototype.emit
LevelUP.prototype.once = EventEmitter.prototype.once
inherits(LevelUP, EventEmitter)

LevelUP.prototype.open = function (callback) {
  var self = this
  var promise

  if (!callback) [ callback, promise ] = promisify()

  if (this.isOpen()) {
    process.nextTick(callback, null, self)
    return promise
  }

  if (this._isOpening()) {
    this.once('open', function () { callback(null, self) })
    return promise
  }

  this.emit('opening')

  this.db.open(this.options, function (err) {
    if (err) {
      return callback(new OpenError(err))
    }
    self.db = self._db
    callback(null, self)
    self.emit('open')
    self.emit('ready')
  })

  return promise
}

LevelUP.prototype.close = function (callback) {
  var self = this
  var promise

  if (!callback) [ callback, promise ] = promisify()

  if (this.isOpen()) {
    this.db.close(function () {
      self.emit('closed')
      callback.apply(null, arguments)
    })
    this.emit('closing')
    this.db = new DeferredLevelDOWN(this._db)
  } else if (this.isClosed()) {
    process.nextTick(callback)
  } else if (this.db.status === 'closing') {
    this.once('closed', callback)
  } else if (this._isOpening()) {
    this.once('open', function () {
      self.close(callback)
    })
  }

  return promise
}

LevelUP.prototype.isOpen = function () {
  return this.db.status === 'open'
}

LevelUP.prototype._isOpening = function () {
  return this.db.status === 'opening'
}

LevelUP.prototype.isClosed = function () {
  return (/^clos|new/).test(this.db.status)
}

LevelUP.prototype.get = function (key, options, callback) {
  if (key === null || key === undefined) {
    throw new ReadError('get() requires a key argument')
  }

  var promise

  callback = getCallback(options, callback)

  if (!callback) [ callback, promise ] = promisify()

  if (maybeError(this, callback)) { return promise }

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

  return promise
}

LevelUP.prototype.put = function (key, value, options, callback) {
  if (key === null || key === undefined) {
    throw new WriteError('put() requires a key argument')
  }

  var self = this
  var promise

  callback = getCallback(options, callback)

  if (!callback) [ callback, promise ] = promisify()

  if (maybeError(this, callback)) { return promise }

  options = getOptions(options)

  this.db.put(key, value, options, function (err) {
    if (err) {
      return callback(new WriteError(err))
    }
    self.emit('put', key, value)
    callback()
  })

  return promise
}

LevelUP.prototype.del = function (key, options, callback) {
  if (key === null || key === undefined) {
    throw new WriteError('del() requires a key argument')
  }

  var self = this
  var promise

  callback = getCallback(options, callback)

  if (!callback) [ callback, promise ] = promisify()

  if (maybeError(this, callback)) { return promise }

  options = getOptions(options)

  this.db.del(key, options, function (err) {
    if (err) {
      return callback(new WriteError(err))
    }
    self.emit('del', key)
    callback()
  })

  return promise
}

LevelUP.prototype.batch = function (arr, options, callback) {
  if (!arguments.length) {
    return new Batch(this)
  }

  if (!Array.isArray(arr)) {
    throw new WriteError('batch() requires an array argument')
  }

  var self = this
  var promise

  callback = getCallback(options, callback)

  if (!callback) [ callback, promise ] = promisify()

  if (maybeError(this, callback)) { return promise }

  options = getOptions(options)

  arr = arr.map(function (op) {
    if (!op.type && op.key !== undefined && op.value !== undefined) { op.type = 'put' }
    return op
  })

  this.db.batch(arr, options, function (err) {
    if (err) {
      return callback(new WriteError(err))
    }
    self.emit('batch', arr)
    callback()
  })

  return promise
}

LevelUP.prototype.readStream =
LevelUP.prototype.createReadStream = function (options) {
  options = extend({ keys: true, values: true }, options)
  if (typeof options.limit !== 'number') { options.limit = -1 }
  return new IteratorStream(this.db.iterator(options), options)
}

LevelUP.prototype.keyStream =
LevelUP.prototype.createKeyStream = function (options) {
  return this.createReadStream(extend(options, { keys: true, values: false }))
}

LevelUP.prototype.valueStream =
LevelUP.prototype.createValueStream = function (options) {
  return this.createReadStream(extend(options, { keys: false, values: true }))
}

LevelUP.prototype.toString = function () {
  return 'LevelUP'
}

function getCallback (options, callback) {
  return typeof options === 'function' ? options : callback
}

function getOptions (options) {
  return typeof options === 'object' && options !== null ? options : {}
}

function maybeError (db, callback) {
  if (!db._isOpening() && !db.isOpen()) {
    process.nextTick(callback, new ReadError('Database is not open'))
    return true
  }
}

LevelUP.errors = errors
module.exports = LevelUP.default = LevelUP
