var after = require('after')
var discardable = require('./util/discardable')

module.exports = function (test, testCommon) {
  test('null & undefined keys & values: cause error', function (t) {
    discardable(t, testCommon, function (db, done) {
      var next = after(12, done)

      ;[null, undefined].forEach(function (nullish) {
        db.get(nullish, function (err) {
          t.is(err.message, 'key cannot be `null` or `undefined`')
          next()
        })

        db.del(nullish, function (err) {
          t.is(err.message, 'key cannot be `null` or `undefined`')
          next()
        })

        db.put(nullish, 'value', function (err) {
          t.is(err.message, 'key cannot be `null` or `undefined`')
          next()
        })

        db.put('foo', nullish, function (err, value) {
          t.is(err.message, 'value cannot be `null` or `undefined`')
          next()
        })

        db.batch([{ key: nullish, value: 'bar', type: 'put' }], function (err) {
          t.is(err.message, 'key cannot be `null` or `undefined`')
          next()
        })

        db.batch([{ key: 'foo', value: nullish, type: 'put' }], function (err) {
          t.is(err.message, 'value cannot be `null` or `undefined`')
          next()
        })
      })
    })
  })
}
