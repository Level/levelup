/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License
 * <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var BatchWriteStream = require('batch-write-stream')
  , inherits         = require('util').inherits
  , extend           = require('xtend')

  , setImmediate     = require('./util').setImmediate

  , getOptions       = require('./util').getOptions

  , defaultOptions = {
        highWaterMark: 1e5
      , maxConcurrentBatches: 4
      , type: 'put'
      , flushWait: 10
    }

function WriteStream(options, db) {
  options = getOptions(db, options)
  this._options = options = extend(defaultOptions, options)
  this._db = db
  this._type = this._options.type
  this._options = options


  this.once('finish', onFinish.bind(this))

  BatchWriteStream.call(this, extend(options, { objectMode: true }))

  ready(this)
}

inherits(WriteStream, BatchWriteStream)


function ready(stream) {
  if (stream._db.isOpen()) {
    setImmediate(function() {
      stream.emit('ready')
    })
  } else {
    stream._db.once('ready', function() {
      stream.emit('ready')
    })
  }
}


WriteStream.prototype._writeBatch = function _writeBatch(batch, cb) {
  this._db.batch(batch, cb)
}

WriteStream.prototype._map = function(rec) {
  return {
      type: rec.type || this._type
    , key: rec.key
    , value: rec.value
    , keyEncoding: rec.keyEncoding || this._options.keyEncoding
    , valueEncoding: rec.valueEncoding || this.encoding || this._options.valueEncoding
  }
}

function onFinish() {
  this.emit('close') // backwards compatibility
}

WriteStream.prototype.toString = function () {
  return 'LevelUP.WriteStream'
}

exports.create =
function createWriteStream(options, db) {
  return new WriteStream(options, db)
}