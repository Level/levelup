/* Copyright (c) 2012-2018 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var async = require('async')
var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('Binary API', {
  'setUp': function (done) {
    common.commonSetUp.call(this, function () {
      this.testData = loadData()
      done()
    }.bind(this))
  },

  'tearDown': common.commonTearDown,

  'sanity check on test data': function (done) {
    assert(Buffer.isBuffer(this.testData))
    checkData(this.testData)
    done()
  },

  'test put() and get() with binary value {valueEncoding:binary}': function (done) {
    this.openTestDatabase(function (db) {
      db.put('binarydata', this.testData, { valueEncoding: 'binary' }, function (err) {
        refute(err)
        db.get('binarydata', { valueEncoding: 'binary' }, function (err, value) {
          refute(err)
          assert(value)
          checkData(value)
          done()
        })
      })
    }.bind(this))
  },

  'test put() and get() with binary value {valueEncoding:binary} on createDatabase()': function (done) {
    this.openTestDatabase({ valueEncoding: 'binary' }, function (db) {
      db.put('binarydata', this.testData, function (err) {
        refute(err)
        db.get('binarydata', function (err, value) {
          refute(err)
          assert(value)
          checkData(value)
          done()
        })
      })
    }.bind(this))
  },

  'test put() and get() with binary key {valueEncoding:binary}': function (done) {
    this.openTestDatabase(function (db) {
      db.put(this.testData, 'binarydata', { valueEncoding: 'binary' }, function (err) {
        refute(err)
        db.get(this.testData, { valueEncoding: 'binary' }, function (err, value) {
          refute(err)
          assert(value instanceof Buffer, 'value is buffer')
          assert.equals(value.toString(), 'binarydata')
          done()
        })
      }.bind(this))
    }.bind(this))
  },

  'test put() and get() with binary value {keyEncoding:utf8,valueEncoding:binary}': function (done) {
    this.openTestDatabase(function (db) {
      db.put('binarydata', this.testData, { keyEncoding: 'utf8', valueEncoding: 'binary' }, function (err) {
        refute(err)
        db.get('binarydata', { keyEncoding: 'utf8', valueEncoding: 'binary' }, function (err, value) {
          refute(err)
          assert(value)
          checkData(value)
          done()
        })
      })
    }.bind(this))
  },

  'test put() and get() with binary value {keyEncoding:utf8,valueEncoding:binary} on createDatabase()': function (done) {
    this.openTestDatabase({ keyEncoding: 'utf8', valueEncoding: 'binary' }, function (db) {
      db.put('binarydata', this.testData, function (err) {
        refute(err)
        db.get('binarydata', function (err, value) {
          refute(err)
          assert(value)
          checkData(value)
          done()
        })
      })
    }.bind(this))
  },

  'test put() and get() with binary key {keyEncoding:binary,valueEncoding:utf8}': function (done) {
    this.openTestDatabase(function (db) {
      db.put(this.testData, 'binarydata', { keyEncoding: 'binary', valueEncoding: 'utf8' }, function (err) {
        refute(err)
        db.get(this.testData, { keyEncoding: 'binary', valueEncoding: 'utf8' }, function (err, value) {
          refute(err)
          assert.equals(value, 'binarydata')
          done()
        })
      }.bind(this))
    }.bind(this))
  },

  'test put() and get() with binary key & value {valueEncoding:binary}': function (done) {
    this.openTestDatabase(function (db) {
      db.put(this.testData, this.testData, { valueEncoding: 'binary' }, function (err) {
        refute(err)
        db.get(this.testData, { valueEncoding: 'binary' }, function (err, value) {
          refute(err)
          checkData(value)
          done()
        })
      }.bind(this))
    }.bind(this))
  },

  'test put() and del() and get() with binary key {valueEncoding:binary}': function (done) {
    this.openTestDatabase(function (db) {
      db.put(this.testData, 'binarydata', { valueEncoding: 'binary' }, function (err) {
        refute(err)
        db.del(this.testData, { valueEncoding: 'binary' }, function (err) {
          refute(err)
          db.get(this.testData, { valueEncoding: 'binary' }, function (err, value) {
            assert(err)
            refute(value)
            done()
          })
        }.bind(this))
      }.bind(this))
    }.bind(this))
  },

  'batch() with multiple puts': function (done) {
    this.openTestDatabase(function (db) {
      db.batch([
        { type: 'put', key: 'foo', value: this.testData },
        { type: 'put', key: 'bar', value: this.testData },
        { type: 'put', key: 'baz', value: 'abazvalue' }
      ], { keyEncoding: 'utf8', valueEncoding: 'binary' }, function (err) {
        refute(err)
        async.forEach(['foo', 'bar', 'baz'], function (key, callback) {
          db.get(key, { valueEncoding: 'binary' }, function (err, value) {
            refute(err)
            if (key === 'baz') {
              assert(value instanceof Buffer, 'value is buffer')
              assert.equals(value.toString(), 'a' + key + 'value')
              callback()
            } else {
              checkData(value)
              callback()
            }
          })
        }, done)
      })
    }.bind(this))
  }
})

function loadData () {
  return Buffer.from('0080c0ff', 'hex')
}

function checkData (buf) {
  assert.equals(buf.equals(loadData()), true)
}
