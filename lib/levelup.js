/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License
 * <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var leveldown    = require('leveldown')
  , EventEmitter = require('events').EventEmitter
  , inherits     = require('util').inherits
  , extend       = require('xtend')
  , prr          = require('prr')

  , errors       = require('./errors')
  , readStream   = require('./read-stream')
  , writeStream  = require('./write-stream')
  , util         = require('./util')
  , toEncoding   = util.toEncoding
  , toSlice      = util.toSlice
  , encodingOpts = util.encodingOpts

  , defaultOptions = {
        createIfMissing : true
      , errorIfExists   : false
      , keyEncoding     : 'utf8'
      , valueEncoding   : 'utf8'
      , compression     : true
      , db              : leveldown
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
            return typeof callback == 'function'
              ? callback(error)
              : levelup.emit('error', error)
          }

        , getCallback = function (options, callback) {
            return typeof options == 'function' ? options : callback
          }

        , getOptions = function (options) {
            var s = typeof options == 'string' // just an encoding
            if (!s && options && options.encoding && !options.valueEncoding)
              options.valueEncoding = options.encoding
            return extend(
                (levelup && levelup.options) || {}
              , s ? encodingOpts[options] || encodingOpts[defaultOptions.valueEncoding]
                  : options
            )
          }

      if (typeof options == 'function') {
        callback = options
        options  = {}
      }
      options = getOptions(options)

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

        this.options = extend(defaultOptions, options)
        // set this.location as enumerable but not configurable or writable
        prr(this, 'location', location, 'e')
      }

      inherits(LevelUP, EventEmitter)

      LevelUP.prototype.open = function (callback) {
        if (isOpen()) {
          if (callback)
            process.nextTick(callback.bind(null, null, this))
          return this
        }

        if (isOpening())
          return callback && levelup.once(
              'open'
            , callback.bind(null, null, this)
          )

        status = 'opening'

        var execute = function () {
              var db = levelup.options.db(levelup.location)

              db.open(levelup.options, function (err) {
                if (err) {
                  err = new errors.OpenError(err)
                  return dispatchError(err, callback)
                } else {
                  levelup._db = db
                  status = 'open'
                  if (callback)
                    callback(null, levelup)
                  levelup.emit('open')
                  levelup.emit('ready')
                }
              })
            }
          , deferred = {}

        ;['get', 'put', 'batch', 'del', 'approximateSize']
          .forEach(function (name) {
            deferred[name] = function () {
              var args = Array.prototype.slice.call(arguments)
              levelup.once('ready', function () {
                levelup._db[name].apply(levelup._db, args)
              })
            }
          })

        this._db = deferred

        execute()
        levelup.emit('opening')
      }

      LevelUP.prototype.close = function (callback) {
        if (isOpen()) {
          status = 'closing'
          this._db.close(function () {
            status = 'closed'
            levelup.emit('closed')
            if (callback)
              callback.apply(null, arguments)
          })
          levelup.emit('closing')
          this._db = null
        } else if (status == 'closed' && callback) {
          callback()
        } else if (status == 'closing' && callback) {
          levelup.once('closed', callback)
        } else if (isOpening()) {
          levelup.once('open', function () {
            levelup.close(callback)
          })
        }
      }

      LevelUP.prototype.isOpen = function () { return isOpen() }

      LevelUP.prototype.isClosed = function () { return (/^clos/).test(status) }

      LevelUP.prototype.get = function (key_, options, callback) {
        var key
          , valueEnc
          , err

        callback = getCallback(options, callback)

        if (typeof callback != 'function') {
          err = new errors.ReadError('get() requires key and callback arguments')
          return dispatchError(err)
        }

        if (!isOpening() && !isOpen()) {
          err = new errors.ReadError('Database is not open')
          return dispatchError(err, callback)
        }

        options  = getOptions(options)
        key      = toSlice[options.keyEncoding](key_)
        valueEnc = options.valueEncoding
        options.asBuffer = valueEnc != 'utf8' && valueEnc != 'json'

        this._db.get(key, options, function (err, value) {
          if (err) {
            if ((/notfound/i).test(err)) {
              err = new errors.NotFoundError(
                  'Key not found in database [' + key_ + ']', err)
            } else {
              err = new errors.ReadError(err)
            }
            return dispatchError(err, callback)
          }
          if (callback) {
            try {
              value = toEncoding[valueEnc](value)
            } catch (e) {
              return callback(new errors.EncodingError(e))
            }
            callback(null, value)
          }
        })
      }

      LevelUP.prototype.put = function (key_, value_, options, callback) {
        var err
          , key
          , value

        callback = getCallback(options, callback)

        if (key_ === null || key_ === undefined
              || value_ === null || value_ === undefined) {
          err = new errors.WriteError('put() requires key and value arguments')
          return dispatchError(err, callback)
        }

        if (!isOpening() && !isOpen()) {
          err = new errors.WriteError('Database is not open')
          return dispatchError(err, callback)
        }

        options = getOptions(options)
        key     = toSlice[options.keyEncoding](key_)
        value   = toSlice[options.valueEncoding](value_)

        this._db.put(key, value, options, function (err) {
          if (err) {
            err = new errors.WriteError(err)
            return dispatchError(err, callback)
          } else {
            levelup.emit('put', key_, value_)
            if (callback)
              callback()
          }
        })
      }

      LevelUP.prototype.del = function (key_, options, callback) {
        var err
          , key

        callback = getCallback(options, callback)

        if (key_ === null || key_ === undefined) {
          err = new errors.WriteError('del() requires a key argument')
          return dispatchError(err, callback)
        }

        if (!isOpening() && !isOpen()) {
          err = new errors.WriteError('Database is not open')
          return dispatchError(err, callback)
        }

        options = getOptions(options)
        key     = toSlice[options.keyEncoding](key_)

        this._db.del(key, options, function (err) {
          if (err) {
            err = new errors.WriteError(err)
            return dispatchError(err, callback)
          } else {
            levelup.emit('del', key_)
            if (callback)
              callback()
          }
        })
      }

      LevelUP.prototype.batch = function (arr_, options, callback) {
        var keyEnc
          , valueEnc
          , err
          , arr

        callback = getCallback(options, callback)

        if (!Array.isArray(arr_)) {
          err = new errors.WriteError('batch() requires an array argument')
          return dispatchError(err, callback)
        }

        if (!isOpening() && !isOpen()) {
          err = new errors.WriteError('Database is not open')
          return dispatchError(err, callback)
        }

        options  = getOptions(options)
        keyEnc   = options.keyEncoding
        valueEnc = options.valueEncoding

        // If we're not dealing with plain utf8 strings or plain
        // Buffers then we have to do some work on the array to
        // encode the keys and/or values. This includes JSON types.
        if ((keyEnc != 'utf8' && keyEnc != 'binary')
            || (valueEnc != 'utf8' && valueEnc != 'binary')) {

          arr = arr_.map(function (e) {
            if (e.type !== undefined && e.key !== undefined) {
              var o = { type: e.type, key: toSlice[keyEnc](e.key) }

              if (e.value !== undefined)
                o.value = toSlice[valueEnc](e.value)

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
            levelup.emit('batch', arr_)
            if (callback)
              callback()
          }
        })
      }

      LevelUP.prototype.approximateSize = function(start, end, callback) {
        var err

        if (start === null || start === undefined
              || end === null || end === undefined
              || typeof callback != 'function') {
          err = new errors.ReadError('approximateSize() requires start, end and callback arguments')
          return dispatchError(err, callback)
        }

        if (!isOpening() && !isOpen()) {
          err = new errors.WriteError('Database is not open')
          return dispatchError(err, callback)
        }

        this._db.approximateSize(start, end, function(err, size) {
          if (err) {
            err = new errors.OpenError(err)
            return dispatchError(err, callback)
          } else if (callback)
            callback(null, size)
        })
      }

      LevelUP.prototype.readStream =
      LevelUP.prototype.createReadStream = function (options) {
        options = extend(this.options, options)
        return readStream.create(
            options
          , this
          , function (options) {
              return levelup._db.iterator(options)
            }
        )
      }

      LevelUP.prototype.keyStream =
      LevelUP.prototype.createKeyStream = function (options) {
        return this.readStream(extend(options, { keys: true, values: false }))
      }

      LevelUP.prototype.valueStream =
      LevelUP.prototype.createValueStream = function (options) {
        return this.readStream(extend(options, { keys: false, values: true }))
      }

      LevelUP.prototype.writeStream =
      LevelUP.prototype.createWriteStream = function (options) {
        return writeStream.create(extend(options), this)
      }

      LevelUP.prototype.toString = function () {
        return 'LevelUP'
      }

      levelup = new LevelUP(location, options)
      levelup.open(callback)
      return levelup
    }

  , destroy = function (location, callback) {
      leveldown.destroy(location, callback || function () {})
    }

  , repair = function (location, callback) {
      leveldown.repair(location, callback || function () {})
    }

module.exports         = createLevelUP
module.exports.copy    = util.copy
module.exports.destroy = destroy
module.exports.repair  = repair