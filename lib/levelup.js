/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var bridge       = require('bindings')('levelup.node')
  , EventEmitter = require('events').EventEmitter
  , inherits     = require('util').inherits

  , errors       = require('./errors')
  , readStream   = require('./read-stream')
  , writeStream  = require('./write-stream')
  , extend       = require('util')._extend
  , toEncoding   = require('./util').toEncoding
  , toSlice      = require('./util').toSlice
  , encodings    = require('./util').encodings

  , defaultOptions = {
        createIfMissing : true
      , errorIfExists   : false
      , encoding        : 'utf8'
      , keyEncoding     : null
      , valueEncoding   : null
      , compression     : true
    }

  , encodingOpts = (function () {
      var eo = {}
      encodings.forEach(function (e) { eo[e] = { encoding: e } })
      return eo
    }())

, getCallback = function (options_, callback_) {
  return typeof options_ == 'function' ? options_ : callback_
}

module.exports = function (location, options_, callback) {
  if (typeof options_ == 'function') {
    callback = options_
    options_ = {}
  }

  if (typeof location != 'string') {
    var message = 'Must provide a location for the database'
    var error = new errors.InitializationError(message)

    if (callback) {
      return callback(error)
    }

    throw error
  }

  var globalOptions = extend(extend({}, defaultOptions), options_)

  // Possible this._status values:
  //  - 'new'     - newly created, not opened or closed
  //  - 'opening' - waiting for the database to be opened, post open()
  //  - 'open'    - successfully opened the database, available for use
  //  - 'closing' - waiting for the database to be closed, post close()
  //  - 'closed'  - database has been successfully closed, should not be used
  //                except for another open() operation

  function LevelUP (location) {
    EventEmitter.call(this)
    this.setMaxListeners(Infinity)
    
    this._location = location
    this._status = 'new'
  }

  inherits(LevelUP, EventEmitter)

  LevelUP.prototype.open = function (callback) {

    if (this.isOpen()) {
      if (callback)
	process.nextTick(callback.bind(null, null, this))
      return this
    }

    if (this._status == 'opening')
      return callback && this.once('open', callback.bind(null, null, this))

    this._status = 'opening'
    var execute = function () {
      var db = bridge.createDatabase()
      db.open(this._location, globalOptions, function (err) {
	if (err) {
          err = new errors.OpenError(err)
          if (callback)
            return callback(err)
          this.emit('error', err)
	} else {
          this._db = db
          this._status = 'open'
          if (callback)
            callback(null, this)
          this.emit('open')
          this.emit('ready')
	}
      }.bind(this))
    }.bind(this)

    execute()
    this.emit('opening')
  }

  //TODO: we can crash Node by submitting an operation between close() and the actual closing of the database
  LevelUP.prototype.close = function (callback) {
    if (this.isOpen()) {
      this._status = 'closing'
      this._db.close(function () {
	this._status = 'closed'
	this.emit('closed')
	if (callback)
          callback.apply(null, arguments)
      }.bind(this))
      this.emit('closing')
      this._db = null
    } else if (this._status == 'closed') {
      if (callback)
	callback()
    } else if (this._status == 'closing') {
      if (callback)
	this.once('closed', callback)
    } else if (this._status == 'opening') {
      this.once('open', function () {
	this.close(callback)
      })
    } else {
      var err = new errors.CloseError('Cannot close unopened database')
      if (callback)
	return callback(err)
      this.emit('error', err)
    }
  }

  LevelUP.prototype.isOpen = function () {
    return this._status == 'open'
  }

  // in between these two there is 'new' and 'opening'

  LevelUP.prototype.isClosed = function () {
    // covers 'closing' and 'closed'
    return (/^clos/).test(this._status)
  }

  LevelUP.prototype.get = function (key_, options_, callback_) {
    var open = this.isOpen()
    , callback, options, key, keyEnc, valueEnc, err
    
    if (!open && !this.isClosed()) {
      // limbo, defer the operation
      return this.once('ready', function () {
	this.get(key_, options_, callback_)
      })
    }
    
    callback = getCallback(options_, callback_)
    
    if (open) {
      options  = getOptions(options_)
      keyEnc   = options.keyEncoding   || options.encoding
      valueEnc = options.valueEncoding || options.encoding
      key      = toSlice[keyEnc](key_)
      options.asBuffer = valueEnc != 'utf8' && valueEnc != 'json'

      this._db.get(key, options, function (err, value) {
	if (err) {
          err = new errors.NotFoundError('Key not found in database [' + key_ + ']')
          if (callback)
            return callback(err)
          throw err
	}
	if (callback)
          callback(null, toEncoding[valueEnc](value), key_)
      })
    } else {
      err = new errors.ReadError('Database is not open')
      if (callback)
	return callback(err)
      throw err
    }
  }

  LevelUP.prototype.put = function (key_, value_, options_, callback_) {
    var open = this.isOpen()
    , callback, options, err, key, value
    
    if (!open && !this.isClosed()) {
      // limbo, defer the operation
      return this.once('ready', function () {
	this.put(key_, value_, options_, callback_)
      })
    }
    
    callback = getCallback(options_, callback_)
    
    if (open) {
      options  = getOptions(options_)
      key      = toSlice[options.keyEncoding   || options.encoding](key_)
      value    = toSlice[options.valueEncoding || options.encoding](value_)

      this._db.put(key, value, options, function (err) {
	if (err) {
          err = new errors.WriteError(err)
          if (callback)
            return callback(err)
          this.emit('error', err)
	} else {
          this.emit('put', key_, value_)
          if (callback)
            callback(null, key, value)
	}
      }.bind(this))
    } else {
      err = new errors.WriteError('Database is not open')
      if (callback)
	return callback(err)
      throw err
    }
  }

  LevelUP.prototype.del = function (key_, options_, callback_) {
    var open, callback, options, err, key
    
    if (!(open = this.isOpen()) && !this.isClosed()) {
      // limbo, defer the operation
      return this.once('ready', function () {
	this.del(key_, options_, callback_)
      })
    }
    
    callback = getCallback(options_, callback_)
    
    if (open) {
      options  = getOptions(options_)
      key      = toSlice[options.keyEncoding   || options.encoding](key_)
      this._db.del(key, options, function (err) {
	if (err) {
          err = new errors.WriteError(err)
          if (callback)
            return callback(err)
          this.emit('error', err)
	} else {
          this.emit('del', key_)
          if (callback)
            callback(null, key)
	}
      }.bind(this))
    } else {
      err = new errors.WriteError('Database is not open')
      if (callback)
	return callback(err)
      throw err
    }
  }

  LevelUP.prototype.batch = function (arr_, options_, callback_) {
    var callback, options, keyEncoding, valueEncoding, err, arr
    
    if (!this.isOpen() && !this.isClosed()) {
      return this.once('ready', function () {
	this.batch(arr_, options_, callback_)
      })
    }
    
    callback = getCallback(options_, callback_)
    
    if (this.isClosed()) {
      err = new errors.WriteError('Database is not open')
      if (callback)
	return callback(err)
      throw err
    }
    
    options       = getOptions(options_)
    keyEncoding   = options.keyEncoding   || options.encoding
    valueEncoding = options.valueEncoding || options.encoding
    
    // If we're not dealing with plain utf8 strings or plain
    // Buffers then we have to do some work on the array to
    // encode the keys and/or values. This includes JSON types.
    if ((keyEncoding != 'utf8' && keyEncoding != 'binary')
	|| (valueEncoding != 'utf8' && valueEncoding != 'binary')) {

      arr = arr_.map(function (e) {
	if (e.type !== undefined && e.key !== undefined) {
          var o = {
            type  : e.type
            , key   : toSlice[keyEncoding](e.key)
          }
          if (e.value !== undefined)
            o.value = toSlice[valueEncoding](e.value)
          return o
	}
	return {}
      })
    } else {
      arr = arr_
    }

    this._db.batch(arr, options, function (err) {
      if (err) {
	err = new errors.WriteError(err)
	if (callback)
          return callback(err)
	this.emit('error', err)
      } else {
	this.emit('batch', arr_)
	if (callback)
          callback(null, arr)
      }
    }.bind(this))
  }

  LevelUP.prototype.approximateSize = function(start, end, callback) {
    var err

    if (!this.isOpen() && !this.isClosed()) {
      return this.once('ready', function () {
	this.approximateSize(start, end, callback)
      })
    }

    if (this.isClosed()) {
      err = new errors.WriteError('Database is not open')
      if (callback)
	return callback(err)
      throw err
    }

    this._db.approximateSize(start, end, function(err, size) {
      if (err) {
	err = new errors.OpenError(err)
	if (callback)
          return callback(err)
	this.emit('error', err)
      } else if (callback)
	callback(null, size)
    }.bind(this))
  }

  LevelUP.prototype.readStream = function (options) {
    options = extend(extend({}, globalOptions), typeof options == 'object' ? options : {})
    return readStream.create(
      options
      , this
      , function (options) {
        return bridge.createIterator(this._db, options)
      }.bind(this)
    )
  }

  LevelUP.prototype.keyStream = function (options) {
    return this.readStream(
      extend(options ? extend({}, options) : {}
	     , { keys: true, values: false })
    )
  }

  LevelUP.prototype.valueStream = function (options) {
    return this.readStream(
      extend(options ? extend({}, options) : {}
	     , { keys: false, values: true })
    )
  }

  LevelUP.prototype.writeStream = function (options) {
    return writeStream.create(
      options || {}
      , this
    )
  }

  LevelUP.prototype.toString = function () {
    return 'LevelUP'
  }

  LevelUP.prototype.hasOptions = function (options) {
    for (k in options) {
      if (!globalOptions.hasOwnProperty(k) || globalOptions[k] !== options[k]) 
	return false
    }
    return true
  }

  function getOptions(options) {
    if (typeof options == 'string')
      return extend({}, encodingOpts[options] || encodingOpts[defaultOptions.encoding])
    return extend(extend({}, globalOptions), options)
  }

  var levelup = new LevelUP(location)
  levelup.open(callback)
  return levelup
}

module.exports.copy = require('./util').copy
