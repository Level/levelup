/*global cleanUp:true, openTestDatabase:true*/

var buster  = require('buster')
  , assert  = buster.assert
  , levelup = require('../lib/levelup.js')
  , errors  = require('../lib/errors.js')
  , rimraf  = require('rimraf')
  , async   = require('async')
  , fs      = require('fs')

buster.testCase('WriteStream', {
    'setUp': function () {
      this.cleanupDirs = []
      this.closeableDatabases = []
      this.openTestDatabase = openTestDatabase.bind(this)
      this.timeout = 1000

      this.sourceData = []

      for (var i = 0; i < 10; i++) {
        this.sourceData.push({
            type  : 'put'
          , key   : i
          , value : Math.random()
        })
      }

      this.verify = function (db, done) {
        async.forEach(
            this.sourceData
          , function (data, callback) {
              db.get(data.key, function (err, value) {
                refute(err)
                assert.equals(value, data.value, 'WriteStream data #' + data.key + ' has correct value')
                callback()
              })
            }
          , done
        )
      }
    }

  , 'tearDown': function (done) {
      cleanUp(this.closeableDatabases, this.cleanupDirs, done)
    }

  //TODO: test various encodings

  , 'test simple WriteStream': function (done) {
      this.openTestDatabase(function (db) {
        var ws = db.writeStream()
        ws.on('error', function (err) {
          refute(err)
        })
        ws.on('close', this.verify.bind(this, db, done))
        this.sourceData.forEach(function (d) {
          ws.write(d)
        })
        ws.once('ready', ws.end) // end after it's ready, nextTick makes this work OK
      }.bind(this))
    }

  , 'test WriteStream with async writes': function (done) {
      this.openTestDatabase(function (db) {
        var ws = db.writeStream()

        ws.on('error', function (err) {
          refute(err)
        })
        ws.on('close', this.verify.bind(this, db, done))
        async.forEachSeries(
            this.sourceData
          , function (d, callback) {
              // some should batch() and some should put()
              if (d.key % 3) {
                setTimeout(function () {
                  ws.write(d)
                  callback()
                }, 10)
              } else {
                ws.write(d)
                callback()
              }
            }
          , function () {
              ws.end()
            }
        )
      }.bind(this))
    }

  , 'test delayed open with maxBufferLength': function (done) {
      var db = levelup.createDatabase(
              this.cleanupDirs[0] = '/tmp/levelup_test_db'
            , { createIfMissing: true, errorIfExists: false }
          )
        , ws = db.writeStream({ maxBufferLength: 1 })

      this.closeableDatabases.push(db)
      // should be able to push first element in just fine
      assert.isTrue(ws.write(this.sourceData[0]))
      // second element should warn that the buffer isn't being cleared
      assert.isFalse(ws.write(this.sourceData[1]))

      ws.once('close', this.verify.bind(this, db, done))
      ws.once('drain', function () {
        this.sourceData.slice(2).forEach(function (d, i) {
          assert[i != 0 ? 'isFalse' : 'isTrue'](ws.write(d), 'correct return value for element #' + i)
        })
        ws.end()
      }.bind(this))

      db.open(function (err) {
        // should lead to a 'drain' event
        refute(err)
      })
    }
})