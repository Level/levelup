const levelup = require('../lib/levelup')
const errors = levelup.errors
const each = require('async-each')
const series = require('run-series')
const discardable = require('./util/discardable')

module.exports = function (test, testCommon) {
  test('array-form batch(): multiple puts', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.batch([
        { type: 'put', key: 'foo', value: 'afoovalue' },
        { type: 'put', key: 'bar', value: 'abarvalue' },
        { type: 'put', key: 'baz', value: 'abazvalue' }
      ], function (err) {
        t.ifError(err)

        each(['foo', 'bar', 'baz'], function (key, next) {
          db.get(key, { asBuffer: false }, function (err, value) {
            t.ifError(err)
            t.is(value, 'a' + key + 'value')
            next()
          })
        }, done)
      })
    })
  })

  testCommon.promises && test('array-form batch(): promise interface', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.batch([
        { type: 'put', key: 'foo', value: 'afoovalue' },
        { type: 'put', key: 'bar', value: 'abarvalue' },
        { type: 'put', key: 'baz', value: 'abazvalue' }
      ])
        .then(function () {
          each(['foo', 'bar', 'baz'], function (key, next) {
            db.get(key, { asBuffer: false }, function (err, value) {
              t.ifError(err)
              t.is(value, 'a' + key + 'value')
              next()
            })
          }, done)
        })
        .catch(done)
    })
  })

  test('array-form batch(): multiple operations', function (t) {
    discardable(t, testCommon, function (db, done) {
      series([
        function (next) {
          db.batch([
            { type: 'put', key: '1', value: 'one' },
            { type: 'put', key: '2', value: 'two' },
            { type: 'put', key: '3', value: 'three' }
          ], next)
        },
        function (next) {
          db.batch([
            { type: 'put', key: 'foo', value: 'afoovalue' },
            { type: 'del', key: '1' },
            { type: 'put', key: 'bar', value: 'abarvalue' },
            { type: 'del', key: 'foo' },
            { type: 'put', key: 'baz', value: 'abazvalue' }
          ], next)
        },
        function (next) {
          // these should exist
          each(['2', '3', 'bar', 'baz'], function (key, next) {
            db.get(key, { asBuffer: false }, function (err, value) {
              t.ifError(err)
              t.ok(value != null)
              next()
            })
          }, next)
        },
        function (next) {
          // these shouldn't exist
          each(['1', 'foo'], function (key, next) {
            db.get(key, { asBuffer: false }, function (err, value) {
              t.ok(err)
              t.ok(err instanceof errors.NotFoundError)
              t.is(value, undefined)
              next()
            })
          }, next)
        }
      ], done)
    })
  })

  test('chained batch(): multiple operations', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put('1', 'one', function (err) {
        t.ifError(err)

        db.batch()
          .put('one', '1')
          .del('two')
          .put('three', '3')
          .clear()
          .del('1')
          .put('2', 'two')
          .put('3', 'three')
          .del('3')
          .write(function (err) {
            t.ifError(err)

            each(['one', 'three', '1', '2', '3'], function (key, next) {
              db.get(key, { asBuffer: false }, function (err) {
                if (['one', 'three', '1', '3'].indexOf(key) > -1) {
                  t.ok(err)
                } else {
                  t.ifError(err)
                }

                next()
              })
            }, done)
          })
      })
    })
  })

  test('chained batch(): options', function (t) {
    discardable(t, testCommon, function (db, done) {
      const batch = db.batch()
      let underlying = batch
      while (underlying.batch) underlying = underlying.batch

      const write = underlying.write.bind(underlying)
      underlying.write = function (options, cb) {
        t.same(options, { foo: 'bar' })
        write(options, cb)
      }

      batch.put('one', '1')
        .write({ foo: 'bar' }, function (err) {
          t.ifError(err)
          done()
        })
    })
  })

  testCommon.promises && test('chained batch(): promise interface - options', function (t) {
    discardable(t, testCommon, function (db, done) {
      const batch = db.batch()
      const underlying = batch.batch || batch
      const write = underlying.write.bind(underlying)

      underlying.write = function (options, cb) {
        t.same(options, { foo: 'bar' })
        return write(options, cb)
      }

      batch.put('one', '1')
        .write({ foo: 'bar' })
        .then(done)
        .catch(done)
    })
  })

  testCommon.promises && test('chained batch(): promise interface', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put('1', 'one', function (err) {
        t.ifError(err)

        db.batch()
          .put('one', '1')
          .del('two')
          .put('three', '3')
          .clear()
          .del('1')
          .put('2', 'two')
          .put('3', 'three')
          .del('3')
          .write()
          .then(function () {
            each(['one', 'three', '1', '2', '3'], function (key, next) {
              db.get(key, { asBuffer: false }, function (err) {
                if (['one', 'three', '1', '3'].indexOf(key) > -1) {
                  t.ok(err)
                } else {
                  t.ifError(err)
                }

                next()
              })
            }, done)
          })
          .catch(done)
      })
    })
  })

  test('chained batch(): exposes ops queue length', function (t) {
    discardable(t, testCommon, function (db, done) {
      const batch = db.batch()
        .put('one', '1')
        .del('two')
        .put('three', '3')
      t.is(batch.length, 3)
      batch.clear()
      t.is(batch.length, 0)
      batch
        .del('1')
        .put('2', 'two')
        .put('3', 'three')
        .del('3')
      t.is(batch.length, 4)
      done()
    })
  })

  test('array-form batch(): can overwrite data from put()', function (t) {
    // checks encoding and whatnot  (?)
    discardable(t, testCommon, function (db, done) {
      series([
        db.put.bind(db, '1', 'one'),
        db.put.bind(db, '2', 'two'),
        db.put.bind(db, '3', 'three'),
        function (next) {
          db.batch([
            { type: 'put', key: 'foo', value: 'afoovalue' },
            { type: 'del', key: '1' },
            { type: 'put', key: 'bar', value: 'abarvalue' },
            { type: 'del', key: 'foo' },
            { type: 'put', key: 'baz', value: 'abazvalue' }
          ], next)
        },
        function (next) {
          // these should exist
          each(['2', '3', 'bar', 'baz'], function (key, next) {
            db.get(key, { asBuffer: false }, function (err, value) {
              t.ifError(err)
              t.ok(value != null)
              next()
            })
          }, next)
        },
        function (next) {
          // these shouldn't exist
          each(['1', 'foo'], function (key, next) {
            db.get(key, { asBuffer: false }, function (err, value) {
              t.ok(err)
              t.ok(err instanceof errors.NotFoundError)
              t.is(value, undefined)
              next()
            })
          }, next)
        }
      ], done)
    })
  })

  test('array-form batch(): data can be read with get() and del()', function (t) {
    discardable(t, testCommon, function (db, done) {
      series([
        function (next) {
          db.batch([
            { type: 'put', key: '1', value: 'one' },
            { type: 'put', key: '2', value: 'two' },
            { type: 'put', key: '3', value: 'three' }
          ], next)
        },
        db.del.bind(db, '1', 'one'),
        function (next) {
          // these should exist
          each(['2', '3'], function (key, next) {
            db.get(key, { asBuffer: false }, function (err, value) {
              t.ifError(err)
              t.ok(value != null)
              next()
            })
          }, next)
        },
        function (next) {
          // this shouldn't exist
          db.get('1', { asBuffer: false }, function (err, value) {
            t.ok(err)
            t.ok(err instanceof errors.NotFoundError)
            t.is(value, undefined)
            next()
          })
        }
      ], done)
    })
  })

  test('chained batch() arguments', function (t) {
    discardable(t, testCommon, function (db, done) {
      const batch = db.batch()

      t.test('chained batch() arguments: batch#put() with missing `value`', function (t) {
        throws(t, batch.put.bind(batch, 'foo1'), function (err) {
          t.is(err.name, 'WriteError')
          t.is(err.message, 'value cannot be `null` or `undefined`')
        })

        throws(t, batch.put.bind(batch, 'foo1', null), function (err) {
          t.is(err.name, 'WriteError')
          t.is(err.message, 'value cannot be `null` or `undefined`')
        })

        t.end()
      })

      t.test('chained batch() arguments: batch#put() with missing `key`', function (t) {
        throws(t, batch.put.bind(batch, undefined, 'foo1'), function (err) {
          t.is(err.name, 'WriteError')
          t.is(err.message, 'key cannot be `null` or `undefined`')
        })

        throws(t, batch.put.bind(batch, null, 'foo1'), function (err) {
          t.is(err.name, 'WriteError')
          t.is(err.message, 'key cannot be `null` or `undefined`')
        })

        t.end()
      })

      t.test('chained batch() arguments: batch#put() with missing `key` and `value`', function (t) {
        throws(t, batch.put.bind(batch), function (err) {
          t.is(err.name, 'WriteError')
          t.is(err.message, 'key cannot be `null` or `undefined`')
        })

        throws(t, batch.put.bind(batch, null, null), function (err) {
          t.is(err.name, 'WriteError')
          t.is(err.message, 'key cannot be `null` or `undefined`')
        })

        t.end()
      })

      t.test('chained batch() arguments: batch#del() with missing `key`', function (t) {
        throws(t, batch.del.bind(batch, undefined, 'foo1'), function (err) {
          t.is(err.name, 'WriteError')
          t.is(err.message, 'key cannot be `null` or `undefined`')
        })

        throws(t, batch.del.bind(batch, null, 'foo1'), function (err) {
          t.is(err.name, 'WriteError')
          t.is(err.message, 'key cannot be `null` or `undefined`')
        })

        t.end()
      })

      t.test('chained batch() arguments: teardown', function (t) {
        t.end()
        done()
      })
    })
  })

  test('chained batch(): rejects operations after write()', function (t) {
    discardable(t, testCommon, function (db, done) {
      function verify (err) {
        t.is(err.name, 'WriteError')
        t.is(err.message, 'write() already called on this batch')
      }

      const batch = db.batch()
      batch.put('foo', 'bar').put('boom', 'bang').del('foo').write(function (err) {
        t.ifError(err, 'no batch error')

        throws(t, function () { batch.put('whoa', 'dude') }, verify)
        throws(t, function () { batch.del('foo') }, verify)
        throws(t, function () { batch.clear() }, verify)

        done()
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
