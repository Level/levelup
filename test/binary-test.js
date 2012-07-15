/*global cleanUp:true, openTestDatabase:true, loadBinaryTestData:true, binaryTestDataMD5Sum:true, checkBinaryTestData:true*/

var buster  = require('buster')
  , assert  = buster.assert
  , levelup = require('../lib/levelup.js')
  , errors  = require('../lib/errors.js')
  , rimraf  = require('rimraf')
  , async   = require('async')
  , fs      = require('fs')

require('./common.js')

buster.testCase('Binary API', {
    'setUp': function (done) {
      this.cleanupDirs = []
      this.closeableDatabases = []
      this.openTestDatabase = openTestDatabase.bind(this)
      loadBinaryTestData(function (err, data) {
        refute(err)
        this.testData = data
        done()
      }.bind(this))
    }

  , 'tearDown': function (done) {
      cleanUp(this.closeableDatabases, this.cleanupDirs, done)
    }

  , 'sanity check on test data': function (done) {
      assert(Buffer.isBuffer(this.testData))
      checkBinaryTestData(this.testData, done)
    }

  , 'test put() and get() with binary value {encoding:binary}': function (done) {
      this.openTestDatabase(function (db) {
        db.put('binarydata', this.testData, {encoding:'binary'}, function (err) {
          refute(err)
          db.get('binarydata', {encoding:'binary'}, function (err, value) {
            refute(err)
            assert(value)
            checkBinaryTestData(value, done)
          })
        })
      }.bind(this))
    }

  , 'test put() and get() with binary key {encoding:binary}': function (done) {
      this.openTestDatabase(function (db) {
        db.put(this.testData, 'binarydata', {encoding:'binary'}, function (err) {
          refute(err)
          db.get(this.testData, {encoding:'binary'}, function (err, value) {
            refute(err)
            assert.equals(value, 'binarydata')
            done()
          }.bind(this))
        }.bind(this))
      }.bind(this))
    }

  , 'test put() and get() with binary value {keyEncoding:utf8,valueEncoding:binary}': function (done) {
      this.openTestDatabase(function (db) {
        db.put('binarydata', this.testData, {encoding:'binary'}, function (err) {
          refute(err)
          db.get('binarydata', {encoding:'binary'}, function (err, value) {
            refute(err)
            assert(value)
            checkBinaryTestData(value, done)
          })
        })
      }.bind(this))
    }

  , 'test put() and get() with binary key {keyEncoding:binary,valueEncoding:urf8}': function (done) {
      this.openTestDatabase(function (db) {
        db.put(this.testData, 'binarydata', {encoding:'binary'}, function (err) {
          refute(err)
          db.get(this.testData, {encoding:'binary'}, function (err, value) {
            refute(err)
            assert.equals(value, 'binarydata')
            done()
          }.bind(this))
        }.bind(this))
      }.bind(this))
    }

  , 'test put() and get() with binary key & value {encoding:binary}': function (done) {
      this.openTestDatabase(function (db) {
        db.put(this.testData, this.testData, {encoding:'binary'}, function (err) {
          refute(err)
          db.get(this.testData, {encoding:'binary'}, function (err, value) {
            refute(err)
            checkBinaryTestData(value, done)
          }.bind(this))
        }.bind(this))
      }.bind(this))
    }


  , 'test put() and del() and get() with binary key {encoding:binary}': function (done) {
      this.openTestDatabase(function (db) {
        db.put(this.testData, 'binarydata', {encoding:'binary'}, function (err) {
          refute(err)
          db.del(this.testData, {encoding:'binary'}, function (err) {
            db.get(this.testData, {encoding:'binary'}, function (err, value) {
              assert(err)
              done()
            }.bind(this))
          }.bind(this))
        }.bind(this))
      }.bind(this))
    }

  , 'batch() with multiple puts': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(
            [
                { type: 'put', key: 'foo', value: this.testData }
              , { type: 'put', key: 'bar', value: this.testData }
              , { type: 'put', key: 'baz', value: 'abazvalue' }
            ]
          , {keyEncoding:'utf8',valueEncoding:'binary'}
          , function (err) {
              refute(err)
              async.forEach(
                  ['foo', 'bar', 'baz']
                , function (key, callback) {
                    db.get(key, {encoding:'binary'}, function (err, value) {
                      refute(err)
                      if (key == 'baz') {
                        assert.equals(value, 'a' + key + 'value')
                        callback()
                      } else {
                        checkBinaryTestData(value, callback)
                      }
                    })
                  }
                , done
              )
            }.bind(this)
        )
      }.bind(this))
    }


})