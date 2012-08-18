/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var bridge       = require('bindings')('levelup.node')

  , errors       = require('./errors')
  , readStream   = require('./read-stream')
  , writeStream  = require('./write-stream')
  , toEncoding   = require('./util').toEncoding
  , toBuffer     = require('./util').toBuffer
  , EventEmitter = require('events').EventEmitter
  , Creator      = require('./creator').Creator

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

  , extend = function (dst, src) {
      for (var p in src) dst[p] = src[p]
      return dst
    }

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

  , Database = {
        open: function (callback) {
          var execute = function () {
                var db = bridge.createDatabase()
                db.open(this.location, this.options, function (err) {
                  if (err) {
                    err = new errors.OpenError(err)
                    if (callback)
                      return callback(err)
                    this.pub.emit('error', err)
                  } else {
                    this.db = db
                    callback()
                    this.pub.emit('ready')
                  }
                }.bind(this))
              }.bind(this)

          if (this.isOpen())
            this.close(execute)
          else
            execute()
        }

      , close: function (callback) {
          if (this.isOpen()) {
            this.db.close(function () {
              this.pub.emit('closed')
              callback.apply(null, arguments)
            }.bind(this))
            this.db = null
          } else {
            callback()
          }
        }

      , isOpen: function () {
          return !!this.db
        }

      , get: function (key_, options_, callback_) {
          var callback = getCallback(options_, callback_)
            , options, key, err

          if (this.isOpen()) {
            options  = getOptions(options_, this.options)
            key      = toBuffer(key_, options.keyEncoding || options.encoding)
            this.db.get(key, options, function (err, value) {
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
            options  = getOptions(options_, this.options)
            key      = toBuffer(key,   options.keyEncoding   || options.encoding)
            value    = toBuffer(value, options.valueEncoding || options.encoding)
            this.db.put(key, value, options, function (err) {
              if (err) {
                err = new errors.WriteError(err)
                if (callback)
                  return callback(err)
                this.pub.emit('error', err)
              } else {
                this.pub.emit('put', key, value)
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
            options  = getOptions(options_, this.options)
            key      = toBuffer(key,   options.keyEncoding   || options.encoding)
            this.db.del(key, options, function (err) {
              if (err) {
                err = new errors.WriteError(err)
                if (callback)
                  return callback(err)
                this.pub.emit('error', err)
              } else {
                this.pub.emit('del', key)
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

          options       = getOptions(options_, this.options)
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
          this.db.batch(arr, options, function (err) {
            if (err) {
              err = new errors.WriteError(err)
              if (callback)
                return callback(err)
              this.pub.emit('error', err)
            } else {
              this.pub.emit('batch', arr)
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
            , function () {
                return bridge.createIterator(this.db, options)
              }.bind(this)
          )
        }

      , writeStream: function (options) {
         return writeStream.create(
              options || {}
            , this
          )
        }
    }

  , databaseCreator = new Creator('LevelUPDatabase')
      .setBase(EventEmitter)
      .setMethods(Database)
      .setReadOnlyProperties(function (args) {
        var props = { options: {} }
        Object.keys(defaultOptions).forEach(function (p) {
          props.options[p] = (args[1] && args[1][p]) || defaultOptions[p]
        })
        props.location = args[0]
        return props
      })

  , createDatabase = function (location, options) {
      if (typeof location != 'string')
        throw new errors.InitializationError('Must provide a location for the database')

      return databaseCreator.create(location, options)
    }

module.exports = {
    createDatabase : createDatabase
  , copy           : require('./util').copy
}