/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var Stream       = require('stream').Stream
  , bufferStream = require('simple-bufferstream')
  , inherits     = require('util').inherits
  , extend       = require('xtend')
  , errors       = require('./errors')
  , State        = require('./read-stream-state')

  , toEncoding   = require('./util').toEncoding
  , toSlice      = require('./util').toSlice
  , setImmediate = require('./util').setImmediate

  , defaultOptions = { keys: true, values: true }

  , makeKeyValueData = function (key, value) {
      return {
          key: toEncoding[this._keyEncoding](key)
        , value: toEncoding[this._valueEncoding](value)
      }
    }
  , makeKeyData = function (key) {
      return toEncoding[this._keyEncoding](key)
    }
  , makeValueData = function (key, value) {
      return toEncoding[this._valueEncoding](value)
    }
  , makeNoData = function () { return null }

function ReadStream (options, db, iteratorFactory) {
  Stream.call(this)

  this._state = State()

  this._dataEvent = 'data'
  this.readable = true
  this.writable = false

  // purely to keep `db` around until we're done so it's not GCed if the user doesn't keep a ref
  this._db = db

  options = this._options = extend(defaultOptions, options)
  this._keyEncoding   = options.keyEncoding   || options.encoding
  this._valueEncoding = options.valueEncoding || options.encoding
  if (typeof this._options.start != 'undefined')
    this._options.start = toSlice[this._keyEncoding](this._options.start)
  if (typeof this._options.end != 'undefined')
    this._options.end = toSlice[this._keyEncoding](this._options.end)
  if (typeof this._options.limit != 'number')
    this._options.limit = -1
  this._options.keyAsBuffer   = this._keyEncoding != 'utf8'   && this._keyEncoding != 'json'
  this._options.valueAsBuffer = this._valueEncoding != 'utf8' && this._valueEncoding != 'json'

  this._makeData = this._options.keys && this._options.values
    ? makeKeyValueData.bind(this) : this._options.keys
      ? makeKeyData.bind(this) : this._options.values
        ? makeValueData.bind(this) : makeNoData


  var ready = function () {
    if (!this._state.canEmitData())
      return

    this._state.ready()
    this._iterator = iteratorFactory(this._options)
    this.emit('ready')
    this._read()
  }.bind(this)

  if (db.isOpen())
    setImmediate(ready)
  else
    db.once('ready', ready)
}

inherits(ReadStream, Stream)

ReadStream.prototype.destroy = function () {
  this._state.destroy()
  if (this._state.canCleanup())
    this._cleanup()
}

ReadStream.prototype.pause = function () {
  if (this._state.canPause()) {
    this._state.pause()
    this.emit('pause')
  }
}

ReadStream.prototype.resume = function () {
  if (this._state.canResume()) {
    this.emit('resume')
    this._state.resume()
    this._read()
  }
}

ReadStream.prototype.pipe = function (dest) {
  if (typeof dest.add == 'function' && this._options.type == 'fstream') {
    this._dataEvent = 'entry'
    this.on('entry', function (data) {
      var entry = bufferStream(new Buffer(data.value))
      entry.path = data.key.toString()
      entry.type = 'File'
      entry.props = {
          type: 'File'
        , path: data.key.toString()
      }
      entry.pause()
      if (dest.add(entry) === false)
        this.pause()
    }.bind(this))
  }
  return Stream.prototype.pipe.apply(this, arguments)
}

ReadStream.prototype._read = function () {
  if (this._state.canRead()) {
    this._state.read()
    this._iterator.next(this._onData.bind(this))
  }
}

ReadStream.prototype._onData = function (err, key, value) {
  this._state.endRead()
  if (err || !arguments.length /* end */ || !this._state.canEmitData())
    return this._cleanup(err)
  this._read() // queue another read even tho we may not need it
  try {
    value = this._makeData(key, value)
  } catch (e) {
    return this.emit('error', new errors.EncodingError(e))
  }
  this.emit(this._dataEvent, value)
}

ReadStream.prototype._cleanup = function (err) {
  if (err)
    this.emit('error', err)

  if (!this._state.canEnd())
    return

  this._state.end()
  this.readable = false

  if (this._iterator) {
    this._iterator.end(function () {
      this._iterator = null
      this.emit('close')
    }.bind(this))
  } else
    this.emit('close')

  this.emit('end')
}

ReadStream.prototype.toString = function () {
  return 'LevelUP.ReadStream'
}

module.exports.create = function (options, db, iteratorFactory) {
  return new ReadStream(options, db, iteratorFactory)
}
