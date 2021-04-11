const levelup = require('../lib/levelup')
const memdown = require('memdown')

module.exports = function (test, testCommon) {
  test('without encoding-down: serializes key', function (t) {
    const down = memdown()

    down._serializeKey = function (key) {
      return key.toUpperCase()
    }

    const db = levelup(down)

    db.put('key', 'value', function (err) {
      t.ifError(err)

      db.get('KEY', { asBuffer: false }, function (err, value) {
        t.ifError(err)
        t.is(value, 'value')
        db.close(t.end.bind(t))
      })
    })
  })

  test('without encoding-down: serializes value', function (t) {
    const down = memdown()

    down._serializeValue = function (value) {
      return value.toUpperCase()
    }

    const db = levelup(down)

    db.put('key', 'value', function (err) {
      t.ifError(err)

      db.get('key', { asBuffer: false }, function (err, value) {
        t.ifError(err)
        t.is(value, 'VALUE')
        db.close(t.end.bind(t))
      })
    })
  })
}
