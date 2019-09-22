var errors = require('../lib/levelup').errors
var each = require('async-each')
var series = require('run-series')
var discardable = require('./util/discardable')

module.exports = function (test, testCommon) {
  test('get() / put() / del(): get() on empty database causes error', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.get('undefkey', function (err, value) {
        t.notOk(value)
        t.ok(err instanceof Error)
        t.ok(err instanceof errors.LevelUPError)
        t.ok(err instanceof errors.NotFoundError)
        t.is(err.notFound, true, 'err.notFound is `true`')
        t.is(err.status, 404, 'err.status is 404')
        t.ok(/\[undefkey\]/.test(err))
        done()
      })
    })
  })

  testCommon.promises && test('get() / put() / del(): get() on empty database causes error (promise)', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.get('undefkey').catch(function (err) {
        t.ok(err instanceof Error)
        t.ok(err instanceof errors.LevelUPError)
        t.ok(err instanceof errors.NotFoundError)
        t.is(err.notFound, true, 'err.notFound is `true`')
        t.is(err.status, 404, 'err.status is 404')
        t.ok(/\[undefkey\]/.test(err))
        done()
      })
    })
  })

  test('get() / put() / del(): put() and get() simple string entries', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put('some key', 'some value stored in the database', function (err) {
        t.ifError(err)
        db.get('some key', { asBuffer: false }, function (err, value) {
          t.ifError(err)
          t.is(value, 'some value stored in the database')
          done()
        })
      })
    })
  })

  testCommon.promises && test('get() / put() / del(): put() and get() simple string entries (promise)', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put('some key', 'some value stored in the database')
        .then(function () {
          return db.get('some key', { asBuffer: false })
        })
        .then(function (value) {
          t.is(value, 'some value stored in the database')
          done()
        })
        .catch(done)
    })
  })

  test('get() / put() / del(): can del() on empty database', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.del('undefkey', function (err) {
        t.ifError(err)
        done()
      })
    })
  })

  testCommon.promises && test('get() / put() / del(): can del() on empty database (promise)', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.del('undefkey')
        .then(done)
        .catch(done)
    })
  })

  test('get() / put() / del(): del() works on real entries', function (t) {
    discardable(t, testCommon, function (db, done) {
      series([
        function (next) {
          each(['foo', 'bar', 'baz'], function (key, next) {
            db.put(key, 1 + Math.random(), next)
          }, next)
        },
        function (next) {
          db.del('bar', next)
        },
        function (next) {
          each(['foo', 'bar', 'baz'], function (key, next) {
            db.get(key, { asBuffer: false }, function (err, value) {
              // we should get foo & baz but not bar
              if (key === 'bar') {
                t.ok(err)
                t.notOk(value)
              } else {
                t.ifError(err)
                t.ok(value)
              }

              next()
            })
          }, next)
        }
      ], done)
    })
  })

  test('get() / put() / del(): throw if no key is provided', function (t) {
    discardable(t, testCommon, function (db, done) {
      t.throws(db.get.bind(db), /^ReadError: get\(\) requires a key argument/, 'no-arg get() throws')
      t.throws(db.put.bind(db), /^WriteError: put\(\) requires a key argument/, 'no-arg put() throws')
      t.throws(db.del.bind(db), /^WriteError: del\(\) requires a key argument/, 'no-arg del() throws')
      done()
    })
  })
}
