const memdown = require('memdown')
const encode = require('encoding-down')
const levelup = require('../lib/levelup')

module.exports = function (test, testCommon) {
  test('iterator#seek()', function (t) {
    const mem = memdown()

    t.test('setup', function (t) {
      mem.open(function (err) {
        t.ifError(err, 'no open error')
        mem.batch([
          { type: 'put', key: '"a"', value: 'a' },
          { type: 'put', key: '"b"', value: 'b' }
        ], function (err) {
          t.ifError(err, 'no batch error')
          mem.close(t.end.bind(t))
        })
      })
    })

    t.test('without encoding, without deferred-open', function (t) {
      const db = levelup(mem)

      db.open(function (err) {
        t.ifError(err, 'no open error')

        const it = db.iterator({ keyAsBuffer: false })

        it.seek('"b"')
        it.next(function (err, key, value) {
          t.ifError(err, 'no next error')
          t.is(key, '"b"')
          it.end(function (err) {
            t.ifError(err, 'no end error')
            db.close(t.end.bind(t))
          })
        })
      })
    })

    t.test('without encoding, with deferred-open', function (t) {
      const db = levelup(mem)
      const it = db.iterator({ keyAsBuffer: false })

      it.seek('"b"')
      it.next(function (err, key, value) {
        t.ifError(err, 'no next error')
        t.is(key, '"b"')
        it.end(function (err) {
          t.ifError(err, 'no end error')
          db.close(t.end.bind(t))
        })
      })
    })

    t.test('with encoding, with deferred-open', function (t) {
      const db = levelup(encode(mem, { keyEncoding: 'json' }))
      const it = db.iterator()

      it.seek('b')
      it.next(function (err, key, value) {
        t.ifError(err, 'no next error')
        t.is(key, 'b')
        it.end(function (err) {
          t.ifError(err, 'no end error')
          db.close(t.end.bind(t))
        })
      })
    })

    t.test('with encoding, without deferred-open', function (t) {
      const db = levelup(encode(mem, { keyEncoding: 'json' }))

      db.open(function (err) {
        t.ifError(err, 'no open error')

        const it = db.iterator()

        it.seek('b')
        it.next(function (err, key, value) {
          t.ifError(err, 'no next error')
          t.is(key, 'b')
          it.end(function (err) {
            t.ifError(err, 'no end error')
            db.close(t.end.bind(t))
          })
        })
      })
    })

    t.end()
  })
}
