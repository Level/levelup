'use strict'

var discardable = require('./util/discardable')

module.exports = function (test, testCommon) {
  test('maybeError() should be called async: put()', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.close(function () {
        t.is(db.isClosed(), true, 'db is closed')
        var sync = false
        db.put('key', 'value', {}, function (err) {
          sync = true
          t.ok(err)
          t.is(err.message, 'Database is not open')
        })
        t.is(sync, false, '.put cb called asynchronously')
        done()
      })
    })
  })

  test('maybeError() should be called async: get()', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put('key', 'value', {}, function (err) {
        t.ifError(err)
        db.close(function () {
          t.is(db.isClosed(), true, 'db is closed')
          var sync = false
          db.get('key', {}, function (err, value) {
            sync = true
            t.ok(err)
            t.is(err.message, 'Database is not open')
          })
          t.is(sync, false, '.get cb called asynchronously')
          done()
        })
      })
    })
  })

  test('maybeError() should be called async: del()', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put('key', 'value', {}, function (err) {
        t.ifError(err)
        db.close(function () {
          t.is(db.isClosed(), true, 'db is closed')
          var sync = false
          db.del('key', {}, function (err) {
            sync = true
            t.ok(err)
            t.is(err.message, 'Database is not open')
          })
          t.is(sync, false, '.del cb called asynchronously')
          done()
        })
      })
    })
  })

  test('maybeError() should be called async: batch()', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.close(function () {
        t.is(db.isClosed(), true, 'db is closed')
        var sync = false
        db.batch([{ type: 'put', key: 'key' }], {}, function (err) {
          sync = true
          t.ok(err)
          t.is(err.message, 'Database is not open')
        })
        t.is(sync, false, '.batch cb called asynchronously')
        done()
      })
    })
  })
}
