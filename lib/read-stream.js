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
  var self = this
  Stream.call(self)

  self._state = State()

  self._dataEvent = 'data'
  self.readable = true
  self.writable = false

  // purely to keep `db` around until we're done so it's not GCed if the user doesn't keep a ref
  self._db = db

  options = self._options = extend(defaultOptions, options)
  self._keyEncoding   = options.keyEncoding   || options.encoding
  self._valueEncoding = options.valueEncoding || options.encoding
  if (typeof self._options.start != 'undefined')
    self._options.start = toSlice[self._keyEncoding](self._options.start)
  if (typeof self._options.end != 'undefined')
    self._options.end = toSlice[self._keyEncoding](self._options.end)
  if (typeof self._options.limit != 'number')
    self._options.limit = -1
  self._options.keyAsBuffer   = self._keyEncoding != 'utf8'   && self._keyEncoding != 'json'
  self._options.valueAsBuffer = self._valueEncoding != 'utf8' && self._valueEncoding != 'json'

  self._makeData = self._options.keys && self._options.values
    ? makeKeyValueData : self._options.keys
      ? makeKeyData : self._options.values
        ? makeValueData : makeNoData


  var ready = function () {
    if (!self._state.canEmitData())
      return

    self._state.ready()
    self._iterator = iteratorFactory(self._options)
    self._read()
  }

  if (db.isOpen())
    ready()
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
  var self = this
  if (typeof dest.add == 'function' && self._options.type == 'fstream') {
    self._dataEvent = 'entry'
    self.on('entry', function (data) {
      var entry = bufferStream(new Buffer(data.value))
      entry.path = data.key.toString()
      entry.type = 'File'
      entry.props = {
          type: 'File'
        , path: data.key.toString()
      }
      entry.pause()
      if (dest.add(entry) === false)
        self.pause()
    })
  }
  return Stream.prototype.pipe.apply(self, arguments)
}

ReadStream.prototype._read = function () {
  var self = this
  if (this._state.canRead()) {
    this._state.read()
    this._iterator.next(function(err, key, value) {
      self._onData(err, key, value)
    })
  }
}

ReadStream.prototype._onData = function (err, key, value) {
  this._state.endRead()
  if (err || (key === undefined && value === undefined) || !this._state.canEmitData())
    return this._cleanup(err)
  this._read() // queue another read even tho we may not need it
  try {
    value = this._makeData.call(this, key, value)
  } catch (e) {
    return this.emit('error', new errors.EncodingError(e))
  }
  this.emit(this._dataEvent, value)
}

ReadStream.prototype._cleanup = function (err) {
  var self = this

  if (err)
    self.emit('error', err)

  if (!self._state.canEnd())
    return

  self._state.end()
  self.readable = false

  self.emit('end')

  if (self._iterator) {
    self._iterator.end(function () {
      self._iterator = null
      self.emit('close')
    })
  } else
    self.emit('close')
}

ReadStream.prototype.toString = function () {
  return 'LevelUP.ReadStream'
}

module.exports.create = function (options, db, iteratorFactory) {
  return new ReadStream(options, db, iteratorFactory)
}
