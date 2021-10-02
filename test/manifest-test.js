const suite = require('level-supports/test')

module.exports = function (test, testCommon) {
  suite(test, testCommon)

  // TODO: add integration tests.
  test('manifest has expected properties', function (t) {
    const db = testCommon.factory()

    t.is(db.supports.status, true)
    t.is(db.supports.deferredOpen, true)
    t.is(db.supports.openCallback, true)
    t.is(db.supports.promises, true)
    t.is(db.supports.streams, true)

    db.close(t.end.bind(t))
  })
}
