/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var ba      = require('buster').assertions
  , async   = require('async')
  , rimraf  = require('rimraf')
  , fs      = require('fs')
  , path    = require('path')
  , levelup = require('../lib/levelup.js')
  , child_process = require('child_process')
  , dbidx   = 0

ba.add('isInstanceOf', {
    assert: function (actual, expected) {
        return actual instanceof expected
    }
  , refute: function (actual, expected) {
        return !(actual instanceof expected)
    }
  , assertMessage: '${0} expected to be instance of ${1}'
  , refuteMessage: '${0} expected not to be instance of ${1}'
})

ba.add('isUndefined', {
    assert: function (actual) {
        return actual === undefined
    }
  , refute: function (actual) {
        return actual !== undefined
    }
  , assertMessage: '${0} expected to be undefined'
  , refuteMessage: '${0} expected not to be undefined'
})

global.openTestDatabase = function () {
  var options = typeof arguments[0] == 'object' ? arguments[0] : { createIfMissing: true, errorIfExists: true }
    , callback = typeof arguments[0] == 'function' ? arguments[0] : arguments[1]
    , location = typeof arguments[0] == 'string' ? arguments[0] : path.join(__dirname, 'levelup_test_db_' + dbidx++)
  rimraf(location, function (err) {
    refute(err)
    this.cleanupDirs.push(location)
    levelup(location, options, function (err, db) {
      refute(err)
      this.closeableDatabases.push(db)
      callback(db)
    }.bind(this))
  }.bind(this))
}

global.commonTearDown = function (done) {
  async.forEach(
      this.closeableDatabases
    , function (db, callback) {
        db.close(callback)
      }
    , function () {
        async.forEach(this.cleanupDirs, rimraf, done)
      }.bind(this)
  )
}

global.loadBinaryTestData = function (callback) {
  fs.readFile(path.join(__dirname, 'testdata.bin'), callback)
}

global.binaryTestDataMD5Sum = '920725ef1a3b32af40ccd0b78f4a62fd'

global.checkBinaryTestData = function (testData, callback) {
  var fname = '__tst.dat.' + Math.random()
  fs.writeFile(fname, testData, function (err) {
    refute(err)
    child_process.exec('which md5sum', function (err, stdout) {
      child_process.exec((stdout !== '' ? 'md5sum ' : 'md5 -r ') + fname, function (err, stdout, stderr) {
        refute(err)
        refute(stderr)
        var md5Sum = stdout.split(' ')[0]
        assert.equals(md5Sum, global.binaryTestDataMD5Sum)
        fs.unlink(fname, callback)
      })
    })
  })
}

global.commonSetUp = function () {
  this.cleanupDirs = []
  this.closeableDatabases = []
  this.openTestDatabase = global.openTestDatabase.bind(this)
  this.timeout = 1000
}