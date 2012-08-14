/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var Stream     = require("stream").Stream
  , inherits   = require("inherits")

  , toEncoding = require('./util').toEncoding
  , Creator    = require('./creator').Creator

  , defaultOptions = {}

  , ReadStream = function (options, db, iteratorFactory) {
      Stream.call(this)
      this._options = options
      this._status  = 'ready'
      this.readable = true
      this.writable = false

      var ready = function () {
        if (this._status == 'ended')
          return
        this._iterator = iteratorFactory()
        this.pub.emit('ready')
        this._read()
      }.bind(this)

      if (db.isOpen())
        process.nextTick(ready)
      else
        db.pub.once('ready', ready)
    }

  , Methods = {
      destroy: function() {
        this._status = 'destroyed'
        this._cleanup()
      }

    , pause: function() {
        if (this._status != 'ended')
          this._status += '+paused' // preserve existing status
      }

    , resume: function() {
        if (this._status != 'ended') {
          this._status = this._status.replace(/\+paused$/, '')
          this._read()
        }
      }
    }

  , PrivateMethods = {
        _read: function () {
          if (this._status == 'ready' || this._status == 'reading') {
            this._iterator.next(this._cleanup.bind(this), this._onData.bind(this))
          }
        }

      , _onData: function (err, key, value) {
          if (err)
            return this._cleanup(err)
          if (this._status == 'ended')
            return
          if (this._status == 'ready') this._status = 'reading'
          this._read()
          this.pub.emit('data', {
              key   : toEncoding(key   , this._options.keyEncoding   || this._options.encoding)
            , value : toEncoding(value , this._options.valueEncoding || this._options.encoding)
          })
        }

      , _cleanup: function(err) {
          var s = this._status
          this._status = 'ended'
          this.readable = false
          if (this._iterator) {
            this._iterator.end(function () {
              this.pub.emit('close')
            }.bind(this))
          } else
            this.pub.emit('close')
          if (err)
            this.pub.emit('error', err)
          else (s != 'destroyed')
            this.pub.emit('end')
        }
    }

  , Getters = {
        writable: function () {
          return this.writable
        }
      , readable: function () {
          return this.readable
        }
    }

  , readStreamCreator = new Creator('LevelUP.ReadStream')
      .setConstructor(ReadStream)
      .setPrototype(Stream)
      .setMethods(Methods)
      .setPrivateMethods(PrivateMethods)
      .setReadOnlyProperties(function (args) {
        var props = {}
        Object.keys(defaultOptions).forEach(function (p) {
          props[p] = (args[0] && args[0][p]) || defaultOptions[p]
        })
        return props
      })
      .setGetters(Getters)

module.exports.create = readStreamCreator.create.bind(readStreamCreator)