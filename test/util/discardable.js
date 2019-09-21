module.exports = function discardable (t, testCommon, options, fn) {
  if (typeof options === 'function') {
    fn = options
    options = {}
  }

  var db = testCommon.factory(options)

  db.open(function () {
    fn(db, function done (err) {
      t.ifError(err, 'no test error')

      db.close(function (err) {
        t.ifError(err, 'no close error')
        t.end()
      })
    })
  })
}
