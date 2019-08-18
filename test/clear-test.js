var test = require('tape')
var memdown = require('memdown')
var encode = require('encoding-down')
var concat = require('level-concat-iterator')
var levelup = require('../lib/levelup')

test('clear()', function (t) {
  function makeTest (name, fn) {
    t.test(name, function (t) {
      var mem = memdown()

      mem.open(function (err) {
        t.ifError(err, 'no open error')

        mem.batch([
          { type: 'put', key: '"a"', value: 'a' },
          { type: 'put', key: '"b"', value: 'b' }
        ], function (err) {
          t.ifError(err, 'no batch error')

          mem.close(function (err) {
            t.ifError(err, 'no close error')
            fn(t, mem)
          })
        })
      })
    })
  }

  function verify (t, db, expectedKey) {
    concat(db.iterator({ keyAsBuffer: false }), function (err, entries) {
      t.ifError(err, 'no concat error')
      t.same(entries.map(function (e) { return e.key }), [expectedKey], 'got expected keys')
      db.close(t.end.bind(t))
    })
  }

  makeTest('clear() without encoding, without deferred-open', function (t, mem) {
    var db = levelup(mem)

    db.open(function (err) {
      t.ifError(err)

      db.clear({ gte: '"b"' }, function (err) {
        t.ifError(err, 'no clear error')
        verify(t, db, '"a"')
      })
    })
  })

  makeTest('clear() without encoding, with deferred-open', function (t, mem) {
    var db = levelup(mem)

    db.clear({ gte: '"b"' }, function (err) {
      t.ifError(err, 'no clear error')
      verify(t, db, '"a"')
    })
  })

  makeTest('clear() with encoding, with deferred-open', function (t, mem) {
    var db = levelup(encode(mem, { keyEncoding: 'json' }))

    db.clear({ gte: 'b' }, function (err) {
      t.ifError(err, 'no clear error')
      verify(t, db, 'a')
    })
  })

  makeTest('clear() with encoding, without deferred-open', function (t, mem) {
    var db = levelup(encode(mem, { keyEncoding: 'json' }))

    db.open(function (err) {
      t.ifError(err)

      db.clear({ gte: 'b' }, function (err) {
        t.ifError(err, 'no clear error')
        verify(t, db, 'a')
      })
    })
  })

  t.end()
})
