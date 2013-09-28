var Deferred      = require('deferred-open')
  , errors        = require('./errors')
  , util          = require('./util')
  , getOptions    = util.getOptions
  , encodeKey     = util.encodeKey
  , encodeValue   = util.encodeValue
  , dispatchValue = util.dispatchValue

module.exports = Batch

function Batch (levelup) {
  Deferred.install(this)

  this.levelup = levelup
  this.ops = []

  if (levelup.isOpen()) {
    this.batch = levelup.db.batch()
    this._ready()
  } else {
    var self = this
    levelup.once('ready', function () {
      self.batch = levelup.db.batch()
      self._ready()
    })
  }
}

Batch.prototype.put = Deferred(function (key_, value_, options) {
  options = getOptions(this.levelup, options)

  var key   = encodeKey(key_, options)
    , value = encodeValue(value_, options)

  try {
    this.batch.put(key, value)
  } catch (e) {
    throw new errors.WriteError(e)
  }
  this.ops.push({ type : 'put', key : key, value : value })

  return this
})

Batch.prototype.del = Deferred(function (key_, options) {
  options = getOptions(this.levelup, options)
  var key = encodeKey(key_, options)

  try {
    this.batch.del(key)
  } catch (err) {
    throw new errors.WriteError(err)
  }
  this.ops.push({ type : 'del', key : key })

  return this
})

Batch.prototype.clear = Deferred(function () {
  try {
    this.batch.clear()
  } catch (err) {
    throw new errors.WriteError(err)
  }

  this.ops = []
  return this
})

Batch.prototype.write = Deferred(function (callback) {
  var ops     = this.ops
    , levelup = this.levelup

  try {
    this.batch.write(function (err) {
      if (err)
        return dispatchError(levelup, new errors.WriteError(err), callback)
      levelup.emit('batch', ops)
      if (callback)
        callback()
    })
  } catch (err) {
    throw new errors.WriteError(err)
  }
})
