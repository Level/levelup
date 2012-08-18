  /* Copyright (c) 2012 Rod Vagg <@rvagg> */

var Stream       = require("stream").Stream
  , BufferStream = require('bufferstream')

  , toEncoding   = require('./util').toEncoding
  , toBuffer     = require('./util').toBuffer
  , Creator      = require('./creator').Creator

  , defaultOptions = {}

  , ReadStream = function (options, db, iteratorFactory) {
      Stream.call(this)
      this._options = options
      this._status  = 'ready'
      this._dataEvent = 'data'
      this.readable = true
      this.writable = false

      if (this._options.start)
        this._options.start = toBuffer(this._options.start)
      if (this._options.end)
        this._options.end = toBuffer(this._options.end)

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
        destroy: function () {
          this._status = 'destroyed'
          this._cleanup()
        }

      , pause: function () {
          if (this._status != 'ended' && !/\+paused$/.test(this._status)) {
            this.pub.emit('pause')
            this._status += '+paused' // preserve existing status
          }
        }

      , resume: function () {
          if (this._status != 'ended') {
            this.pub.emit('resume')
            this._status = this._status.replace(/\+paused$/, '')
            this._read()
          }
        }

      , pipe: function (dest) {
          if (typeof dest.add == 'function' && this._options.type == 'fstream') {
            this._dataEvent = 'entry'
            this.pub.on('entry', function (data) {
              var entry = new BufferStream()
              entry.path = data.key.toString()
              entry.type = 'File'
              entry.props = {
                  type: 'File'
                , path: data.key.toString()
              }
              entry.once('data', process.nextTick.bind(null, entry.end.bind(entry)))
              entry.pause()
              if (dest.add(entry) === false) {
                this.pause()
              }
              entry.write(data.value)
            }.bind(this))
          }
          return Stream.prototype.pipe.apply(this.pub, arguments)
        }
    }

  , PrivateMethods = {
        _read: function () {
          if (this._status == 'ready') {
            this._status = 'reading'
            this._iterator.next(this._cleanup.bind(this), this._onData.bind(this))
          }
        }

      , _onData: function (err, key, value) {
          if (err)
            return this._cleanup(err)
          if (this._status == 'ended')
            return
          if (/^reading/.test(this._status))
            this._status = this._status.replace(/^reading/, 'ready')
          this._read()
          this.pub.emit(this._dataEvent, {
              key   : toEncoding(key   , this._options.keyEncoding   || this._options.encoding)
            , value : toEncoding(value , this._options.valueEncoding || this._options.encoding)
          })
        }

      , _cleanup: function (err) {
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