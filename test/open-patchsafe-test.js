module.exports = function (test, testCommon) {
  test('deferred open() is patch-safe: put() on new database', makeTest(function (t, db, done) {
    const put = db.put
    let called = 0

    db.put = function () {
      called++
      return put.apply(this, arguments)
    }

    db.put('key', 'VALUE', function () {
      t.is(called, 1)
      done()
    })
  }))

  test('deferred open() is patch-safe: del() on new database', makeTest(function (t, db, done) {
    const del = db.del
    let called = 0

    db.del = function () {
      called++
      return del.apply(this, arguments)
    }

    db.del('key', function () {
      t.is(called, 1)
      done()
    })
  }))

  test('deferred open() is patch-safe: batch() on new database', makeTest(function (t, db, done) {
    const batch = db.batch
    let called = 0

    db.batch = function () {
      called++
      return batch.apply(this, arguments)
    }

    db.batch([
      { key: 'key', value: 'v', type: 'put' },
      { key: 'key2', value: 'v2', type: 'put' }
    ], function () {
      t.is(called, 1)
      done()
    })
  }))

  function makeTest (fn) {
    return function (t) {
      // Open database without callback, opens in next tick
      const db = testCommon.factory()

      fn(t, db, function (err) {
        t.ifError(err, 'no test error')
        db.close(t.end.bind(t))
      })

      t.is(db.status, 'opening')
    }
  }
}
