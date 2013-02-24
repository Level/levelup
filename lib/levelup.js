/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License
 * <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var leveldown    = require('leveldown')
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

  , getOptions = function (options, globalOptions) {
      return typeof options == 'string' // just an encoding
        ? options = extend(
              {}
            , encodingOpts[options] || encodingOpts[defaultOptions.encoding]
          )
        : extend(extend({}, globalOptions), options)
    }

  , getCallback = function (options_, callback_) {
      return typeof options_ == 'function' ? options_ : callback_
    }

  , createLevelUP = function (location, options, callback) {

      // Possible status values:
      //  - 'new'     - newly created, not opened or closed
      //  - 'opening' - waiting for the database to be opened, post open()
      //  - 'open'    - successfully opened the database, available for use
      //  - 'closing' - waiting for the database to be closed, post close()
      //  - 'closed'  - database has been successfully closed, should not be
      //                 used except for another open() operation

      var status = 'new'
        , error
        , levelup

        , isOpen        = function () { return status == 'open' }
        , isOpening     = function () { return status == 'opening' }
        , dispatchError = function (error, callback) {
            return callback ? callback(error) : levelup.emit('error', error)
          }

      if (typeof options == 'function') {
        callback = options
        options  = {}
      }

      if (typeof location != 'string') {
        error = new errors.InitializationError(
            'Must provide a location for the database')
        if (callback)
          return callback(error)
        throw error
      }

      function LevelUP (location, options) {
        EventEmitter.call(this)
        this.setMaxListeners(Infinity)

        this._options  = extend(extend({}, defaultOptions), options)
        Object.defineProperty(this, 'location', {
            value: location
          , configurable: false
          , enumerable: true
          , writable: false
        })
      }

      inherits(LevelUP, EventEmitter)

      LevelUP.prototype.open = function (callback) {
        if (isOpen()) {
          if (callback)
            process.nextTick(callback.bind(null, null, this))
          return this
        }

        if (isOpening())
          return callback && this.once('open', callback.bind(null, null, this))

        status = 'opening'

        var execute = function () {
          var db = leveldown(this.location)

          db.open(this._options, function (err) {
            if (err) {
              err = new errors.OpenError(err)
              return dispatchError(err, callback)
            } else {
              this._db = db
              status = 'open'
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

      LevelUP.prototype.close = function (callback) {
        if (isOpen()) {
          status = 'closing'
          this._db.close(function () {
            status = 'closed'
            this.emit('closed')
            if (callback)
              callback.apply(null, arguments)
          }.bind(this))
          this.emit('closing')
          this._db = null
        } else if (status == 'closed' && callback) {
          callback()
        } else if (status == 'closing' && callback) {
          this.once('closed', callback)
        } else if (isOpening()) {
          this.once('open', function () {
            this.close(callback)
          })
        }
      }

      LevelUP.prototype.isOpen = function () { return isOpen() }

      LevelUP.prototype.isClosed = function () { return (/^clos/).test(status) }

      LevelUP.prototype.get = function (key_, options_, callback_) {
        var callback
          , options
          , key
          , keyEnc
          , valueEnc
          , err

        if (isOpening()) {
          return this.once('ready', function () {
            this.get(key_, options_, callback_)
          })
        }

        callback = getCallback(options_, callback_)

        if (!isOpen()) {
          err = new errors.ReadError('Database is not open')
          return dispatchError(err, callback)
        }

        options  = getOptions(options_, this._options)
        keyEnc   = options.keyEncoding   || options.encoding
        valueEnc = options.valueEncoding || options.encoding
        key      = toSlice[keyEnc](key_)
        options.asBuffer = valueEnc != 'utf8' && valueEnc != 'json'

        this._db.get(key, options, function (err, value) {
          if (err) {
            err = new errors.NotFoundError(
                'Key not found in database [' + key_ + ']')
            return dispatchError(err, callback)
          }
          if (callback)
            callback(null, toEncoding[valueEnc](value), key_)
        })
      }

      LevelUP.prototype.put = function (key_, value_, options_, callback_) {
        var callback
          , options
          , err
          , key
          , value

        if (isOpening()) {
          return this.once('ready', function () {
            this.put(key_, value_, options_, callback_)
          })
        }

        callback = getCallback(options_, callback_)

        if (!isOpen()) {
          err = new errors.WriteError('Database is not open')
          return dispatchError(err, callback)
        }

        options = getOptions(options_, this._options)
        key     = toSlice[options.keyEncoding   || options.encoding](key_)
        value   = toSlice[options.valueEncoding || options.encoding](value_)

        this._db.put(key, value, options, function (err) {
          if (err) {
            err = new errors.WriteError(err)
            return dispatchError(err, callback)
          } else {
            this.emit('put', key_, value_)
            if (callback)
              callback(null, key, value)
          }
        }.bind(this))
      }

      LevelUP.prototype.del = function (key_, options_, callback_) {
        var callback
          , options
          , err
          , key

        if (isOpening()) {
          return this.once('ready', function () {
            this.del(key_, options_, callback_)
          })
        }

        callback = getCallback(options_, callback_)

        if (!isOpen()) {
          err = new errors.WriteError('Database is not open')
          return dispatchError(err, callback)
        }

        options = getOptions(options_, this._options)
        key     = toSlice[options.keyEncoding || options.encoding](key_)

        this._db.del(key, options, function (err) {
          if (err) {
            err = new errors.WriteError(err)
            return dispatchError(err, callback)
          } else {
            this.emit('del', key_)
            if (callback)
              callback(null, key)
          }
        }.bind(this))
      }

      LevelUP.prototype.batch = function (arr_, options_, callback_) {
        var callback
          , options
          , keyEncoding
          , valueEncoding
          , err
          , arr

        if (isOpening()) {
          return this.once('ready', function () {
            this.batch(arr_, options_, callback_)
          })
        }

        callback = getCallback(options_, callback_)

        if (!isOpen()) {
          err = new errors.WriteError('Database is not open')
          return dispatchError(err, callback)
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
              var o = { type: e.type, key: toSlice[keyEncoding](e.key) }

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
            return dispatchError(err, callback)
          } else {
            this.emit('batch', arr_)
            if (callback)
              callback(null, arr)
          }
        }.bind(this))
      }

      LevelUP.prototype.approximateSize = function(start, end, callback) {
        var err

        if (isOpening()) {
          return this.once('ready', function () {
            this.approximateSize(start, end, callback)
          })
        }

        if (!isOpen()) {
          err = new errors.WriteError('Database is not open')
          return dispatchError(err, callback)
        }

        this._db.approximateSize(start, end, function(err, size) {
          if (err) {
            err = new errors.OpenError(err)
            return dispatchError(err, callback)
          } else if (callback)
            callback(null, size)
        }.bind(this))
      }

      LevelUP.prototype.readStream = function (options) {
        options = extend(
            extend({}, this._options)
          , typeof options == 'object' ? options : {}
        )

        return readStream.create(
            options
          , this
          , function (options) {
              return this._db.iterator(options)
            }.bind(this)
        )
      }

      LevelUP.prototype.keyStream = function (options) {
        return this.readStream(
            extend(
                options ? extend({}, options) : {}
              , { keys: true, values: false }
            )
        )
      }

      LevelUP.prototype.valueStream = function (options) {
        return this.readStream(
            extend(
                options ? extend({}, options) : {}
              , { keys: false, values: true }
            )
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

      levelup = new LevelUP(location, options)
      levelup.open(callback)
      return levelup
    }

module.exports = createLevelUP
module.exports.copy = require('./util').copy
