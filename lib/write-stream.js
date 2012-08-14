/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var Stream     = require("stream").Stream
  , inherits   = require("inherits")

  , toEncoding = require('./util').toEncoding

function WriteStream (options, db) {
  Stream.call(this)
  this._options = options
  this._db      = db
  this._buffer  = []
  this._status  = 'init'
  this._end     = false
  this.writable = true
  this.readable = false

  var ready = function () {
    if (!this.writable)
      return
    this._status = 'ready'
    this.emit('ready')
    this._process()
  }.bind(this)

  if (db.isOpen())
    process.nextTick(ready)
  else
    db.ee.once('ready', ready)
}

inherits(WriteStream, Stream)

WriteStream.prototype.write = function (data) {
  if (!this.writable)
    return false
  this._buffer.push(data)
  if (this._status != 'init')
    this._processDelayed()
  if (this._options.maxBufferLength && this._buffer.length > this._options.maxBufferLength) {
    this._writeBlock = true
    return false
  }
  return true
}

WriteStream.prototype._processDelayed = function() {
  process.nextTick(this._process.bind(this))
}

WriteStream.prototype._process = function() {
  var entry
    , cb = function (err) {
        if (!this.writable)
          return
        if (this._status != 'closed')
          this._status = 'ready'
        if (err) {
          this.writable = false
          return this.emit('error', err)
        }
        this._process()
      }.bind(this)

  if (this._status != 'ready' && this.writable) {
    if (this._buffer.length && this._status != 'closed')
      this._processDelayed()
    return
  }

  if (this._buffer.length && this.writable) {
    if (this._buffer.length == 1) {
      entry = this._buffer.pop()
      if (entry.key !== undefined && entry.value !== undefined) {
        this._status = 'writing'
        this._db.put(entry.key, entry.value, cb)
      }
    } else {
      this._status = 'writing'
      this._db.batch(this._buffer.map(function (d) {
        return { type: 'put', key: d.key, value: d.value }
      }), cb)
      this._buffer = []
    }
    if (this._writeBlock) {
      this._writeBlock = false
      this.emit('drain')
    }
  }

  if (this._end) {
    this._status = 'closed'
    this.writable = false
    this.emit('close')
    return
  }
}

WriteStream.prototype.end = function() {
  process.nextTick(function () {
    this._end = true
    this._process()
  }.bind(this))
}

WriteStream.prototype.destroy = function() {
  this.writable = false
  this.end()
}

WriteStream.prototype.destroySoon = function() {
  this.end()
}

module.exports = WriteStream