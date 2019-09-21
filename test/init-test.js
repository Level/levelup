var levelup = require('../lib/levelup')
var memdown = require('memdown')

module.exports = function (test, testCommon) {
  test('Init & open(): levelup()', function (t) {
    t.is(typeof levelup, 'function')
    t.is(levelup.length, 3) // db, options & callback arguments
    t.throws(levelup, /^InitializationError/) // no db
    t.end()
  })

  test('Init & open(): open and close statuses', function (t) {
    levelup(memdown(), function (err, db) {
      t.ifError(err, 'no error')
      t.is(db.isOpen(), true)

      db.close(function (err) {
        t.ifError(err)

        t.is(db.isOpen(), false)
        t.is(db.isClosed(), true)

        levelup(memdown(), function (err, db) {
          t.ifError(err)
          t.ok(typeof db === 'object' && db !== null)

          db.close(t.end.bind(t))
        })
      })
    })
  })

  test('Init & open(): without callback', function (t) {
    var db = levelup(memdown())
    t.ok(typeof db === 'object' && db !== null)
    db.on('ready', function () {
      t.is(db.isOpen(), true)
      db.close(t.end.bind(t))
    })
  })

  test('Init & open(): validate abstract-leveldown', function (t) {
    t.plan(1)

    var down = memdown()

    Object.defineProperty(down, 'status', {
      get: function () { return null },
      set: function () {}
    })

    try {
      levelup(down)
    } catch (err) {
      t.is(err.message, '.status required, old abstract-leveldown')
    }
  })

  test('Init & open(): support open options', function (t) {
    var down = memdown()

    levelup(down, function (err, up) {
      t.ifError(err, 'no error')

      up.close(function () {
        down.open = function (opts) {
          t.is(opts.foo, 'bar')
          t.end()
        }

        up.open({ foo: 'bar' })
      })
    })
  })
}
