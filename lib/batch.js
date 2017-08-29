/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License
 * <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var WriteError = require('level-errors').WriteError
var promisify = require('./promisify')

function Batch (levelup) {
  this._levelup = levelup
  this.batch = levelup.db.batch()
  this.ops = []
  this.length = 0
}

Batch.prototype.put = function (key, value) {
  try {
    this.batch.put(key, value)
  } catch (e) {
    throw new WriteError(e)
  }

  this.ops.push({ type: 'put', key: key, value: value })
  this.length++

  return this
}

Batch.prototype.del = function (key) {
  try {
    this.batch.del(key)
  } catch (err) {
    throw new WriteError(err)
  }

  this.ops.push({ type: 'del', key: key })
  this.length++

  return this
}

Batch.prototype.clear = function () {
  try {
    this.batch.clear()
  } catch (err) {
    throw new WriteError(err)
  }

  this.ops = []
  this.length = 0

  return this
}

Batch.prototype.write = function (callback) {
  var levelup = this._levelup
  var ops = this.ops
  var promise

  if (!callback) [ callback, promise ] = promisify()

  try {
    this.batch.write(function (err) {
      if (err) { return callback(new WriteError(err)) }
      levelup.emit('batch', ops)
      callback()
    })
  } catch (err) {
    throw new WriteError(err)
  }

  return promise
}

module.exports = Batch
