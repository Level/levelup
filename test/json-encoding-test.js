const each = require('async-each')
const parallel = require('run-parallel')
const concatStream = require('concat-stream')
const concatIterator = require('level-concat-iterator')
const discardable = require('./util/discardable')

module.exports = function (test, testCommon) {
  test('json encoding: simple-object values in "json" encoding', function (t) {
    run(t, [
      { key: '0', value: 0 },
      { key: '1', value: 1 },
      { key: '2', value: 'a string' },
      { key: '3', value: true },
      { key: '4', value: false }
    ])
  })

  test('json encoding: simple-object keys in "json" encoding', function (t) {
    run(t, [
      { value: 'string', key: 'a string' },
      { value: '0', key: 0 },
      { value: '1', key: 1 },
      { value: 'false', key: false },
      { value: 'true', key: true }
    ])
  })

  test('json encoding: complex-object values in "json" encoding', function (t) {
    run(t, [
      {
        key: '0',
        value: {
          foo: 'bar',
          bar: [1, 2, 3],
          bang: { yes: true, no: false }
        }
      }
    ])
  })

  test('json encoding: complex-object keys in "json" encoding', function (t) {
    run(t, [
      {
        value: '0',
        key: {
          foo: 'bar',
          bar: [1, 2, 3],
          bang: { yes: true, no: false }
        }
      }
    ])
  })

  function run (t, entries) {
    discardable(t, testCommon, {
      keyEncoding: 'json',
      valueEncoding: 'json'
    }, function (db, done) {
      const ops = entries.map(function (entry) {
        return { type: 'put', key: entry.key, value: entry.value }
      })

      db.batch(ops, function (err) {
        t.ifError(err)

        parallel([testGet, testStream, testIterator], function (err) {
          t.ifError(err)
          done()
        })
      })

      function testGet (next) {
        each(entries, function (entry, next) {
          db.get(entry.key, function (err, value) {
            t.ifError(err)
            t.same(entry.value, value)
            next()
          })
        }, next)
      }

      function testStream (next) {
        db.createReadStream().pipe(concatStream(function (result) {
          t.same(result, entries)
          next()
        }))
      }

      function testIterator (next) {
        concatIterator(db.iterator(), function (err, result) {
          t.ifError(err)
          t.same(result, entries)
          next()
        })
      }
    })
  }
}
