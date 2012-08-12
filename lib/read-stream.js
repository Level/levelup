var Stream     = require("stream").Stream
  , inherits   = require("inherits")

  , toEncoding = require('./util').toEncoding

function ReadStream (options, db, iteratorFactory) {
  Stream.call(this)
  this._options = options
  this._status  = 'ready'
  this.readable = true
  this.writable = false

  var ready = function () {
    if (this._status == 'ended')
      return
    this._iterator = iteratorFactory()
    this.emit('ready')
    this._read()
  }.bind(this)

  if (db.isOpen())
    process.nextTick(ready)
  else
    db.ee.once('ready', ready)
}

inherits(ReadStream, Stream)

ReadStream.prototype._read = function () {
  if (this._status == 'ready' || this._status == 'reading') {
    this._iterator.next(this._cleanup.bind(this), this._onData.bind(this))
  }
}

ReadStream.prototype._onData = function (err, key, value) {
  if (err)
    return this._cleanup(err)
  if (this._status == 'ended')
    return
  if (this._status == 'ready') this._status = 'reading'
  this._read()
  this.emit('data', {
      key   : toEncoding(key   , this._options.keyEncoding   || this._options.encoding)
    , value : toEncoding(value , this._options.valueEncoding || this._options.encoding)
  })
}

ReadStream.prototype._cleanup = function(err) {
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

ReadStream.prototype.destroy = function() {
  this._status = 'destroyed'
  this._cleanup()
}

ReadStream.prototype.pause = function() {
  if (this._status != 'ended')
    this._status += '+paused' // preserve existing status
}

ReadStream.prototype.resume = function() {
  if (this._status != 'ended') {
    this._status = this._status.replace(/\+paused$/, '')
    this._read()
  }
}

module.exports = ReadStream