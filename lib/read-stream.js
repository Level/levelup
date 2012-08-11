var Stream     = require("stream").Stream
  , inherits   = require("inherits")

  , toEncoding = require('./util').toEncoding

function ReadStream (options, db, iteratorFactory) {
  Stream.call(this)
  this._options = options
  this._status  = 'ready'

  var ready = function () {
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
    this._iterator.next(this._onEnd.bind(this), this._onData.bind(this))
  }
}

ReadStream.prototype._onData = function (key, value) {
  if (this._status == 'ready') this._status = 'reading'
  this.emit('data', {
      key   : toEncoding(key   , this._options.keyEncoding   || this._options.encoding)
    , value : toEncoding(value , this._options.valueEncoding || this._options.encoding)
  })
  this._read()
}

ReadStream.prototype._onEnd = function () {
  this._status = 'ended'
  this.emit('end')
}

module.exports = ReadStream