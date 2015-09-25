/* Copyright (c) 2012-2016 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License
 * <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var EventEmitter        = require('events').EventEmitter
  , inherits            = require('util').inherits
  , extend              = require('xtend')
  , prr                 = require('prr')
  , DeferredLevelDOWN   = require('deferred-leveldown')
  , IteratorStream      = require('level-iterator-stream')

  , errors              = require('level-errors')
  , WriteError          = errors.WriteError
  , ReadError           = errors.ReadError
  , NotFoundError       = errors.NotFoundError
  , OpenError           = errors.OpenError
  , InitializationError = errors.InitializationError

  , util                = require('./util')
  , Batch               = require('./batch')

  , dispatchError       = util.dispatchError
  , isDefined           = util.isDefined
  , validateDOWN        = util.validateDOWN
  , getOptions          = util.getOptions

function getCallback (options, callback) {
  return typeof options == 'function' ? options : callback
}

// Possible LevelDOWN#status values:
//  - 'new'     - newly created, not opened or closed
//  - 'opening' - waiting for the database to be opened, post open()
//  - 'open'    - successfully opened the database, available for use
//  - 'closing' - waiting for the database to be closed, post close()
//  - 'closed'  - database has been successfully closed, should not be
//                 used except for another open() operation

function LevelUP (db, options, callback) {
  if (!(this instanceof LevelUP))
    return new LevelUP(db, options, callback)

  var error

  EventEmitter.call(this)
  this.setMaxListeners(Infinity)

  if (typeof options == 'function') {
    callback = options
    options  = {}
  }

  if (!db || typeof db != 'object') {
    error = new InitializationError(
        'Must provide db')
    if (callback) {
      return process.nextTick(function () {
        callback(error)
      })
    }
    throw error
  }
  validateDOWN(db)

  this.options = getOptions(options)
  // this.options?

  this._db     = db
  this.db      = new DeferredLevelDOWN(db)
  this.open(callback)
}

inherits(LevelUP, EventEmitter)

LevelUP.prototype.open = function (callback) {
  var self = this

  if (this.isOpen()) {
    if (callback)
      process.nextTick(function () { callback(null, self) })
    return this
  }

  if (this._isOpening()) {
    return callback && this.once(
        'open'
      , function () { callback(null, self) }
    )
  }

  this.emit('opening')

  this.db.open(this.options, function (err) {
    if (err) {
      return dispatchError(self, new OpenError(err), callback)
    } else {
      self.db = self._db
      if (callback)
        callback(null, self)
      self.emit('open')
      self.emit('ready')
    }
  })
}

LevelUP.prototype.close = function (callback) {
  var self = this

  if (this.isOpen()) {
    this.db.close(function () {
      self.emit('closed')
      if (callback)
        callback.apply(null, arguments)
    })
    this.emit('closing')
    this.db = new DeferredLevelDOWN(this._db)
  } else if (this.isClosed() && callback) {
    return process.nextTick(callback)
  } else if (this.db.status == 'closing' && callback) {
    this.once('closed', callback)
  } else if (this._isOpening()) {
    this.once('open', function () {
      self.close(callback)
    })
  }
}

LevelUP.prototype.isOpen = function () {
  return this.db.status == 'open'
}

LevelUP.prototype._isOpening = function () {
  return this.db.status == 'opening'
}

LevelUP.prototype.isClosed = function () {
  return (/^clos|new/).test(this.db.status)
}

function maybeError(db, callback) {
  if (!db._isOpening() && !db.isOpen()) {
    dispatchError(
        db
      , new ReadError('Database is not open')
      , callback
    )
    return true
  }
}

function writeError (db, message, callback) {
  dispatchError(
      db
     , new WriteError(message)
     , callback
  )
}

function readError (db, message, callback) {
  dispatchError(
      db
     , new ReadError(message)
     , callback
  )
}

LevelUP.prototype.get = function (key, options, callback) {
  var self = this

  callback = getCallback(options, callback)

  if (maybeError(this, callback))
    return

  if (key === null || key === undefined || 'function' !== typeof callback) {
    return readError(this
      , 'get() requires key and callback arguments', callback)
  }

  options = getOptions(options)

  this.db.get(key, options, function (err, value) {
    if (err) {
      if ((/notfound/i).test(err) || err.notFound) {
        err = new NotFoundError(
            'Key not found in database [' + key + ']', err)
      } else {
        err = new ReadError(err)
      }
      return dispatchError(self, err, callback)
    }
    if (callback) callback(null, value)
  })
}

LevelUP.prototype.put = function (key, value, options, callback) {
  var self = this

  callback = getCallback(options, callback)

  if (key === null || key === undefined)
    return writeError(this, 'put() requires a key argument', callback)

  if (maybeError(this, callback))
    return

  options = getOptions(options)

  this.db.put(key, value, options, function (err) {
    if (err) {
      return dispatchError(self, new WriteError(err), callback)
    } else {
      self.emit('put', key, value)
      if (callback)
        callback()
    }
  })
}

LevelUP.prototype.del = function (key, options, callback) {
  var self = this

  callback = getCallback(options, callback)

  if (key === null || key === undefined)
    return writeError(this, 'del() requires a key argument', callback)

  if (maybeError(this, callback))
    return

  options = getOptions(options)

  this.db.del(key, options, function (err) {
    if (err) {
      return dispatchError(self, new WriteError(err), callback)
    } else {
      self.emit('del', key)
      if (callback)
        callback()
    }
  })
}

LevelUP.prototype.batch = function (arr, options, callback) {
  var self = this

  if (!arguments.length)
    return new Batch(this)

  callback = getCallback(options, callback)

  if (!Array.isArray(arr))
    return writeError(this, 'batch() requires an array argument', callback)

  if (maybeError(this, callback))
    return

  options  = getOptions(options)
  arr      = arr.map(function (op) {
    if (!op.type && op.key !== undefined && op.value !== undefined)
      op.type = 'put'
    return op
  })

  this.db.batch(arr, options, function (err) {
    if (err) {
      return dispatchError(self, new WriteError(err), callback)
    } else {
      self.emit('batch', arr)
      if (callback)
        callback()
    }
  })
}

LevelUP.prototype.readStream =
LevelUP.prototype.createReadStream = function (options) {
  options = extend( {keys: true, values: true}, this.options, options)

  if ('number' !== typeof options.limit)
    options.limit = -1

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

module.exports         = LevelUP
module.exports.errors  = errors
