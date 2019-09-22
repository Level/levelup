var sinon = require('sinon')
var bigBlob = Array.apply(null, Array(1024 * 100)).map(function () { return 'aaaaaaaaaa' }).join('')
var discardable = require('./util/discardable')
var readStreamContext = require('./util/rs-context')
var rsFactory = require('./util/rs-factory')

module.exports = function (test, testCommon) {
  var createReadStream = rsFactory(testCommon)

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

      var rs = createReadStream(db)
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify()
        done()
      })
    })
  }))

  test('ReadStream: pausing', makeTest(function (t, db, ctx, done) {
    var calls = 0
    var rs
    var pauseVerify = function () {
      t.is(calls, 5, 'stream should still be paused')
      rs.resume()
      pauseVerify.called = true
    }
    var onData = function () {
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

      var rs = createReadStream(db)
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

      var rs = createReadStream(db)
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
        var rs = createReadStream(db)
        rs.destroy()
        done()
      })
    })
  }))

  test('ReadStream: destroy() twice', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db)
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

      var rs = createReadStream(db)
      var endSpy = sinon.spy()
      var calls = 0
      ctx.dataSpy = sinon.spy(function () {
        if (++calls === 5) { rs.destroy() }
      })
      rs.on('data', ctx.dataSpy)
      rs.on('end', endSpy)
      rs.on('close', function () {
        // should do "data" 5 times ONLY
        t.is(ctx.dataSpy.callCount, 5, 'ReadStream emitted correct number of "data" events (5)')

        ctx.sourceData.slice(0, 5).forEach(function (d, i) {
          var call = ctx.dataSpy.getCall(i)
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

      var rs = createReadStream(db, { reverse: true })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify(ctx.sourceData.slice().reverse())
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "start"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { start: '50' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the first 50 so verify() expects only the last 50 even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice(50))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "start" and "reverse=true"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { start: '50', reverse: true })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // reverse and slice off the first 50 so verify() expects only the first 50 even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice().reverse().slice(49))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "start" being mid-way key (float)', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      // '49.5' doesn't actually exist but we expect it to start at '50' because '49' < '49.5' < '50' (in string terms as well as numeric)
      var rs = createReadStream(db, { start: '49.5' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the first 50 so verify() expects only the last 50 even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice(50))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "start" being mid-way key (float) and "reverse=true"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { start: '49.5', reverse: true })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // reverse & slice off the first 50 so verify() expects only the first 50 even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice().reverse().slice(50))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "start" being mid-way key (string)', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      // '499999' doesn't actually exist but we expect it to start at '50' because '49' < '499999' < '50' (in string terms)
      // the same as the previous test but we're relying solely on string ordering
      var rs = createReadStream(db, { start: '499999' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the first 50 so verify() expects only the last 50 even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice(50))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "end"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { end: '50' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the last 49 so verify() expects only 0 -> 50 inclusive, even though all 100 are in the db
        ctx.verify(ctx.sourceData = ctx.sourceData.slice(0, 51))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "end" being mid-way key (float)', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { end: '50.5' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the last 49 so verify() expects only 0 -> 50 inclusive, even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice(0, 51))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "end" being mid-way key (string)', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { end: '50555555' })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // slice off the last 49 so verify() expects only 0 -> 50 inclusive, even though all 100 are in the db
        ctx.verify(ctx.sourceData.slice(0, 51))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "end" being mid-way key (float) and "reverse=true"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { end: '50.5', reverse: true })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify(ctx.sourceData.slice().reverse().slice(0, 49))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with both "start" and "end"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { start: 30, end: 70 })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        // should include 30 to 70, inclusive
        ctx.verify(ctx.sourceData.slice(30, 71))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with both "start" and "end" and "reverse=true"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { start: 70, end: 30, reverse: true })
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
    var options = { keyEncoding: 'utf8', valueEncoding: 'hex' }
    var data = [
      { type: 'put', key: 'ab', value: 'abcdef0123456789' }
    ]

    db.batch(data.slice(), options, function (err) {
      t.ifError(err)

      var rs = createReadStream(db, options)
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
      var rs = createReadStream(db, { reverse: true })
      rs.on('close', function () {
        // now try reading the other way
        var rs = createReadStream(db)
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

  test('ReadStream: ReadStream, start=0', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { start: 0 })
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
  test('ReadStream: ReadStream, end=0', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { end: 0 })
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
    var db = testCommon.factory()
    var ctx = readStreamContext(t)

    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)
      db.close(function (err) {
        t.ifError(err)

        var async = true
        db.open(function (err) {
          async = false
          t.ifError(err, 'no open error')
        })

        // is in limbo
        t.is(db.isOpen(), false)
        t.is(db.isClosed(), false)

        var rs = createReadStream(db)
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

      var rs = createReadStream(db, { limit: 20 })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify(ctx.sourceData.slice(0, 20))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "start" and "limit"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { start: '20', limit: 20 })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify(ctx.sourceData.slice(20, 40))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "end" after "limit"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { end: '50', limit: 20 })
      rs.on('data', ctx.dataSpy)
      rs.on('end', ctx.endSpy)
      rs.on('close', function () {
        ctx.verify(ctx.sourceData.slice(0, 20))
        done()
      })
    })
  }))

  test('ReadStream: readStream() with "end" before "limit"', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db, { end: '30', limit: 50 })
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
    var data = []
    var i = 5
    var v

    while (i--) {
      v = bigBlob + i
      data.push({ type: 'put', key: v, value: v })
    }

    db.batch(data, function (err) {
      t.ifError(err)
      var rs = createReadStream(db).on('close', done)
      rs.once('data', function () {
        rs.destroy()
      })
    })
  }))

  test('ReadStream: can only end once', makeTest(function (t, db, ctx, done) {
    db.batch(ctx.sourceData.slice(), function (err) {
      t.ifError(err)

      var rs = createReadStream(db)
        .on('close', done)

      process.nextTick(function () {
        rs.destroy()
      })
    })
  }))
}
