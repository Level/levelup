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
var Codec = require('level-codec')
var errors = require('level-errors')
var assert = require('assert')
var util = require('./util')

var WriteError = errors.WriteError
var ReadError = errors.ReadError
var NotFoundError = errors.NotFoundError
var OpenError = errors.OpenError
var EncodingError = errors.EncodingError
var InitializationError = errors.InitializationError

var getOptions = util.getOptions
var defaultOptions = util.defaultOptions
var dispatchError = util.dispatchError

function getCallback (options, callback) {
  return typeof options === 'function' ? options : callback
}

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
    if (callback) {
      return process.nextTick(callback, error)
    }
    throw error
  }

  assert.equal(typeof db.status, 'string', '.status required, old abstract-leveldown')

  this.options = extend(defaultOptions, getOptions(options))
  this._codec = new Codec(this.options)

  this._db = db
  this.db = new DeferredLevelDOWN(db)
  this.open(callback)
}

inherits(LevelUP, EventEmitter)

LevelUP.prototype.open = function (callback) {
  var self = this

  if (this.isOpen()) {
    if (callback) { process.nextTick(function () { callback(null, self) }) }
    return this
  }

  if (this._isOpening()) {
    return callback && this.once('open', function () { callback(null, self) })
  }

  this.emit('opening')

  this.db.open(this.options, function (err) {
    if (err) {
      return dispatchError(self, new OpenError(err), callback)
    }
    self.db = self._db
    if (callback) { callback(null, self) }
    self.emit('open')
    self.emit('ready')
  })
}

LevelUP.prototype.close = function (callback) {
  var self = this

  if (this.isOpen()) {
    this.db.close(function () {
      self.emit('closed')
      if (callback) { callback.apply(null, arguments) }
    })
    this.emit('closing')
    this.db = new DeferredLevelDOWN(this._db)
  } else if (this.isClosed() && callback) {
    return process.nextTick(callback)
  } else if (this.db.status === 'closing' && callback) {
    this.once('closed', callback)
  } else if (this._isOpening()) {
    this.once('open', function () {
      self.close(callback)
    })
  }
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

function maybeError (db, callback) {
  if (!db._isOpening() && !db.isOpen()) {
    dispatchError(db, new ReadError('Database is not open'), callback)
    return true
  }
}

function writeError (db, message, callback) {
  dispatchError(db, new WriteError(message), callback)
}

function readError (db, message, callback) {
  dispatchError(db, new ReadError(message), callback)
}

LevelUP.prototype.get = function (key_, options, callback) {
  var self = this
  var key

  callback = getCallback(options, callback)

  if (maybeError(this, callback)) { return }

  if (key_ === null || key_ === undefined || typeof callback !== 'function') {
    return readError(this, 'get() requires key and callback arguments', callback)
  }

  options = util.getOptions(options)
  key = this._codec.encodeKey(key_, options)

  options.asBuffer = this._codec.valueAsBuffer(options)

  this.db.get(key, options, function (err, value) {
    if (err) {
      if ((/notfound/i).test(err) || err.notFound) {
        err = new NotFoundError(
            'Key not found in database [' + key_ + ']', err)
      } else {
        err = new ReadError(err)
      }
      return dispatchError(self, err, callback)
    }
    if (callback) {
      try {
        value = self._codec.decodeValue(value, options)
      } catch (e) {
        return callback(new EncodingError(e))
      }
      callback(null, value)
    }
  })
}

LevelUP.prototype.put = function (key_, value_, options, callback) {
  var self = this
  var key
  var value

  callback = getCallback(options, callback)

  if (key_ === null || key_ === undefined) { return writeError(this, 'put() requires a key argument', callback) }

  if (maybeError(this, callback)) { return }

  options = getOptions(options)
  key = this._codec.encodeKey(key_, options)
  value = this._codec.encodeValue(value_, options)

  this.db.put(key, value, options, function (err) {
    if (err) {
      return dispatchError(self, new WriteError(err), callback)
    }
    self.emit('put', key_, value_)
    if (callback) { callback() }
  })
}

LevelUP.prototype.del = function (key_, options, callback) {
  var self = this
  var key

  callback = getCallback(options, callback)

  if (key_ === null || key_ === undefined) { return writeError(this, 'del() requires a key argument', callback) }

  if (maybeError(this, callback)) { return }

  options = getOptions(options)
  key = this._codec.encodeKey(key_, options)

  this.db.del(key, options, function (err) {
    if (err) {
      return dispatchError(self, new WriteError(err), callback)
    }
    self.emit('del', key_)
    if (callback) { callback() }
  })
}

LevelUP.prototype.batch = function (arr_, options, callback) {
  var self = this
  var arr

  if (!arguments.length) { return new Batch(this, this._codec) }

  callback = getCallback(options, callback)

  if (!Array.isArray(arr_)) { return writeError(this, 'batch() requires an array argument', callback) }

  if (maybeError(this, callback)) { return }

  options = getOptions(options)
  arr = self._codec.encodeBatch(arr_, options)
  arr = arr.map(function (op) {
    if (!op.type && op.key !== undefined && op.value !== undefined) { op.type = 'put' }
    return op
  })

  this.db.batch(arr, options, function (err) {
    if (err) {
      return dispatchError(self, new WriteError(err), callback)
    }
    self.emit('batch', arr_)
    if (callback) { callback() }
  })
}

LevelUP.prototype.readStream =
LevelUP.prototype.createReadStream = function (options) {
  options = extend({keys: true, values: true}, this.options, options)

  options.keyEncoding = options.keyEncoding
  options.valueEncoding = options.valueEncoding

  options = this._codec.encodeLtgt(options)
  options.keyAsBuffer = this._codec.keyAsBuffer(options)
  options.valueAsBuffer = this._codec.valueAsBuffer(options)

  if (typeof options.limit !== 'number') { options.limit = -1 }

  return new IteratorStream(this.db.iterator(options), extend(options, {
    decoder: this._codec.createStreamDecoder(options)
  }))
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

module.exports = LevelUP
module.exports.errors = require('level-errors')
