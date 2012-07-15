var bridge              = require('../build/Release/levelup')
  , errors              = require('./errors')

  , defaultOptions = {
        createIfMissing : false
      , errorIfExists   : false
      , encoding        : 'utf8'
    }

  , toString = function () {
      return "LevelUPDatabase"
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

  , toBuffer = function (data, encoding) {
      return Buffer.isBuffer(data) ? data : new Buffer('' + data, encoding)
    }

  , toEncoding = function (buffer, encoding) {
      return encoding == 'binary' ? buffer : buffer.toString(encoding)
    }

  , Database = {
        open: function (callback) {
          var options = {}
            , execute = function () {
                Object.keys(defaultOptions).forEach(function (p) {
                  options[p] = this[p]
                }.bind(this))
                this.db = bridge.createDatabase()
                this.db.open(this.location, options, function (err) {
                  if (err) {
                    this.db = null
                    err = new errors.OpenError(err)
                  }
                  if (callback)
                    callback.apply(null, err ? [ err ] : [])
                  else if (err)
                    throw err
                }.bind(this))
              }.bind(this)

          if (this.isOpen())
            this.close(execute)
          else
            execute()
        }

      , close: function (callback) {
          if (this.isOpen()) {
            this.db.close(callback)
            this.db = null
          } else {
            callback()
          }
        }

      , isOpen: function () {
          return !!this.db
        }

      , get: function (key, options_, callback_) {
          var callback = getCallback(options_, callback_)
            , options
          if (this.isOpen()) {
            options  = getOptions(options_, this.encoding)
            key      = toBuffer(key,   options.keyEncoding   || options.encoding)
            this.db.get(key, options, function (err, value) {
              if (err) {
                err = new errors.NotFoundError('Key not found in database [' + key + ']')
                if (callback)
                  return callback(err)
                throw err
              }
              callback && callback(null, toEncoding(value, options.valueEncoding || options.encoding), key)
            })
          } else
            callback(new errors.ReadError('Database has not been opened'))
        }

      , put: function (key, value, options_, callback_) {
          var callback = getCallback(options_, callback_)
            , options
          if (this.isOpen()) {
            options  = getOptions(options_, this.encoding)
            key      = toBuffer(key,   options.keyEncoding   || options.encoding)
            value    = toBuffer(value, options.valueEncoding || options.encoding)
            this.db.put(key, value, options, function (err) {
              if (err) {
                err = new errors.WriteError(err)
                if (callback)
                  return callback(err)
                throw err
              }
              callback && callback(null, key, value)
            })
          } else
            callback(new errors.ReadError('Database has not been opened'))
        }

      , del: function (key, options_, callback_) {
          var callback = getCallback(options_, callback_)
            , options
          if (this.isOpen()) {
            options  = getOptions(options_, this.encoding)
            key      = toBuffer(key,   options.keyEncoding   || options.encoding)
            this.db.del(key, options, function (err) {
              if (err) {
                err = new errors.WriteError(err)
                if (callback)
                  return callback(err)
                throw err
              }
              callback && callback(null, key)
            })
          } else
            callback(new errors.ReadError('Database has not been opened'))
        }

      , batch: function (arr, options_, callback_) {
          var callback = getCallback(options_, callback_)
            , options
          if (this.isOpen()) {
            options = getOptions(options_, this.encoding)
            this.db.batch(arr, options, function (err) {
              if (err) {
                err = new errors.WriteError(err)
                if (callback)
                  return callback(err)
                throw err
              }
              // reference to 'arr' important to keep from being garbage collected
              // we don't keep a Persistent<T> reference in the bridge
              callback && callback(null, arr)
            })
          } else
            callback(new errors.ReadError('Database has not been opened'))
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

      database = Object.create({ toString: toString })
      ctx = {}

      defineReadOnlyProperty(database, 'location', location)
      ctx.location = location
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