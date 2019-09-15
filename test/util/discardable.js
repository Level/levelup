module.exports = function discardable (t, testCommon, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  testCommon.factory(options, function (err, db) {
    t.ifError(err, 'no open error')

    callback(db, function done (err) {
      t.ifError(err, 'no test error')

      db.close(function (err) {
        t.ifError(err, 'no close error')
        t.end()
      })
    })
  })
}
