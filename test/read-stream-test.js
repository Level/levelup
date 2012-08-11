/*global cleanUp:true, openTestDatabase:true*/

var buster  = require('buster')
  , assert  = buster.assert
  , levelup = require('../lib/levelup.js')
  , errors  = require('../lib/errors.js')
  , rimraf  = require('rimraf')
  , async   = require('async')
  , fs      = require('fs')

buster.testCase('ReadStream', {
    'setUp': function () {
      this.cleanupDirs = []
      this.closeableDatabases = []
      this.openTestDatabase = openTestDatabase.bind(this)

      this.readySpy   = this.spy()
      this.dataSpy    = this.spy()
      this.sourceData = []

      for (var i = 0; i < 10; i++) {
        this.sourceData.push({
            type  : 'put'
          , key   : i
          , value : Math.random()
        })
      }

      this.verify = function (done) {
        assert.equals(this.readySpy.callCount, 1, 'ReadStream emitted single "ready" event')
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

  , 'tearDown': function (done) {
      cleanUp(this.closeableDatabases, this.cleanupDirs, done)
    }

  //TODO: test various encodings

  , 'test simple ReadStream': function (done) {
      this.openTestDatabase(function (db) {
        // execute
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)

          var rs = db.readStream()
          rs.on('ready' , this.readySpy)
          rs.on('data'  , this.dataSpy)
          rs.on('end'   , this.verify.bind(this, done))
        }.bind(this))
      }.bind(this))
    }

  , 'test delayed open': function (done) {
      var execute = function () {
        var db = levelup.createDatabase(
                this.cleanupDirs[0] = '/tmp/levelup_test_db'
              , { createIfMissing: true, errorIfExists: false }
            )
        this.closeableDatabases.push(db)
        db.open(function (err) {
          refute(err)

          var rs = db.readStream()
          rs.on('ready' , this.readySpy)
          rs.on('data'  , this.dataSpy)
          rs.on('end'   , this.verify.bind(this, done))
        }.bind(this))
      }.bind(this)

      // setup -- open db, write stuff to it, close it again so we can reopen it
      this.openTestDatabase(function (db) {
        db.batch(this.sourceData.slice(), function (err) {
          refute(err)
          db.close(function () {
            setTimeout(function () {
              execute()
            }, 10)
          })
        })
      }.bind(this))
    }
})