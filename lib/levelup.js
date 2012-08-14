/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var bridge       = require('bindings')('levelup.node')

  , errors       = require('./errors')
  , ReadStream   = require('./read-stream')
  , WriteStream  = require('./write-stream')
  , toEncoding   = require('./util').toEncoding
  , toBuffer     = require('./util').toBuffer
  , EventEmitter = require('events').EventEmitter

  , defaultOptions = {
        createIfMissing : false
      , errorIfExists   : false
      , encoding        : 'utf8'
    }

  , encodingOpts = (function (enc) {
      var eo = {}
      enc.forEach(function (e) { eo[e] = { encoding: e } })
      return eo
    }('hex utf8 utf-8 ascii binary base64 ucs2 ucs-2 utf16le utf-16le'.split(' ')))

  , getOptions = function (options, defaultEncoding) {
      if (typeof options == 'string')
        return encodingOpts[options] || encodingOpts[defaultOptions.encoding]
      else if (typeof options == 'object') {
        if ((options.encoding && encodingOpts[options.encoding]))
          return options
        if (options.keyEncoding
              && options.valueEncoding
              && encodingOpts[options.keyEncoding]
              && encodingOpts[options.valueEncoding])
          return options
      }
      return encodingOpts[defaultEncoding] || encodingOpts[defaultOptions.encoding]
    }

  , getCallback = function (options_, callback_) {
      if (typeof options_ == 'function')
        return options_
      return callback_
    }

  , Database = {
        open: function (callback) {
          var options = {}
            , execute = function () {
                var db = bridge.createDatabase()
                Object.keys(defaultOptions).forEach(function (p) {
                  options[p] = this[p]
                }.bind(this))
                db.open(this.location, options, function (err) {
                  if (err) {
                    err = new errors.OpenError(err)
                    if (callback)
                      return callback(err)
                    this.ee.emit('error', err)
                  } else {
                    this.db = db
                    callback()
                    this.ee.emit('ready')
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
              this.ee.emit('closed')
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
            options  = getOptions(options_, this.encoding)
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
            options  = getOptions(options_, this.encoding)
            key      = toBuffer(key,   options.keyEncoding   || options.encoding)
            value    = toBuffer(value, options.valueEncoding || options.encoding)
            this.db.put(key, value, options, function (err) {
              if (err) {
                err = new errors.WriteError(err)
                if (callback)
                  return callback(err)
                this.ee.emit('error', err)
              } else {
                this.ee.emit('put', key, value)
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
            options  = getOptions(options_, this.encoding)
            key      = toBuffer(key,   options.keyEncoding   || options.encoding)
            this.db.del(key, options, function (err) {
              if (err) {
                err = new errors.WriteError(err)
                if (callback)
                  return callback(err)
                this.ee.emit('error', err)
              } else {
                this.ee.emit('del', key)
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

          options       = getOptions(options_, this.encoding)
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
              this.ee.emit('error', err)
            } else {
              this.ee.emit('batch', arr)
              callback && callback()
            }
          }.bind(this))
        }

      , readStream: function (options) {
          return new ReadStream(
              options || {}
            , this
            , function () {
                return bridge.createIterator(this.db)
              }.bind(this)
          )
        }

      , writeStream: function (options) {
         return new WriteStream(
              options || {}
            , this
          )
        }

      , toString: function () {
          return "LevelUPDatabase"
        }
    }

  , defineReadOnlyProperty = function (obj, key, value) {
      Object.defineProperty(obj, key, {
          value        : value
        , writeable    : false
        , enumerable   : true
        , configurable : false
      })
    }

  , createDatabase = function (location, options) {
      var database, ctx

      if (typeof location != 'string')
        throw new errors.InitializationError('Must provide a location for the database')

      database = new EventEmitter()
      ctx = {
          ee       : database
        , location : location
      }

      defineReadOnlyProperty(database, 'location', location)
      Object.keys(defaultOptions).forEach(function (p) {
        var value = (options && options[p]) || defaultOptions[p]
        defineReadOnlyProperty(database, p, value)
        ctx[p] = value
      })

      Object.keys(Database).forEach(function (p) {
        database[p] = ctx[p] = Database[p].bind(ctx)
      })

      return database
    }

module.exports.createDatabase = createDatabase