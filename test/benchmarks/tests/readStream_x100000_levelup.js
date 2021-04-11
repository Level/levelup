const setupFn = function (count, db, cb) {
  const doWrites = function () {
    if (--count === 0) return cb()
    db.put('aa' + count, 'bb' + count, doWrites)
  }
  doWrites()
}

const fn = function (db, cb) {
  db.createReadStream().on('end', cb)
}

module.exports = fn
module.exports.fn = fn
module.exports.setup = setupFn.bind(null, 100000)
module.exports.setupFn = setupFn
