const each = require('async-each')
const parallel = require('run-parallel')
const concat = require('concat-stream')
const readStreamContext = require('./util/rs-context')
const rsFactory = require('./util/rs-factory')

module.exports = function (test, testCommon) {
  const createReadStream = rsFactory(testCommon)

  test('deferred open(): put() and get() on new database', function (t) {
    // 1) open database without callback, opens in next tick
    const db = testCommon.factory()

    parallel([
      // 2) insert 3 values with put(), these should be deferred until the database is actually open
      db.put.bind(db, 'k1', 'v1'),
      db.put.bind(db, 'k2', 'v2'),
      db.put.bind(db, 'k3', 'v3')
    ], function () {
      // 3) when the callbacks have returned, the database should be open and those values should be in
      //    verify that the values are there
      each([1, 2, 3], function (k, next) {
        db.get('k' + k, { asBuffer: false }, function (err, v) {
          t.ifError(err)
          t.is(v, 'v' + k)
          next()
        })
      }, function () {
        db.get('k4', { asBuffer: false }, function (err) {
          t.ok(err)
          db.close(t.end.bind(t))
        })
      })
    })

    t.is(db.status, 'opening')
  })

  test('deferred open(): put() and get() on reopened database', async function (t) {
    const db = testCommon.factory()

    await db.close()
    t.is(db.status, 'closed')

    db.open(() => {})
    t.is(db.status, 'opening')

    await db.put('beep', 'boop')

    t.is(db.status, 'open')
    t.is(await db.get('beep', { asBuffer: false }), 'boop')

    await db.close()
  })

  test('deferred open(): batch() on new database', function (t) {
    // 1) open database without callback, opens in next tick
    const db = testCommon.factory()

    // 2) insert 3 values with batch(), these should be deferred until the database is actually open
    db.batch([
      { type: 'put', key: 'k1', value: 'v1' },
      { type: 'put', key: 'k2', value: 'v2' },
      { type: 'put', key: 'k3', value: 'v3' }
    ], function () {
      // 3) when the callbacks have returned, the database should be open and those values should be in
      //    verify that the values are there
      each([1, 2, 3], function (k, next) {
        db.get('k' + k, { asBuffer: false }, function (err, v) {
          t.ifError(err)
          t.is(v, 'v' + k)
          next()
        })
      }, function () {
        db.get('k4', { asBuffer: false }, function (err) {
          t.ok(err)
          db.close(t.end.bind(t))
        })
      })
    })

    t.is(db.status, 'opening')
  })

  test('deferred open(): chained batch() on new database', function (t) {
    // 1) open database without callback, opens in next tick
    const db = testCommon.factory()

    // 2) insert 3 values with batch(), these should be deferred until the database is actually open
    db.batch()
      .put('k1', 'v1')
      .put('k2', 'v2')
      .put('k3', 'v3')
      .write(function () {
      // 3) when the callbacks have returned, the database should be open and those values should be in
      //    verify that the values are there
        each([1, 2, 3], function (k, next) {
          db.get('k' + k, { asBuffer: false }, function (err, v) {
            t.ifError(err)
            t.is(v, 'v' + k)
            next()
          })
        }, function () {
          db.get('k4', { asBuffer: false }, function (err) {
            t.ok(err)
            db.close(t.end.bind(t))
          })
        })
      })

    t.is(db.status, 'opening')
  })

  testCommon.streams && test('deferred open(): test deferred ReadStream', function (t) {
    const ctx = readStreamContext(t)
    const db = testCommon.factory()

    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)
      db.close(function (err) {
        t.ifError(err, 'no error')
        let async = true

        db.open(function (err) {
          async = false
          t.ifError(err, 'no open error')
        })

        createReadStream(db)
          .on('data', ctx.dataSpy)
          .on('end', ctx.endSpy)
          .on('close', function () {
            ctx.verify()
            db.close(t.end.bind(t))
          })

        // db should open lazily
        t.ok(async)
      })
    })
  })

  test('deferred open(): no maxListeners warning', function (t) {
    // 1) open database without callback, opens in next tick
    const db = testCommon.factory()
    const fail = t.fail.bind(t)

    process.on('warning', fail)

    // 2) provoke an EventEmitter maxListeners warning
    let toPut = 11

    for (let i = 0; i < toPut; i++) {
      db.put('some', 'string', function (err) {
        t.ifError(err)
        if (!--toPut) {
          process.removeListener('warning', fail)
          db.close(t.end.bind(t))
        }
      })
    }
  })

  testCommon.encodings && test('deferred open(): value of queued operation is not serialized', function (t) {
    const db = testCommon.factory({ valueEncoding: 'json' })

    // deferred-leveldown < 2.0.2 would serialize the object to a string.
    db.put('key', { thing: 2 }, function (err) {
      t.ifError(err)

      db.get('key', function (err, value) {
        t.ifError(err)
        t.same(value, { thing: 2 })
        db.close(t.end.bind(t))
      })
    })
  })

  testCommon.encodings && test('deferred open(): key of queued operation is not serialized', function (t) {
    const db = testCommon.factory({ keyEncoding: 'json' })

    // deferred-leveldown < 2.0.2 would serialize the key to a string.
    db.put({ thing: 2 }, 'value', function (err) {
      t.ifError(err)

      db.createKeyStream().pipe(concat(function (result) {
        t.same(result, [{ thing: 2 }])
        db.close(t.end.bind(t))
      }))
    })
  })
}
