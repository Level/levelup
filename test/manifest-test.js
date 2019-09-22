var suite = require('level-supports/test')

module.exports = function (test, testCommon) {
  suite(test, testCommon)

  // TODO (once manifest lands in other modules): add integration tests.
  test('manifest has expected properties', function (t) {
    var db = testCommon.factory()

    t.is(db.supports.status, false)
    t.is(db.supports.deferredOpen, true)
    t.is(db.supports.openCallback, true)
    t.is(db.supports.promises, true)
    t.is(db.supports.streams, true)

    db.close(t.end.bind(t))
  })
}
