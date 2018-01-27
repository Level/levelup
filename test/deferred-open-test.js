/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

const LevelUp = require('../lib/levelup.js')
const leveldown = require('leveldown')
const encDown = require('encoding-down')
const async = require('async')
const concat = require('concat-stream')
const common = require('./common')
const { assert, refute } = require('referee')
const buster = require('bustermove')

buster.testCase('Deferred open()', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'put() and get() on pre-opened database': function (done) {
    var location = common.nextLocation()
    // 1) open database without callback, opens in worker thread
    var db = new LevelUp(encDown(leveldown(location)))

    this.closeableDatabases.push(db)
    this.cleanupDirs.push(location)
    assert.isObject(db)

    async.parallel([
      // 2) insert 3 values with put(), these should be deferred until the database is actually open
      db.put.bind(db, 'k1', 'v1'),
      db.put.bind(db, 'k2', 'v2'),
      db.put.bind(db, 'k3', 'v3')
    ], () => {
      // 3) when the callbacks have returned, the database should be open and those values should be in
      //    verify that the values are there
      async.forEach([1, 2, 3], (k, cb) => {
        db.get('k' + k, (err, v) => {
          refute(err)
          assert.equals(v, 'v' + k)
          cb()
        })
      }, () => {
        db.get('k4', (err) => {
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
    var location = common.nextLocation()
    // 1) open database without callback, opens in worker thread
    var db = new LevelUp(encDown(leveldown(location)))

    this.closeableDatabases.push(db)
    this.cleanupDirs.push(location)
    assert.isObject(db)

    // 2) insert 3 values with batch(), these should be deferred until the database is actually open
    db.batch([
      { type: 'put', key: 'k1', value: 'v1' },
      { type: 'put', key: 'k2', value: 'v2' },
      { type: 'put', key: 'k3', value: 'v3' }
    ], () => {
      // 3) when the callbacks have returned, the database should be open and those values should be in
      //    verify that the values are there
      async.forEach([1, 2, 3], (k, cb) => {
        db.get('k' + k, (err, v) => {
          refute(err)
          assert.equals(v, 'v' + k)
          cb()
        })
      }, () => {
        db.get('k4', err => {
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
    var location = common.nextLocation()
    // 1) open database without callback, opens in worker thread
    var db = new LevelUp(encDown(leveldown(location)))

    this.closeableDatabases.push(db)
    this.cleanupDirs.push(location)
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
      var location = common.nextLocation()
      var db = new LevelUp(encDown(leveldown(location)))
      db.batch(this.sourceData.slice(), err => {
        refute(err)
        db.close(err => {
          refute(err, 'no error')
          var db = new LevelUp(encDown(leveldown(location)))
          this.closeableDatabases.push(db)
          var rs = db.createReadStream()
          rs.on('data', this.dataSpy)
          rs.on('end', this.endSpy)
          rs.on('close', this.verify.bind(this, rs, done))
        })
      })
    }
  },

  'maxListeners warning': function (done) {
    var location = common.nextLocation()
    // 1) open database without callback, opens in worker thread
    var db = new LevelUp(encDown(leveldown(location)))
    var stderrMock = this.mock(console)

    this.closeableDatabases.push(db)
    this.cleanupDirs.push(location)
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
    var location = common.nextLocation()
    var db = new LevelUp(encDown(leveldown(location), { valueEncoding: 'json' }))

    this.closeableDatabases.push(db)
    this.cleanupDirs.push(location)

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
    var location = common.nextLocation()
    var db = new LevelUp(encDown(leveldown(location), { keyEncoding: 'json' }))

    this.closeableDatabases.push(db)
    this.cleanupDirs.push(location)

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
