var memdown = require('memdown')
var encode = require('encoding-down')
var levelup = require('../lib/levelup')

module.exports = function (test, testCommon) {
  test('simple iterator without encoding-down', function (t) {
    var db = levelup(memdown())

    db.put('key', 'value', function (err) {
      t.ifError(err, 'no put error')

      var it = db.iterator({
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

  test('iterator#seek()', function (t) {
    var mem = memdown()

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
      var db = levelup(mem)

      db.open(function (err) {
        t.ifError(err, 'no open error')

        var it = db.iterator({ keyAsBuffer: false })

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
      var db = levelup(mem)
      var it = db.iterator({ keyAsBuffer: false })

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
      var db = levelup(encode(mem, { keyEncoding: 'json' }))
      var it = db.iterator()

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
      var db = levelup(encode(mem, { keyEncoding: 'json' }))

      db.open(function (err) {
        t.ifError(err, 'no open error')

        var it = db.iterator()

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
