var levelup = require('../lib/levelup')
var memdown = require('memdown')

module.exports = function (test, testCommon) {
  test('without encoding-down: serializes key', function (t) {
    var down = memdown()

    down._serializeKey = function (key) {
      return key.toUpperCase()
    }

    var db = levelup(down)

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
    var down = memdown()

    down._serializeValue = function (value) {
      return value.toUpperCase()
    }

    var db = levelup(down)

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
