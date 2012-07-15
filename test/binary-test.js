/*global cleanUp:true, openTestDatabase:true, loadBinaryTestData:true, binaryTestDataMD5Sum:true, checkBinaryTestData:true*/

var buster  = require('buster')
  , assert  = buster.assert
  , levelup = require('../lib/levelup.js')
  , errors  = require('../lib/errors.js')
  , rimraf  = require('rimraf')
  , async   = require('async')
  , fs      = require('fs')

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
})