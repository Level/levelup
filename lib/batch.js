/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License
 * <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

const { WriteError } = require('level-errors')
const promisify = require('./promisify')

class Batch {
  constructor (levelup) {
    this._levelup = levelup
    this.batch = levelup.db.batch()
    this.ops = []
    this.length = 0
  }

  put (key, value) {
    try {
      this.batch.put(key, value)
    } catch (e) {
      throw new WriteError(e)
    }

    this.ops.push({ type: 'put', key, value })
    this.length++

    return this
  }

  del (key) {
    try {
      this.batch.del(key)
    } catch (err) {
      throw new WriteError(err)
    }

    this.ops.push({ type: 'del', key: key })
    this.length++

    return this
  }

  clear () {
    try {
      this.batch.clear()
    } catch (err) {
      throw new WriteError(err)
    }

    this.ops = []
    this.length = 0

    return this
  }

  write (callback) {
    var levelup = this._levelup
    var ops = this.ops
    var promise

    if (!callback) {
      callback = promisify()
      promise = callback.promise
    }

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
}

module.exports = Batch
