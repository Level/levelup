module.exports = Batch

function Batch (db) {
  this.db = db
  this.ops = []
}

Batch.prototype.put = function (key, value) {
  this.ops.push({ type : 'put', key : key, value : value })
  return this
}

Batch.prototype.del = function (key) {
  this.ops.push({ type : 'del', key : key })
  return this
}

Batch.prototype.write = function (options, callback) {
  if (typeof options == 'function') {
    callback = options
    options = null
  }

  options
    ? this.db.batch(this.ops, options, callback)
    : this.db.batch(this.ops, callback)
}