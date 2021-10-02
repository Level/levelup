const suite = require('level-supports/test')

module.exports = function (test, testCommon) {
  suite(test, testCommon)

  // TODO: add integration tests.
  test('manifest has expected properties', function (t) {
    const db = testCommon.factory()

    t.is(db.supports.status, true)
    if (testCommon.deferredOpen) t.is(db.supports.deferredOpen, true)
    if (testCommon.openCallback) t.is(db.supports.openCallback, true)
    if (testCommon.promises) t.is(db.supports.promises, true)
    if (testCommon.streams) t.is(db.supports.streams, true)

    db.close(t.end.bind(t))
  })
}
