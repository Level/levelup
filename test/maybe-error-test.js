'use strict'

const discardable = require('./util/discardable')

module.exports = function (test, testCommon) {
  test('maybeError() should be called async: put()', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.close(function () {
        t.is(db.isClosed(), true, 'db is closed')
        let sync = false
        db.put('key', 'value', {}, function (err) {
          sync = true
          t.ok(err)
          t.is(err.message, 'Database is not open')
        })
        t.is(sync, false, '.put cb called asynchronously')
        done() // TODO: called too soon, we still have 2 pending assertions
      })
    })
  })

  test('maybeError() should be called async: get()', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put('key', 'value', {}, function (err) {
        t.ifError(err)
        db.close(function () {
          t.is(db.isClosed(), true, 'db is closed')
          let sync = false
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
          let sync = false
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
        let sync = false
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

  test('maybeError() should be called async: getMany()', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.close(function () {
        t.is(db.status, 'closed', 'db is closed')
        let sync = false
        db.getMany(['key'], function (err) {
          sync = true
          t.is(err && err.message, 'Database is not open')
          done()
        })
        t.is(sync, false, '.getMany cb called asynchronously')
      })
    })
  })
}
