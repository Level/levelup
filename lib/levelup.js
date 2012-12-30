/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var bridge       = require('bindings')('levelup.node')

  , errors       = require('./errors')
  , readStream   = require('./read-stream')
  , writeStream  = require('./write-stream')
  , toEncoding   = require('./util').toEncoding
  , toSlice      = require('./util').toSlice
  , extend       = require('./util').extend
  , encodings    = require('./util').encodings
  , EventEmitter = require('events').EventEmitter

  , defaultOptions = {
        createIfMissing : false
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

  , getOptions = function (options, globalOptions) {
      return typeof options == 'string' // just an encoding
        ? options = extend({}, encodingOpts[options] || encodingOpts[defaultOptions.encoding])
        : extend(extend({}, globalOptions), options)
    }

  , getCallback = function (options_, callback_) {
      return typeof options_ == 'function' ? options_ : callback_
    }

// Possible this._status values:
//  - 'new'     - newly created, not opened or closed
//  - 'opening' - waiting for the database to be opened, post open()
//  - 'open'    - successfully opened the database, available for use
//  - 'closing' - waiting for the database to be closed, post close()
//  - 'closed'  - database has been successfully closed, should not be used
//                except for another open() operation

function LevelUP (location, options) {
  this.__proto__.__proto__ = EventEmitter.prototype
  EventEmitter.call(this)
  this._options = extend(extend({}, defaultOptions), options)
  this._location = location
  this._status = 'new'
}

LevelUP.prototype = {
    open: function (callback) {
      this._status = 'opening'
      var execute = function () {
        var db = bridge.createDatabase()
        db.open(this._location, this._options, function (err) {
          if (err) {
            err = new errors.OpenError(err)
            if (callback)
              return callback(err)
            this.emit('error', err)
          } else {
            this._db = db
            this._status = 'open'
            callback && callback(null, this)
            this.emit('ready')
          }
        }.bind(this))
      }.bind(this)

      if (this.isOpen())
        this.close(execute)
      else
        execute()
    }

    //TODO: we can crash Node by submitting an operation between close() and the actual closing of the database
  , close: function (callback) {
      if (this.isOpen()) {
        this._status = 'closing'
        this._db.close(function () {
          this._status = 'closed'
          this.emit('closed')
          callback && callback.apply(null, arguments)
        }.bind(this))
        this._db = null
      } else if (this._status == 'closed') {
        callback && callback()
      } else if (this._status == 'closing') {
        this.on('closed', callback)
      } else if (this._status == 'opening') {
        this.on('ready', function () {
          this.close(callback)
        })
      } else {
        var err = new errors.CloseError('Cannot close unopened database')
        if (callback)
          return callback(err)
        throw err
      }
    }

  , isOpen: function () {
      return this._status == 'open'
    }

    // in between these two there is 'new' and 'opening'

  , isClosed: function () {
      // covers 'closing' and 'closed'
      return (/^clos/).test(this._status)
    }

  , get: function (key_, options_, callback_) {
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
        options  = getOptions(options_, this._options)
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
          callback && callback(null, toEncoding[valueEnc](value), key_)
        })
      } else {
        err = new errors.ReadError('Database is not open')
        if (callback)
          return callback(err)
        throw err
      }
    }

  , put: function (key_, value_, options_, callback_) {
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
        options  = getOptions(options_, this._options)
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
            callback && callback(null, key, value)
          }
        }.bind(this))
      } else {
        err = new errors.WriteError('Database is not open')
        if (callback)
          return callback(err)
        throw err
      }
    }

  , del: function (key_, options_, callback_) {
      var open, callback, options, err, key

      if (!(open = this.isOpen()) && !this.isClosed()) {
        // limbo, defer the operation
        return this.once('ready', function () {
          this.del(key_, options_, callback_)
        })
      }

      callback = getCallback(options_, callback_)

      if (open) {
        options  = getOptions(options_, this._options)
        key      = toSlice[options.keyEncoding   || options.encoding](key_)
        this._db.del(key, options, function (err) {
          if (err) {
            err = new errors.WriteError(err)
            if (callback)
              return callback(err)
            this.emit('error', err)
          } else {
            this.emit('del', key_)
            callback && callback(null, key)
          }
        }.bind(this))
      } else {
        err = new errors.WriteError('Database is not open')
        if (callback)
          return callback(err)
        throw err
      }
    }

  , batch: function (arr_, options_, callback_) {
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

      options       = getOptions(options_, this._options)
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
      } else
        arr = arr_
      this._db.batch(arr, options, function (err) {
        if (err) {
          err = new errors.WriteError(err)
          if (callback)
            return callback(err)
          this.emit('error', err)
        } else {
          this.emit('batch', arr_)
          callback && callback(null, arr)
        }
      }.bind(this))
    }

  , approximateSize: function(start, end, callback) {
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
        } else {
          callback && callback(null, size)
        }
      });
    }

  , readStream: function (options) {
      options = extend(extend({}, this._options), typeof options == 'object' ? options : {})
      return readStream.create(
          options
        , this
        , function (options) {
            return bridge.createIterator(this._db, options)
          }.bind(this)
      )
    }

  , keyStream: function (options) {
      return this.readStream(extend(options ? extend({}, options) : {}, { keys: true, values: false }))
    }

  , valueStream: function (options) {
      return this.readStream(extend(options ? extend({}, options) : {}, { keys: false, values: true }))
    }

  , writeStream: function (options) {
     return writeStream.create(
          options || {}
        , this
      )
    }

  , toString: function () {
      return 'LevelUP'
    }
}

module.exports = function (location, options, callback) {
  if (typeof options == 'function') {
    callback = options
    options = {}
  }

  if (typeof location != 'string') {
    var message = 'Must provide a location for the database'
    var error = new errors.InitializationError(message)

    if (callback) {
      return callback(error)
    }

    throw error
  }

  var levelup = new LevelUP(location, options)
  levelup.open(callback)
  return levelup
}

module.exports.copy = require('./util').copy