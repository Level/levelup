const levelup = require('../lib/levelup')
const nextTick = require('../lib/next-tick')
const memdown = require('memdown')

module.exports = function (test, testCommon) {
  test('Init & open(): levelup()', function (t) {
    t.is(typeof levelup, 'function')

    // db, options & callback arguments
    t.is(levelup.length, 3)

    // no db
    throws(t, levelup, function (err) {
      return /^InitializationError/.test(err)
    })

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
    const db = levelup(memdown())
    t.ok(typeof db === 'object' && db !== null)
    db.on('ready', function () {
      t.is(db.isOpen(), true)
      db.close(t.end.bind(t))
    })
  })

  test('Init & open(): error with callback', function (t) {
    t.plan(1)

    const mem = memdown()
    mem._open = function (opts, cb) {
      nextTick(cb, new Error('from underlying store'))
    }

    levelup(mem, function (err) {
      t.is(err.message, 'from underlying store')
    }).on('open', function () {
      t.fail('should not finish opening')
    }).on('error', function () {
      t.fail('should not emit error')
    })
  })

  test('Init & open(): error without callback', function (t) {
    t.plan(1)

    const mem = memdown()
    mem._open = function (opts, cb) {
      nextTick(cb, new Error('from underlying store'))
    }

    levelup(mem)
      .on('open', function () {
        t.fail('should not finish opening')
      })
      .on('error', function (err) {
        t.is(err.message, 'from underlying store')
      })
  })

  test('Init & open(): validate abstract-leveldown', function (t) {
    t.plan(1)

    const down = memdown()

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
    const down = memdown()

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

function throws (t, fn, verify) {
  try {
    fn()
  } catch (err) {
    return verify(err)
  }

  t.fail('did not throw')
}
