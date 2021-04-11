const sinon = require('sinon')
const bigBlob = Array.apply(null, Array(1024 * 100)).map(function () { return 'aaaaaaaaaa' }).join('')
const discardable = require('./util/discardable')
const readStreamContext = require('./util/rs-context')
const rsFactory = require('./util/rs-factory')
const nextTick = require('../lib/next-tick')

module.exports = function (test, testCommon) {
  const createReadStream = rsFactory(testCommon)

  function makeTest (fn) {
    return function (t) {
      discardable(t, testCommon, function (db, done) {
        fn(t, db, readStreamContext(t), done)
      })
    }
  }

  test('ReadStream: simple ReadStream', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db)
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify()
        done()
      })
    })
  }))

  test('ReadStream: pausing', makeTest(function (t, db, ctx, done) {
    let calls = 0
    let rs

    const pauseVerify = function () {
      t.is(calls, 5, 'stream should still be paused')
      rs.resume()
      pauseVerify.called = true
    }
    const onData = function () {
      if (++calls === 5) {
        rs.pause()
        setTimeout(pauseVerify, 50)
      }
    }

    // so we can still verify
    ctx.dataSpy = sinon.spy(onData)

    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      rs = createReadStream(db)
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('end', function () {
        t.is(calls, ctx.sourceData.length, 'onData was used in test')
        t.ok(pauseVerify.called, 'pauseVerify was used in test')
        ctx.verify()
        done()
      })
    })
  }))

  test('ReadStream: destroy() immediately', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db)
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        t.is(ctx.dataSpy.callCount, 0, '"data" event was not fired')
        t.is(ctx.endSpy.callCount, 0, '"end" event was not fired')
        done()
      })
      rs.destroy()
    })
  }))

  test('ReadStream: destroy() after close', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db)
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        rs.destroy()
        done()
      })
    })
  }))

  test('ReadStream: destroy() after closing db', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)
      db.close(function (err) {
        t.ifError(err)
        const rs = createReadStream(db)
        rs.destroy()
        done()
      })
    })
  }))

  test('ReadStream: destroy() twice', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db)
      rs.on('data', function () {
        rs.destroy()
        rs.destroy()
        done()
      })
    })
  }))

  test('ReadStream: destroy() half way through', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db)
      const endSpy = sinon.spy()
      let calls = 0
      ctx.dataSpy = sinon.spy(function () {
        if (++calls === 5) { rs.destroy() }
      })
      rs.on('data', ctx.dataSpy)
      rs.on('end', endSpy)
      rs.on('close', function () {
        // should do "data" 5 times ONLY
        t.is(ctx.dataSpy.callCount, 5, 'ReadStream emitted correct number of "data" events (5)')

        ctx.sourceData.slice(0, 5).forEach(function (d, i) {
          const call = ctx.dataSpy.getCall(i)
          t.ok(call)

          if (call) {
            t.is(call.args.length, 1, 'ReadStream "data" event #' + i + ' fired with 1 argument')
            t.ok(call.args[0].key != null, 'ReadStream "data" event #' + i + ' argument has "key" property')
            t.ok(call.args[0].value != null, 'ReadStream "data" event #' + i + ' argument has "value" property')
            t.is(call.args[0].key, d.key, 'ReadStream "data" event #' + i + ' argument has correct "key"')
            t.is(+call.args[0].value, +d.value, 'ReadStream "data" event #' + i + ' argument has correct "value"')
          }
        })

        done()
      })
    })
  }))

  test('ReadStream: readStream() with "reverse=true"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { reverse: true })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify(ctx.sourceData.slice().reverse())
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "gte"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { gte: '50' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the first 50 so verify() expects only the last 50 even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice(50))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "lte" and "reverse=true"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { lte: '50', reverse: true })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // reverse and slice off the first 50 so verify() expects only the first 50 even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice().reverse().slice(49))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "gte" being mid-way key (float)', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      // '49.5' doesn't actually exist but we expect it to start at '50' because '49' < '49.5' < '50' (in string terms as well as numeric)
      const rs = createReadStream(db, { gte: '49.5' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the first 50 so verify() expects only the last 50 even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice(50))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "lte" being mid-way key (float) and "reverse=true"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { lte: '49.5', reverse: true })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // reverse & slice off the first 50 so verify() expects only the first 50 even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice().reverse().slice(50))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "gte" being mid-way key (string)', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      // '499999' doesn't actually exist but we expect it to start at '50' because '49' < '499999' < '50' (in string terms)
      // the same as the previous test but we're relying solely on string ordering
      const rs = createReadStream(db, { gte: '499999' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the first 50 so verify() expects only the last 50 even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice(50))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "lte"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { lte: '50' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the last 49 so verify() expects only 0 -> 50 inclusive, even though all 100 are in the db
        ctx.verify(ctx.sourceData = ctx.sourceData.slice(0, 51))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "lte" being mid-way key (float)', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { lte: '50.5' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the last 49 so verify() expects only 0 -> 50 inclusive, even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice(0, 51))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "lte" being mid-way key (string)', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { lte: '50555555' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the last 49 so verify() expects only 0 -> 50 inclusive, even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice(0, 51))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "gte" being mid-way key (float) and "reverse=true"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { gte: '50.5', reverse: true })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify(ctx.sourceData.slice().reverse().slice(0, 49))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with both "gte" and "lte"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { gte: 30, lte: 70 })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // should include 30 to 70, inclusive
        ctx.verify(ctx.sourceData.slice(30, 71))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with both "gte" and "lte" and "reverse=true"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { gte: 30, lte: 70, reverse: true })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // expect 70 -> 30 inclusive
        ctx.verify(ctx.sourceData.slice().reverse().slice(29, 70))
        done()
      })
    })
  }))

  // TODO: move this test out
  testCommon.encodings && test('ReadStream: hex encoding', makeTest(function (t, db, ctx, done) {
    const options = { keyEncoding: 'utf8', valueEncoding: 'hex' }
    const data = [
      { type: 'put', key: 'ab', value: 'abcdef0123456789' }
    ]

    db.batch(data.slice(), options, function (err) {
      t.ifError(err)

      const rs = createReadStream(db, options)
      rs.on('data', function (data) {
        t.is(data.value, 'abcdef0123456789')
      })
      rs.on('end', ctx.endSpy)
      rs.on('close', done)
    })
  }))

  test('ReadStream: readStream() "reverse=true" not sticky (issue #6)', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)
      // read in reverse, assume all's good
      const rs = createReadStream(db, { reverse: true })
      rs.on('close', function () {
        // now try reading the other way
        const rs = createReadStream(db)
        rs.on('data', ctx.dataSpy)
        rs.on('end', ctx.endSpy)
        rs.on('close', function () {
          ctx.verify()
          done()
        })
      })
      rs.resume()
    })
  }))

  test('ReadStream: ReadStream, gte=0', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { gte: 0 })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify()
        done()
      })
    })
  }))

  // we don't expect any data to come out of here because the keys start at '00' not 0
  // we just want to ensure that we don't kill the process
  test('ReadStream: ReadStream, lte=0', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { lte: 0 })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify([])
        done()
      })
    })
  }))

  // this is just a fancy way of testing levelup(db).createReadStream()
  // i.e. not waiting for 'open' to complete
  // TODO: move this test out
  testCommon.deferredOpen && test('ReadStream: deferred ReadStream on new db', function (t) {
    const db = testCommon.factory()
    const ctx = readStreamContext(t)

    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)
      db.close(function (err) {
        t.ifError(err)

        let async = true
        db.open(function (err) {
          async = false
          t.ifError(err, 'no open error')
        })

        // is in limbo
        t.is(db.isOpen(), false)
        t.is(db.isClosed(), false)

        const rs = createReadStream(db)
        rs.on('data', ctx.dataSpy)
        rs.on('end', ctx.endSpy)
        rs.on('close', function () {
          ctx.verify()
          db.close(t.end.bind(t))
        })

        // Should open lazily
        t.ok(async)
      })
    })
  })

  test('ReadStream: readStream() with "limit"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { limit: 20 })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify(ctx.sourceData.slice(0, 20))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "gte" and "limit"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { gte: '20', limit: 20 })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify(ctx.sourceData.slice(20, 40))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "lte" after "limit"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { lte: '50', limit: 20 })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify(ctx.sourceData.slice(0, 20))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "lte" before "limit"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db, { lte: '30', limit: 50 })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify(ctx.sourceData.slice(0, 31))
        done()
      })
    })
  }))

  // can, fairly reliably, trigger a core dump if next/end isn't
  // protected properly
  // the use of large blobs means that next() takes time to return
  // so we should be able to slip in an end() while it's working
  test('ReadStream: iterator next/end race condition', makeTest(function (t, db, ctx, done) {
    const data = []
    let i = 5
    let v

    while (i--) {
      v = bigBlob + i
      data.push({ type: 'put', key: v, value: v })
    }

    db.batch(data, function (err) {
      t.ifError(err)
      const rs = createReadStream(db).on('close', done)
      rs.once('data', function () {
        rs.destroy()
      })
    })
  }))

  test('ReadStream: can only end once', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      const rs = createReadStream(db)
        .on('close', done)

      nextTick(function () {
        rs.destroy()
      })
    })
  }))
}
