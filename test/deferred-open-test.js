var levelup = require('../lib/levelup.js')
var memdown = require('memdown')
var encDown = require('encoding-down')
var async = require('async')
var concat = require('concat-stream')
var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('Deferred open()', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'put() and get() on pre-opened database': function (done) {
    // 1) open database without callback, opens in next tick
    var db = levelup(encDown(memdown()))

    this.closeableDatabases.push(db)
    assert.isObject(db)

    async.parallel([
      // 2) insert 3 values with put(), these should be deferred until the database is actually open
      db.put.bind(db, 'k1', 'v1'),
      db.put.bind(db, 'k2', 'v2'),
      db.put.bind(db, 'k3', 'v3')
    ], function () {
      // 3) when the callbacks have returned, the database should be open and those values should be in
      //    verify that the values are there
      async.forEach([1, 2, 3], function (k, cb) {
        db.get('k' + k, function (err, v) {
          refute(err)
          assert.equals(v, 'v' + k)
          cb()
        })
      }, function () {
        db.get('k4', function (err) {
          assert(err)
          // DONE
          done()
        })
      })
    })

    // we should still be in a state of limbo down here, not opened or closed, but 'new'
    refute(db.isOpen())
    refute(db.isClosed())
  },

  'batch() on pre-opened database': function (done) {
    // 1) open database without callback, opens in next tick
    var db = levelup(encDown(memdown()))

    this.closeableDatabases.push(db)
    assert.isObject(db)

    // 2) insert 3 values with batch(), these should be deferred until the database is actually open
    db.batch([
      { type: 'put', key: 'k1', value: 'v1' },
      { type: 'put', key: 'k2', value: 'v2' },
      { type: 'put', key: 'k3', value: 'v3' }
    ], function () {
      // 3) when the callbacks have returned, the database should be open and those values should be in
      //    verify that the values are there
      async.forEach([1, 2, 3], function (k, cb) {
        db.get('k' + k, function (err, v) {
          refute(err)
          assert.equals(v, 'v' + k)
          cb()
        })
      }, function () {
        db.get('k4', function (err) {
          assert(err)
          // DONE
          done()
        })
      })
    })

    // we should still be in a state of limbo down here, not opened or closed, but 'new'
    refute(db.isOpen())
    refute(db.isClosed())
  },

  'chained batch() on pre-opened database': function (done) {
    // 1) open database without callback, opens in next tick
    var db = levelup(encDown(memdown()))

    this.closeableDatabases.push(db)
    assert.isObject(db)

    // 2) insert 3 values with batch(), these should be deferred until the database is actually open
    db.batch()
      .put('k1', 'v1')
      .put('k2', 'v2')
      .put('k3', 'v3')
      .write(function () {
      // 3) when the callbacks have returned, the database should be open and those values should be in
      //    verify that the values are there
        async.forEach([1, 2, 3], function (k, cb) {
          db.get('k' + k, function (err, v) {
            refute(err)
            assert.equals(v, 'v' + k)
            cb()
          })
        }, function () {
          db.get('k4', function (err) {
            assert(err)
            // DONE
            done()
          })
        })
      })

    // we should still be in a state of limbo down here, not opened or closed, but 'new'
    refute(db.isOpen())
    refute(db.isClosed())
  },

  'test deferred ReadStream': {
    'setUp': common.readStreamSetUp,

    'simple ReadStream': function (done) {
      var db = levelup(encDown(memdown()))
      db.batch(this.sourceData.slice(), function (err) {
        refute(err)
        db.close(function (err) {
          refute(err, 'no error')
          var async = true

          db.open(function (err) {
            async = false
            refute(err, 'no open error')
          })

          this.closeableDatabases.push(db)
          var rs = db.createReadStream()
          rs.on('data', this.dataSpy)
          rs.on('end', this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))

          // db should open lazily
          assert(async)
        }.bind(this))
      }.bind(this))
    }
  },

  'maxListeners warning': function (done) {
    // 1) open database without callback, opens in next tick
    var db = levelup(encDown(memdown()))
    var stderrMock = this.mock(console)

    this.closeableDatabases.push(db)
    stderrMock.expects('error').never()

    // 2) provoke an EventEmitter maxListeners warning
    var toPut = 11

    for (var i = 0; i < toPut; i++) {
      db.put('some', 'string', function (err) {
        refute(err)
        if (!--toPut) {
          done()
        }
      })
    }
  },

  'value of queued operation is not serialized': function (done) {
    var db = levelup(encDown(memdown(), { valueEncoding: 'json' }))

    this.closeableDatabases.push(db)

    // deferred-leveldown < 2.0.2 would serialize the object to a string.
    db.put('key', { thing: 2 }, function (err) {
      refute(err)

      db.get('key', function (err, value) {
        refute(err)
        assert.equals(value, { thing: 2 })
        done()
      })
    })
  },

  'key of queued operation is not serialized': function (done) {
    var db = levelup(encDown(memdown(), { keyEncoding: 'json' }))

    this.closeableDatabases.push(db)

    // deferred-leveldown < 2.0.2 would serialize the key to a string.
    db.put({ thing: 2 }, 'value', function (err) {
      refute(err)

      db.createKeyStream().pipe(concat(function (result) {
        assert.equals(result, [{ thing: 2 }])
        done()
      }))
    })
  }
})
