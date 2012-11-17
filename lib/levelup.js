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
  this.status = "new"
}

LevelUP.prototype = {
    open: function (callback) {
      this.status = "opening"
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
            this.status = "open"
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
        this.status = "closing"
        this._db.close(function () {
          this.status = "closed"
          this.emit('closed')
          callback.apply(null, arguments)
        }.bind(this))
        this._db = null
      } else if (this.status === "closed") {
        callback()
      } else if (this.status === "closing") {
        this.on("closed", callback)
      } else if (this.status === "opening") {
        this.on("ready", function () {
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
      return this.status === "open"
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
        this.once("ready", function () {
          this.get(key_, options_, callback_)
        })
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
            // Node 0.9 bug, do this in current tick and a copy() operation will core dump
            callback && process.nextTick(callback.bind(null, null, key, value))
          }
        }.bind(this))
      } else {
        this.once("ready", function () {
          this.put(key, value, options_, callback_)
        })
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
        this.once("ready", function () {
          this.del(key, options_, callback_)
        })
      }
    }

  , batch: function (arr, options_, callback_) {
      var callback = getCallback(options_, callback_)
        , empty    = {}
        , options, keyEncoding, valueEncoding, err

      if (!this.isOpen()) {
        return this.once("ready", function () {
          this.batch(arr, options_, callback_)
        })
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
      return this.readStream(extend(options || {}, { keys: true, values: false }))
    }

  , valueStream: function (options) {
      return this.readStream(extend(options || {}, { keys: false, values: true }))
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
