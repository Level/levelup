/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var buster  = require('buster')
  , assert  = buster.assert
  , common  = require('./common')

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

      this.verify = function (rs, done) {
        assert.isFalse(rs.writable)
        assert.isFalse(rs.readable)
        assert.equals(this.readySpy.callCount, 1, 'ReadStream emitted single "ready" event')
        assert.equals(this.endSpy.callCount, 1, 'ReadStream emitted single "end" event')
        assert.equals(this.dataSpy.callCount, this.sourceData.length, 'ReadStream emitted correct number of "data" events')
        this.sourceData.forEach(function (d, i) {
          var call = this.dataSpy.getCall(i)
          if (call) {
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

          // slice off the last 50 so verify() expects only the first 50 even though all 100 are in the db
          this.sourceData = this.sourceData.slice(0, 50)
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

          this.sourceData = this.sourceData.slice(30, 70)
        }.bind(this))
      }.bind(this))
    }
})