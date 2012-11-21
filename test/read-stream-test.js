/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var buster     = require('buster')
  , assert     = buster.assert
  , levelup    = require('../lib/levelup.js')
  , common     = require('./common')
  , SlowStream = require('slow-stream')
  , delayed    = require('delayed')
  , rimraf     = require('rimraf')
  , async      = require('async')

buster.testCase('ReadStream', {
    'setUp': function () {
      common.commonSetUp.call(this)

      this.readySpy   = this.spy()
      this.dataSpy    = this.spy()
      this.endSpy     = this.spy()
      this.sourceData = []

      for (var i = 0; i < 100; i++) {
        var k = (i < 10 ? '0' : '') + i
        this.sourceData.push({
            type  : 'put'
          , key   : k
          , value : Math.random()
        })
      }

      this.verify = function (rs, done, data) {
        if (!data) data = this.sourceData // can pass alternative data array for verification
        assert.isFalse(rs.writable)
        assert.isFalse(rs.readable)
        assert.equals(this.readySpy.callCount, 1, 'ReadStream emitted single "ready" event')
        assert.equals(this.endSpy.callCount, 1, 'ReadStream emitted single "end" event')
        assert.equals(this.dataSpy.callCount, data.length, 'ReadStream emitted correct number of "data" events')
        data.forEach(function (d, i) {
          var call = this.dataSpy.getCall(i)
          if (call) {
            //console.log('call', i, ':', call.args[0].key, '=', call.args[0].value, '(expected', d.key, '=', d.value, ')')
            assert.equals(call.args.length, 1, 'ReadStream "data" event #' + i + ' fired with 1 argument')
            refute.isNull(call.args[0].key, 'ReadStream "data" event #' + i + ' argument has "key" property')
            refute.isNull(call.args[0].value, 'ReadStream "data" event #' + i + ' argument has "value" property')
            assert.equals(call.args[0].key, d.key, 'ReadStream "data" event #' + i + ' argument has correct "key"')
            assert.equals(call.args[0].value, d.value, 'ReadStream "data" event #' + i + ' argument has correct "value"')
          }
        }.bind(this))
        done()
      }.bind(this)
    }

  , 'tearDown': common.commonTearDown

  //TODO: test various encodings

  , 'test simple ReadStream': function (done) {
      this.openTestDatabase(function (db) {
        // execute
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream()
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))
        }.bind(this))
      }.bind(this))
    }

  , 'test pausing': function (done) {
      var calls = 0
        , rs
        , pauseVerify = function () {
            // NOTE: another one *will* slip through because the stream triggers an async read before triggering the event
            assert.equals(calls, 6, 'stream should still be paused')
            rs.resume()
            pauseVerify.called = true
          }
        , onData = function () {
            if (++calls == 5) {
              rs.pause()
              setTimeout(pauseVerify, 50)
            }
          }
        , verify = function () {
            assert.equals(calls, this.sourceData.length, 'onData was used in test')
            assert(pauseVerify.called, 'pauseVerify was used in test')
            this.verify(rs, done)
          }.bind(this)

      this.dataSpy = this.spy(onData) // so we can still verify

      this.openTestDatabase(function (db) {
        // execute
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          rs = db.readStream()
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', verify.bind(this))

        }.bind(this))
      }.bind(this))
    }

  , 'test destroy() immediately': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream()
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', function () {
            assert.isFalse(rs.writable)
            assert.isFalse(rs.readable)
            assert.equals(this.readySpy.callCount, 0, '"ready" event was not fired')
            assert.equals(this.dataSpy.callCount , 0, '"data" event was not fired')
            assert.equals(this.endSpy.callCount  , 0, '"end" event was not fired')
            done()
          }.bind(this))
          rs.destroy()
        }.bind(this))
      }.bind(this))
    }

  , 'test destroy() half way through': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream()
            , endSpy = this.spy()
            , calls = 0
          this.dataSpy = this.spy(function () {
            if (++calls == 5)
              rs.destroy()
          })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , endSpy)
          rs.on('close', function () {
            assert.isFalse(rs.writable)
            assert.isFalse(rs.readable)
            assert.equals(this.readySpy.callCount, 1, 'ReadStream emitted single "ready" event')
            // should do "data" 5 times ONLY
            assert.equals(this.dataSpy.callCount, 5, 'ReadStream emitted correct number of "data" events (5)')
            this.sourceData.slice(0, 5).forEach(function (d, i) {
              var call = this.dataSpy.getCall(i)
              assert(call)
              if (call) {
                assert.equals(call.args.length, 1, 'ReadStream "data" event #' + i + ' fired with 1 argument')
                refute.isNull(call.args[0].key, 'ReadStream "data" event #' + i + ' argument has "key" property')
                refute.isNull(call.args[0].value, 'ReadStream "data" event #' + i + ' argument has "value" property')
                assert.equals(call.args[0].key, d.key, 'ReadStream "data" event #' + i + ' argument has correct "key"')
                assert.equals(call.args[0].value, d.value, 'ReadStream "data" event #' + i + ' argument has correct "value"')
              }
            }.bind(this))
            done()
          }.bind(this))
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "reverse=true"': function (done) {
      this.openTestDatabase(function (db) {
        // execute
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ reverse: true })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          this.sourceData.reverse() // for verify
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "start"': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ start: '50' })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          // slice off the first 50 so verify() expects only the last 50 even though all 100 are in the db
          this.sourceData = this.sourceData.slice(50)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "start" and "reverse=true"': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ start: '50', reverse: true })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          // reverse and slice off the first 50 so verify() expects only the first 50 even though all 100 are in the db
          this.sourceData.reverse()
          this.sourceData = this.sourceData.slice(49)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "start" being mid-way key (float)': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          // '49.5' doesn't actually exist but we expect it to start at '50' because '49' < '49.5' < '50' (in string terms as well as numeric)
          var rs = db.readStream({ start: '49.5' })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          // slice off the first 50 so verify() expects only the last 50 even though all 100 are in the db
          this.sourceData = this.sourceData.slice(50)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "start" being mid-way key (float) and "reverse=true"': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          //NOTE: this is similar to the above case but we're going backwards, the important caveat with
          // reversable streams is that the start will always be the NEXT key if the actual key you specify
          // doesn't exist, not the PREVIOUS (i.e. it skips ahead to find a start key)
          var rs = db.readStream({ start: '49.5', reverse: true })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          // reverse & slice off the first 50 so verify() expects only the first 50 even though all 100 are in the db
          this.sourceData.reverse()
          this.sourceData = this.sourceData.slice(49)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "start" being mid-way key (string)': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          // '499999' doesn't actually exist but we expect it to start at '50' because '49' < '499999' < '50' (in string terms)
          // the same as the previous test but we're relying solely on string ordering
          var rs = db.readStream({ start: '499999' })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          // slice off the first 50 so verify() expects only the last 50 even though all 100 are in the db
          this.sourceData = this.sourceData.slice(50)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "end"': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ end: '50' })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          // slice off the last 49 so verify() expects only 0 -> 50 inclusive, even though all 100 are in the db
          this.sourceData = this.sourceData.slice(0, 51)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "end" being mid-way key (float)': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ end: '50.5' })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          // slice off the last 49 so verify() expects only 0 -> 50 inclusive, even though all 100 are in the db
          this.sourceData = this.sourceData.slice(0, 51)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "end" being mid-way key (string)': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ end: '50555555' })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          // slice off the last 49 so verify() expects only 0 -> 50 inclusive, even though all 100 are in the db
          this.sourceData = this.sourceData.slice(0, 51)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "end" being mid-way key (float) and "reverse=true"': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ end: '50.5', reverse: true })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          this.sourceData.reverse()
          this.sourceData = this.sourceData.slice(0, 49)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with both "start" and "end"': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ start: 30, end: 70 })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          // should include 30 to 70, inclusive
          this.sourceData = this.sourceData.slice(30, 71)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with both "start" and "end" and "reverse=true"': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ start: 70, end: 30, reverse: true })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          // expect 70 -> 30 inclusive
          this.sourceData.reverse()
          this.sourceData = this.sourceData.slice(29, 70)
        }.bind(this))
      }.bind(this))
    }

  , 'test json encoding': function (done) {
      var options = { createIfMissing: true, errorIfExists: true, keyEncoding: 'utf8', valueEncoding: 'json' }
        , data = [
              { type: 'put', key: 'aa', value: { a: 'complex', obj: 100 } }
            , { type: 'put', key: 'ab', value: { b: 'foo', bar: [ 1, 2, 3 ] } }
            , { type: 'put', key: 'ac', value: { c: 'w00t', d: { e: [ 0, 10, 20, 30 ], f: 1, g: 'wow' } } }
            , { type: 'put', key: 'ba', value: { a: 'complex', obj: 100 } }
            , { type: 'put', key: 'bb', value: { b: 'foo', bar: [ 1, 2, 3 ] } }
            , { type: 'put', key: 'bc', value: { c: 'w00t', d: { e: [ 0, 10, 20, 30 ], f: 1, g: 'wow' } } }
            , { type: 'put', key: 'ca', value: { a: 'complex', obj: 100 } }
            , { type: 'put', key: 'cb', value: { b: 'foo', bar: [ 1, 2, 3 ] } }
            , { type: 'put', key: 'cc', value: { c: 'w00t', d: { e: [ 0, 10, 20, 30 ], f: 1, g: 'wow' } } }
          ]

      this.openTestDatabase(options, function (db) {
        db.batch(data.slice(), function (err) {
          refute(err)

          var rs = db.readStream()
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done, data))
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() "reverse=true" not sticky (issue #6)': function (done) {
      this.openTestDatabase(function (db) {
        // execute
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)
          // read in reverse, assume all's good
          var rs = db.readStream({ reverse: true })
          rs.on('close', function () {
            // now try reading the other way
            var rs = db.readStream()
            assert.isFalse(rs.writable)
            assert.isTrue(rs.readable)
            rs.on('ready', this.readySpy)
            rs.on('data' , this.dataSpy)
            rs.on('end'  , this.endSpy)
            rs.on('close', this.verify.bind(this, rs, done))
          }.bind(this))
        }.bind(this))
      }.bind(this))
    }

  , 'test ReadStream, start=0': function (done) {
      this.openTestDatabase(function (db) {
        // execute
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ start: 0 })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))
        }.bind(this))
      }.bind(this))
    }

    // we don't expect any data to come out of here because the keys start at '00' not 0
    // we just want to ensure that we don't kill the process
  , 'test ReadStream, end=0': function (done) {
      this.openTestDatabase(function (db) {
        // execute
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ end: 0 })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          this.sourceData = [ ]
        }.bind(this))
      }.bind(this))
    }

    // ok, so here's the deal, this is kind of obscure: when you have 2 databases open and
    // have a readstream coming out from both of them with no references to the dbs left
    // V8 will GC one of them and you'll get an failed assert from leveldb.
    // This ISN'T a problem if you only have one of them open, even if the db gets GCed!
    // Process:
    //   * open
    //   * batch write data
    //   * close
    //   * reopen
    //   * create ReadStream, keeping no reference to the db
    //   * pipe ReadStream through SlowStream just to make sure GC happens
    //       - the error should occur here if the bug exists
    //   * when both streams finish, verify all 'data' events happened
  , 'test ReadStream without db ref doesn\'t get GCed': function (done) {
      var dataSpy1   = this.spy()
        , dataSpy2   = this.spy()
        , location1  = common.nextLocation()
        , location2  = common.nextLocation()
        , sourceData = this.sourceData
        , verify     = function () {
            // no reference to `db` here, should have been GCed by now if it could be
            assert(dataSpy1.callCount, sourceData.length)
            assert(dataSpy2.callCount, sourceData.length)
            async.parallel([ rimraf.bind(null, location1), rimraf.bind(null, location2) ], done)
          }
        , execute    = function (d, callback) {
            // no reference to `db` here, could be GCed
            d.readStream
              .pipe(new SlowStream({ maxWriteInterval: 5 }))
              .on('data', d.spy)
              .on('end', delayed.delayed(callback, 0.05))
          }
        , open       = function (reopen, location, callback) {
            levelup(location, { createIfMissing: !reopen, errorIfExists: !reopen }, callback)
          }
        , write      = function (db, callback) { db.batch(sourceData.slice(), callback) }
        , close      = function (db, callback) { db.close(callback) }
        , setup      = function (callback) {
            async.map([ location1, location2 ], open.bind(null, false), function (err, dbs) {
              refute(err)
              if (err) return
              async.map(dbs, write, function (err) {
                refute(err)
                if (err) return
                async.forEach(dbs, close, callback)
              })
            })
          }
        , reopen    = function () {
            async.map([ location1, location2 ], open.bind(null, true), function (err, dbs) {
              refute(err)
              if (err) return
              async.forEach([
                  { readStream: dbs[0].readStream(), spy: dataSpy1 }
                , { readStream: dbs[1].readStream(), spy: dataSpy2 }
              ], execute, verify)
            })
          }

      setup(delayed.delayed(reopen, 0.05))
    }


    // this is just a fancy way of testing levelup('/path').readStream()
    // i.e. not waiting for 'open' to complete
    // the logic for this is inside the ReadStream constructor which waits for 'ready'
  , 'test ReadStream on pre-opened db': function (done) {
      var execute = function (db) {
            // is in limbo
            refute(db.isOpen())
            refute(db.isClosed())

            var rs = db.readStream()
            assert.isFalse(rs.writable)
            assert.isTrue(rs.readable)
            rs.on('ready', this.readySpy)
            rs.on('data' , this.dataSpy)
            rs.on('end'  , this.endSpy)
            rs.on('close', this.verify.bind(this, rs, done))
          }.bind(this)
        , setup = function (db) {
            db.batch(this.sourceData.slice(), function (err) {
              refute(err)
              db.close(function (err) {
                refute(err)
                var db2 = levelup(db._location, { createIfMissing: false, errorIfExists: false, encoding: 'utf8' })
                execute(db2)
              })
            }.bind(this))
          }.bind(this)

      this.openTestDatabase(setup)
    }

  , 'test readStream() with "limit"': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ limit: 20 })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          this.sourceData = this.sourceData.slice(0, 20)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "start" and "limit"': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ start: '20', limit: 20 })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          this.sourceData = this.sourceData.slice(20, 40)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "end" after "limit"': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ end: '50', limit: 20 })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          this.sourceData = this.sourceData.slice(0, 20)
        }.bind(this))
      }.bind(this))
    }

  , 'test readStream() with "end" before "limit"': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream({ end: '30', limit: 50 })
          assert.isFalse(rs.writable)
          assert.isTrue(rs.readable)
          rs.on('ready', this.readySpy)
          rs.on('data' , this.dataSpy)
          rs.on('end'  , this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          this.sourceData = this.sourceData.slice(0, 31)
        }.bind(this))
      }.bind(this))
    }
})