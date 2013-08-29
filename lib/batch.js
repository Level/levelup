var errors        = require('./errors')
  , util          = require('./util')
  , getOptions    = util.getOptions
  , encodeKey     = util.encodeKey
  , encodeValue   = util.encodeValue
  , dispatchValue = util.dispatchValue

module.exports = Batch

function Batch (levelup) {
  this.levelup = levelup
  this.batch = levelup.db.batch()
  this.ops = []
}

Batch.prototype.put = function (key_, value_, options) {
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
}

Batch.prototype.del = function (key_, options) {
  options = getOptions(this.levelup, options)
  var key = encodeKey(key_, options)

  try {
    this.batch.del(key)
  } catch (err) {
    throw new errors.WriteError(err)
  }
  this.ops.push({ type : 'del', key : key })

  return this
}

Batch.prototype.clear = function () {
  try {
    this.batch.clear()
  } catch (err) {
    throw new errors.WriteError(err)
  }

  this.ops = []
  return this
}

Batch.prototype.write = function (callback) {
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
}
