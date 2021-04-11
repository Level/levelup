const each = require('async-each')
const discardable = require('./util/discardable')

module.exports = function (test, testCommon) {
  test('custom encoding: simple-object values in "json" encoding', function (t) {
    run(t, [
      { key: '0', value: 0 },
      { key: '1', value: 1 },
      { key: 'string', value: 'a string' },
      { key: 'true', value: true },
      { key: 'false', value: false }
    ])
  })

  test('custom encoding: simple-object keys in "json" encoding', function (t) {
    // Test keys that would be considered the same with default utf8 encoding.
    // Because String([1]) === String(1).
    run(t, [
      { value: '0', key: [1] },
      { value: '1', key: 1 },
      { value: 'string', key: 'a string' },
      { value: 'true', key: true },
      { value: 'false', key: false }
    ])
  })

  test('custom encoding: complex-object values in "json" encoding', function (t) {
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

  test('custom encoding: complex-object keys in "json" encoding', function (t) {
    // Test keys that would be considered the same with default utf8 encoding.
    // Because String({}) === String({}) === '[object Object]'.
    run(t, [
      {
        value: '0',
        key: {
          foo: 'bar',
          bar: [1, 2, 3],
          bang: { yes: true, no: false }
        }
      },
      {
        value: '1',
        key: {
          foo: 'different',
          bar: [1, 2, 3],
          bang: { yes: true, no: false }
        }
      }
    ])
  })

  function run (t, entries) {
    const customEncoding = {
      encode: JSON.stringify,
      decode: JSON.parse,
      buffer: false,
      type: 'custom'
    }

    discardable(t, testCommon, {
      keyEncoding: customEncoding,
      valueEncoding: customEncoding
    }, function (db, done) {
      const ops = entries.map(function (entry) {
        return { type: 'put', key: entry.key, value: entry.value }
      })

      db.batch(ops, function (err) {
        t.ifError(err)
        each(entries, visit, done)

        function visit (entry, next) {
          db.get(entry.key, function (err, value) {
            t.ifError(err)
            t.same(entry.value, value)
            next()
          })
        }
      })
    })
  }
}
