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
  , encodingOpts = require('./util').encodingOpts

  , defaultOptions = {
        createIfMissing : true
      , errorIfExists   : false
      , encoding        : 'utf8'
      , keyEncoding     : null
      , valueEncoding   : null
      , compression     : true
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

  var db, globalOptions = extend(extend({}, defaultOptions), options_)

  // Possible status values:
  //  - 'new'     - newly created, not opened or closed
  //  - 'opening' - waiting for the database to be opened, post open()
  //  - 'open'    - successfully opened the database, available for use
  //  - 'closing' - waiting for the database to be closed, post close()
  //  - 'closed'  - database has been successfully closed, should not be used
  //                except for another open() operation
  var status = 'new'

  function LevelUP () {
    EventEmitter.call(this)
    this.setMaxListeners(Infinity)
  }

  inherits(LevelUP, EventEmitter)

  LevelUP.prototype.open = function (callback) {

    if (isOpen()) {
      if (callback)
	process.nextTick(callback.bind(null, null, this))
      return this
    }

    if (status == 'opening')
      return callback && this.once('open', callback.bind(null, null, this))

    setStatus('opening')
    var execute = function () {
      var db_ = bridge.createDatabase()
      db_.open(location, globalOptions, function (err) {
	if (err) {
          err = new errors.OpenError(err)
          if (callback)
            return callback(err)
          this.emit('error', err)
	} else {
          db = db_
          setStatus('open')
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
    if (isOpen()) {
      setStatus('closing')
      db.close(function () {
	setStatus('closed')
	this.emit('closed')
	if (callback)
          callback.apply(null, arguments)
      }.bind(this))
      this.emit('closing')
      db = null
    } else if (status == 'closed') {
      if (callback)
	callback()
    } else if (status == 'closing') {
      if (callback)
	this.once('closed', callback)
    } else if (status == 'opening') {
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

  LevelUP.prototype.get = function (key_, options_, callback_) {
    var callback, options, key, valueEnc, err
    
    if (inLimbo()) {
      return this.once('ready', function () {
	this.get(key_, options_, callback_)
      })
    }
    
    callback = getCallback(options_, callback_)
    
    if (isOpen()) {
      options  = getOptions(options_)
      key      = toSlice[getKeyEncoding(options)](key_)
      valueEnc = getValueEncoding(options)
      options.asBuffer = valueEnc != 'utf8' && valueEnc != 'json'

      db.get(key, options, function (err, value) {
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
    var callback, options, err, key, value
    
    if (inLimbo()) {
      return this.once('ready', function () {
	this.put(key_, value_, options_, callback_)
      })
    }
    
    callback = getCallback(options_, callback_)
    
    if (isOpen()) {
      options  = getOptions(options_)
      key      = toSlice[getKeyEncoding(options)](key_)
      value    = toSlice[getValueEncoding(options)](value_)

      db.put(key, value, options, function (err) {
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
    var callback, options, err, key
    
    if (inLimbo()) {
      return this.once('ready', function () {
	this.del(key_, options_, callback_)
      })
    }
    
    callback = getCallback(options_, callback_)
    
    if (isOpen()) {
      options  = getOptions(options_)
      key      = toSlice[getKeyEncoding(options)](key_)
      db.del(key, options, function (err) {
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
    
    if (inLimbo()) {
      return this.once('ready', function () {
	this.batch(arr_, options_, callback_)
      })
    }
    
    callback = getCallback(options_, callback_)
    
    if (isClosed()) {
      err = new errors.WriteError('Database is not open')
      if (callback)
	return callback(err)
      throw err
    }
    
    options       = getOptions(options_)
    keyEncoding   = getKeyEncoding(options)
    valueEncoding = getValueEncoding(options)
    
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

    db.batch(arr, options, function (err) {
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

    if (inLimbo()) {
      return this.once('ready', function () {
	this.approximateSize(start, end, callback)
      })
    }

    if (isClosed()) {
      err = new errors.WriteError('Database is not open')
      if (callback)
	return callback(err)
      throw err
    }

    db.approximateSize(start, end, function(err, size) {
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
        return bridge.createIterator(db, options)
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
    return writeStream.create(options || {}, this)
  }

  LevelUP.prototype.hasOptions = function (options) {
    for (k in options) {
      if (!globalOptions.hasOwnProperty(k) || globalOptions[k] !== options[k]) 
	return false
    }
    return true
  }

  LevelUP.prototype.isOpen = function () { return isOpen() }
  LevelUP.prototype.isClosed = function () { return isClosed() }
  LevelUP.prototype.toString = function () { return 'LevelUP' }
  LevelUP.prototype.location = function () { return location }

  function setStatus (value) { status = value }
  function inLimbo () { return !isOpen() && !isClosed() }
  function isOpen () { return status == 'open' }
  function isClosed () { return (/^clos/).test(status) }

  function getOptions (options) {
    if (typeof options == 'string')
      return extend({}, encodingOpts[options] || encodingOpts[defaultOptions.encoding])
    return extend(extend({}, globalOptions), options)
  }

  function getCallback (options, callback) {
    return typeof options == 'function' ? options : callback
  }

  function getKeyEncoding (options) {
    return options.keyEncoding || options.encoding
  }

  function getValueEncoding (options) {
    return options.valueEncoding || options.encoding
  }

  var levelup = new LevelUP()
  levelup.open(callback)
  return levelup
}

module.exports.copy = require('./util').copy
