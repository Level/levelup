var errors = require('../lib/levelup').errors
var after = require('after')
var discardable = require('./util/discardable')

module.exports = function (test, testCommon) {
  test('null & undefined keys & values: cause error', function (t) {
    discardable(t, testCommon, function (db, done) {
      t.throws(db.get.bind(db, null), /^ReadError: get\(\) requires a key argument/)
      t.throws(db.get.bind(db, undefined), /^ReadError: get\(\) requires a key argument/)
      t.throws(db.del.bind(db, null), /^WriteError: del\(\) requires a key argument/)
      t.throws(db.del.bind(db, undefined), /^WriteError: del\(\) requires a key argument/)
      t.throws(db.put.bind(db, null, 'foo'), /^WriteError: put\(\) requires a key argument/)
      t.throws(db.put.bind(db, undefined, 'foo'), /^WriteError: put\(\) requires a key argument/)

      var next = after(6, done)

      db.put('foo', null, function (err, value) {
        t.is(err.message, 'value cannot be `null` or `undefined`')
        next()
      })

      db.put('foo', undefined, function (err, value) {
        t.is(err.message, 'value cannot be `null` or `undefined`')
        next()
      })

      db.batch([{ key: 'foo', value: undefined, type: 'put' }], function (err) {
        t.is(err.message, 'value cannot be `null` or `undefined`')
        next()
      })

      db.batch([{ key: 'foo', value: null, type: 'put' }], function (err) {
        t.is(err.message, 'value cannot be `null` or `undefined`')
        next()
      })

      db.batch([{ key: undefined, value: 'bar', type: 'put' }], function (err) {
        t.ok(err instanceof Error)
        t.ok(err instanceof errors.LevelUPError)
        next()
      })

      db.batch([{ key: null, value: 'bar', type: 'put' }], function (err) {
        t.ok(err instanceof Error)
        t.ok(err instanceof errors.LevelUPError)
        next()
      })
    })
  })
}
