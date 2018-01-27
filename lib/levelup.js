/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License
 * <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

const { EventEmitter } = require('events')
const extend = require('xtend')
const DeferredLevelDOWN = require('deferred-leveldown')
const IteratorStream = require('level-iterator-stream')
const Batch = require('./batch')
const errors = require('level-errors')
const assert = require('assert')
const promisify = require('./promisify')

const {
  WriteError,
  ReadError,
  NotFoundError,
  OpenError,
  InitializationError
} = errors

// Possible AbstractLevelDOWN#status values:
//  - 'new'     - newly created, not opened or closed
//  - 'opening' - waiting for the database to be opened, post open()
//  - 'open'    - successfully opened the database, available for use
//  - 'closing' - waiting for the database to be closed, post close()
//  - 'closed'  - database has been successfully closed, should not be
//                 used except for another open() operation

class LevelUp extends EventEmitter {
  constructor (db, options, callback) {
    super()

    this.setMaxListeners(Infinity)

    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    if (!db || typeof db !== 'object') {
      let error = new InitializationError('Must provide db')
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

  open (callback) {
    var promise

    if (!callback) {
      callback = promisify()
      promise = callback.promise
    }

    if (this.isOpen()) {
      process.nextTick(callback, null, this)
      return promise
    }

    if (this._isOpening()) {
      this.once('open', () => { callback(null, this) })
      return promise
    }

    this.emit('opening')

    this.db.open(this.options, err => {
      if (err) {
        return callback(new OpenError(err))
      }
      this.db = this._db
      callback(null, this)
      this.emit('open')
      this.emit('ready')
    })

    return promise
  }

  close (callback) {
    var promise

    if (!callback) {
      callback = promisify()
      promise = callback.promise
    }

    if (this.isOpen()) {
      this.db.close(() => {
        this.emit('closed')
        callback.apply(null, {})
      })
      this.emit('closing')
      this.db = new DeferredLevelDOWN(this._db)
    } else if (this.isClosed()) {
      process.nextTick(callback)
    } else if (this.db.status === 'closing') {
      this.once('closed', callback)
    } else if (this._isOpening()) {
      this.once('open', () => {
        this.close(callback)
      })
    }

    return promise
  }

  isOpen () {
    return this.db.status === 'open'
  }

  _isOpening () {
    return this.db.status === 'opening'
  }

  isClosed () {
    return (/^clos|new/).test(this.db.status)
  }

  get (key, options, callback) {
    if (key === null || key === undefined) {
      throw new ReadError('get() requires a key argument')
    }

    var promise

    callback = getCallback(options, callback)

    if (!callback) {
      callback = promisify()
      promise = callback.promise
    }

    if (maybeError(this, callback)) { return promise }

    options = getOptions(options)

    this.db.get(key, options, (err, value) => {
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

  put (key, value, options, callback) {
    if (key === null || key === undefined) {
      throw new WriteError('put() requires a key argument')
    }

    var promise

    callback = getCallback(options, callback)

    if (!callback) {
      callback = promisify()
      promise = callback.promise
    }

    if (maybeError(this, callback)) { return promise }

    options = getOptions(options)

    this.db.put(key, value, options, err => {
      if (err) {
        return callback(new WriteError(err))
      }
      this.emit('put', key, value)
      callback()
    })

    return promise
  }

  del (key, options, callback) {
    if (key === null || key === undefined) {
      throw new WriteError('del() requires a key argument')
    }

    var promise

    callback = getCallback(options, callback)

    if (!callback) {
      callback = promisify()
      promise = callback.promise
    }

    if (maybeError(this, callback)) { return promise }

    options = getOptions(options)

    this.db.del(key, options, err => {
      if (err) {
        return callback(new WriteError(err))
      }
      this.emit('del', key)
      callback()
    })

    return promise
  }

  batch (arr, options, callback) {
    if (!arguments.length) {
      return new Batch(this)
    }

    if (!Array.isArray(arr)) {
      throw new WriteError('batch() requires an array argument')
    }

    var promise

    callback = getCallback(options, callback)

    if (!callback) {
      callback = promisify()
      promise = callback.promise
    }

    if (maybeError(this, callback)) { return promise }

    options = getOptions(options)

    arr = arr.map(function (op) {
      if (!op.type && op.key !== undefined && op.value !== undefined) { op.type = 'put' }
      return op
    })

    this.db.batch(arr, options, err => {
      if (err) {
        return callback(new WriteError(err))
      }
      this.emit('batch', arr)
      callback()
    })

    return promise
  }

  readStream (options) {
    return this.createReadStream(options)
  }

  createReadStream (options) {
    options = extend({ keys: true, values: true }, options)
    if (typeof options.limit !== 'number') { options.limit = -1 }
    return new IteratorStream(this.db.iterator(options), options)
  }

  keyStream (options) {
    return this.createKeyStream(options)
  }

  createKeyStream (options) {
    return this.createReadStream(extend(options, { keys: true, values: false }))
  }

  valueStream (options) {
    return this.createReadValueStream(options)
  }

  createReadValueStream (options) {
    return this.createReadStream(extend(options, { keys: false, values: true }))
  }

  toString () {
    return 'LevelUP'
  }
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

LevelUp.errors = errors
module.exports = LevelUp.default = LevelUp
