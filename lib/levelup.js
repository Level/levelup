/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var bridge       = require('bindings')('levelup.node')

  , errors       = require('./errors')
  , readStream   = require('./read-stream')
  , writeStream  = require('./write-stream')
  , toEncoding   = require('./util').toEncoding
  , toBuffer     = require('./util').toBuffer
  , extend       = require('./util').extend
  , EventEmitter = require('events').EventEmitter

  , defaultOptions = {
        createIfMissing : false
      , errorIfExists   : false
      , encoding        : 'utf8'
      , keyEncoding     : null
      , valueEncoding   : null
    }

  , encodingOpts = (function (enc) {
      var eo = {}
      enc.forEach(function (e) { eo[e] = { encoding: e } })
      return eo
    }('hex utf8 utf-8 ascii binary base64 ucs2 ucs-2 utf16le utf-16le'.split(' ')))

  , getOptions = function (options, globalOptions) {
      if (typeof options == 'string') // just an encoding
        options = extend({}, encodingOpts[options] || encodingOpts[defaultOptions.encoding])
      return extend(extend({}, globalOptions), options)
    }

  , getCallback = function (options_, callback_) {
      if (typeof options_ == 'function')
        return options_
      return callback_
    }

function LevelUP (location, options) {
  this.__proto__.__proto__ = EventEmitter.prototype
  EventEmitter.call(this)
  this._options = extend(extend({}, defaultOptions), options)
  this._location = location
}

LevelUP.prototype = {
    open: function (callback) {
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
                callback(null, this)
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
        this._db.close(function () {
          this.emit('closed')
          callback.apply(null, arguments)
        }.bind(this))
        this._db = null
      } else {
        callback()
      }
    }

  , isOpen: function () {
      return !!this._db
    }

  , get: function (key_, options_, callback_) {
      var callback = getCallback(options_, callback_)
        , options, key, err

      if (this.isOpen()) {
        options  = getOptions(options_, this._options)
        key      = toBuffer(key_, options.keyEncoding || options.encoding)
        this._db.get(key, options, function (err, value) {
          if (err) {
            err = new errors.NotFoundError('Key not found in database [' + key_ + ']')
            if (callback)
              return callback(err)
            throw err
          }
          callback && callback(null, toEncoding(value, options.valueEncoding || options.encoding), key_)
        })
      } else {
        err = new errors.ReadError('Database has not been opened')
        if (callback)
          callback(err)
        else
          throw err
      }
    }

  , put: function (key, value, options_, callback_) {
      var callback = getCallback(options_, callback_)
        , options, err

      if (this.isOpen()) {
        options  = getOptions(options_, this._options)
        key      = toBuffer(key,   options.keyEncoding   || options.encoding)
        value    = toBuffer(value, options.valueEncoding || options.encoding)
        this._db.put(key, value, options, function (err) {
          if (err) {
            err = new errors.WriteError(err)
            if (callback)
              return callback(err)
            this.emit('error', err)
          } else {
            this.emit('put', key, value)
            callback && callback(null, key, value)
          }
        }.bind(this))
      } else {
        err = new errors.WriteError('Database has not been opened')
        if (callback)
          callback(err)
        else
          throw err
      }
    }

  , del: function (key, options_, callback_) {
      var callback = getCallback(options_, callback_)
        , options, err

      if (this.isOpen()) {
        options  = getOptions(options_, this._options)
        key      = toBuffer(key,   options.keyEncoding   || options.encoding)
        this._db.del(key, options, function (err) {
          if (err) {
            err = new errors.WriteError(err)
            if (callback)
              return callback(err)
            this.emit('error', err)
          } else {
            this.emit('del', key)
            callback && callback(null, key)
          }
        }.bind(this))
      } else {
        err = new errors.WriteError('Database has not been opened')
        if (callback)
          callback(err)
        else
          throw err
      }
    }

  , batch: function (arr, options_, callback_) {
      var callback = getCallback(options_, callback_)
        , empty    = {}
        , options, keyEncoding, valueEncoding, err

      if (!this.isOpen()) {
        err = new errors.WriteError('Database has not been opened')
        if (callback)
          return callback(err)
        else
          throw err
      }

      options       = getOptions(options_, this._options)
      keyEncoding   = options.keyEncoding   || options.encoding
      valueEncoding = options.valueEncoding || options.encoding
      arr           = arr.map(function (e) {
        if (e.type !== undefined && e.key !== undefined) {
          var o = {
              type  : e.type
            , key   : toBuffer(e.key, keyEncoding)
          }
          if (e.value !== undefined)
            o.value = toBuffer(e.value, valueEncoding)
          return o
        }
        return empty
      })
      this._db.batch(arr, options, function (err) {
        if (err) {
          err = new errors.WriteError(err)
          if (callback)
            return callback(err)
          this.emit('error', err)
        } else {
          this.emit('batch', arr)
          callback && callback()
        }
      }.bind(this))
    }

  , readStream: function (options) {
      if (typeof options != 'object')
        options = {}
      return readStream.create(
          options
        , this
        , function (options) {
            return bridge.createIterator(this._db, options)
          }.bind(this)
      )
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

  if (typeof callback != 'function')
    throw new errors.InitializationError('Must provide a callback function')
  if (typeof location != 'string')
    return callback(new errors.InitializationError('Must provide a location for the database'))

  ;new LevelUP(location, options).open(callback)
}

module.exports.copy = require('./util').copy