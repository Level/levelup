const memdown = require('memdown')
const levelup = require('../lib/levelup')

module.exports = function (test, testCommon) {
  test('simple iterator without encoding-down', function (t) {
    const db = levelup(memdown())

    db.put('key', 'value', function (err) {
      t.ifError(err, 'no put error')

      const it = db.iterator({
        keyAsBuffer: false,
        valueAsBuffer: false
      })

      it.next(function (err, key, value) {
        t.ifError(err, 'no next error')
        t.is(key, 'key')
        t.is(value, 'value')

        it.end(function (err) {
          t.ifError(err, 'no end error')
          db.close(t.end.bind(t))
        })
      })
    })
  })
}
