'use strict'

const WriteError = require('level-errors').WriteError
const catering = require('catering')
const getCallback = require('./common').getCallback
const getOptions = require('./common').getOptions

function Batch (levelup) {
  this.db = levelup
  this.batch = levelup.db.batch()
  this.ops = []
  this.length = 0
}

Batch.prototype.put = function (key, value, options) {
  try {
    this.batch.put(key, value, options)
  } catch (e) {
    throw new WriteError(e)
  }

  this.ops.push({ ...options, type: 'put', key, value })
  this.length++

  return this
}

Batch.prototype.del = function (key, options) {
  try {
    this.batch.del(key, options)
  } catch (err) {
    throw new WriteError(err)
  }

  this.ops.push({ ...options, type: 'del', key })
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

Batch.prototype.write = function (options, callback) {
  const levelup = this.db
  const ops = this.ops

  callback = getCallback(options, callback)
  callback = catering.fromCallback(callback)
  options = getOptions(options)

  try {
    this.batch.write(options, function (err) {
      if (err) { return callback(new WriteError(err)) }
      levelup.emit('batch', ops)
      callback()
    })
  } catch (err) {
    throw new WriteError(err)
  }

  return callback.promise
}

module.exports = Batch
