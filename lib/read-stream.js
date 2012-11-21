  /* Copyright (c) 2012 Rod Vagg <@rvagg> */

var Stream       = require('stream').Stream
  , BufferStream = require('bufferstream')

  , toEncoding   = require('./util').toEncoding
  , toBuffer     = require('./util').toBuffer
  , extend       = require('./util').extend

  , defaultOptions = { keys: true, values: true }

  , makeKeyValueData = function (key, value) {
      return {
          key: toEncoding(key, this._options.keyEncoding || this._options.encoding)
        , value: toEncoding(value, this._options.valueEncoding || this._options.encoding)
      }
    }
  , makeKeyData = function (key) {
      return toEncoding(key, this._options.keyEncoding || this._options.encoding)
    }
  , makeValueData = function (key, value) {
      return toEncoding(value, this._options.valueEncoding || this._options.encoding)
    }
  , makeNoData = function () { return null }


function ReadStream (options, db, iteratorFactory) {
  this.__proto__.__proto__ = Stream.prototype
  Stream.call(this)

  this._status  = 'ready'
  this._dataEvent = 'data'
  this.readable = true
  this.writable = false

  // purely to keep `db` around until we're done so it's not GCed if the user doesn't keep a ref
  this._db = db

  options = this._options = extend(extend({}, defaultOptions), options)
  var keyEncoding = options.keyEncoding || options.encoding
  if (typeof this._options.start != 'undefined')
    this._options.start = toBuffer(this._options.start, keyEncoding)
  if (typeof this._options.end != 'undefined')
    this._options.end = toBuffer(this._options.end, keyEncoding)
  if (typeof this._options.limit != 'number')
    this._options.limit = -1

  this._makeData = this._options.keys && this._options.values
    ? makeKeyValueData.bind(this) : this._options.keys
      ? makeKeyData.bind(this) : this._options.values
        ? makeValueData.bind(this) : makeNoData


  var ready = function () {
    if (this._status == 'ended')
      return
    this._iterator = iteratorFactory(this._options)
    this.emit('ready')
    this._read()
  }.bind(this)

  if (db.isOpen())
    process.nextTick(ready)
  else
    db.once('ready', ready)
}

ReadStream.prototype = {
    destroy: function () {
      this._status = 'destroyed'
      this._cleanup()
    }

  , pause: function () {
      if (this._status != 'ended' && !/\+paused$/.test(this._status)) {
        this.emit('pause')
        this._status += '+paused' // preserve existing status
      }
    }

  , resume: function () {
      if (this._status != 'ended') {
        this.emit('resume')
        this._status = this._status.replace(/\+paused$/, '')
        this._read()
      }
    }

  , pipe: function (dest) {
      if (typeof dest.add == 'function' && this._options.type == 'fstream') {
        this._dataEvent = 'entry'
        this.on('entry', function (data) {
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
      return Stream.prototype.pipe.apply(this, arguments)
    }

  , _read: function () {
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
      this.emit(this._dataEvent, this._makeData(key, value))
    }

  , _cleanup: function (err) {
      var s = this._status
      this._status = 'ended'
      this.readable = false
      if (this._iterator) {
        this._iterator.end(function () {
          this.emit('close')
        }.bind(this))
      } else
        this.emit('close')
      if (err)
        this.emit('error', err)
      else (s != 'destroyed')
        this.emit('end')
    }

  , toString: function () {
      return 'LevelUP.ReadStream'
    }
}

module.exports.create = function (options, db, iteratorFactory) {
  return new ReadStream(options, db, iteratorFactory)
}