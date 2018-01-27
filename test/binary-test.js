/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

const async = require('async')
const common = require('./common')
const { assert, refute } = require('referee')
const buster = require('bustermove')

buster.testCase('Binary API', {
  'setUp': function (done) {
    common.commonSetUp.call(this, () => {
      common.loadBinaryTestData((err, data) => {
        refute(err)
        this.testData = data
        done()
      })
    })
  },

  'tearDown': common.commonTearDown,

  'sanity check on test data': function (done) {
    assert(Buffer.isBuffer(this.testData))
    common.checkBinaryTestData(this.testData, done)
  },

  'test put() and get() with binary value {valueEncoding:binary}': function (done) {
    this.openTestDatabase(db => {
      db.put('binarydata', this.testData, { valueEncoding: 'binary' }, err => {
        refute(err)
        db.get('binarydata', { valueEncoding: 'binary' }, (err, value) => {
          refute(err)
          assert(value)
          common.checkBinaryTestData(value, done)
        })
      })
    })
  },

  'test put() and get() with binary value {valueEncoding:binary} on createDatabase()': function (done) {
    this.openTestDatabase({ valueEncoding: 'binary' }, db => {
      db.put('binarydata', this.testData, err => {
        refute(err)
        db.get('binarydata', (err, value) => {
          refute(err)
          assert(value)
          common.checkBinaryTestData(value, done)
        })
      })
    })
  },

  'test put() and get() with binary key {valueEncoding:binary}': function (done) {
    this.openTestDatabase(db => {
      db.put(this.testData, 'binarydata', { valueEncoding: 'binary' }, err => {
        refute(err)
        db.get(this.testData, { valueEncoding: 'binary' }, (err, value) => {
          refute(err)
          assert(value instanceof Buffer, 'value is buffer')
          assert.equals(value.toString(), 'binarydata')
          done()
        })
      })
    })
  },

  'test put() and get() with binary value {keyEncoding:utf8,valueEncoding:binary}': function (done) {
    this.openTestDatabase(db => {
      db.put('binarydata', this.testData, { keyEncoding: 'utf8', valueEncoding: 'binary' }, err => {
        refute(err)
        db.get('binarydata', { keyEncoding: 'utf8', valueEncoding: 'binary' }, (err, value) => {
          refute(err)
          assert(value)
          common.checkBinaryTestData(value, done)
        })
      })
    })
  },

  'test put() and get() with binary value {keyEncoding:utf8,valueEncoding:binary} on createDatabase()': function (done) {
    this.openTestDatabase({ keyEncoding: 'utf8', valueEncoding: 'binary' }, db => {
      db.put('binarydata', this.testData, err => {
        refute(err)
        db.get('binarydata', (err, value) => {
          refute(err)
          assert(value)
          common.checkBinaryTestData(value, done)
        })
      })
    })
  },

  'test put() and get() with binary key {keyEncoding:binary,valueEncoding:utf8}': function (done) {
    this.openTestDatabase(db => {
      db.put(this.testData, 'binarydata', { keyEncoding: 'binary', valueEncoding: 'utf8' }, err => {
        refute(err)
        db.get(this.testData, { keyEncoding: 'binary', valueEncoding: 'utf8' }, (err, value) => {
          refute(err)
          assert.equals(value, 'binarydata')
          done()
        })
      })
    })
  },

  'test put() and get() with binary key & value {valueEncoding:binary}': function (done) {
    this.openTestDatabase(db => {
      db.put(this.testData, this.testData, { valueEncoding: 'binary' }, err => {
        refute(err)
        db.get(this.testData, { valueEncoding: 'binary' }, (err, value) => {
          refute(err)
          common.checkBinaryTestData(value, done)
        })
      })
    })
  },

  'test put() and del() and get() with binary key {valueEncoding:binary}': function (done) {
    this.openTestDatabase(db => {
      db.put(this.testData, 'binarydata', { valueEncoding: 'binary' }, err => {
        refute(err)
        db.del(this.testData, { valueEncoding: 'binary' }, err => {
          refute(err)
          db.get(this.testData, { valueEncoding: 'binary' }, (err, value) => {
            assert(err)
            refute(value)
            done()
          })
        })
      })
    })
  },

  'batch() with multiple puts': function (done) {
    this.openTestDatabase(db => {
      db.batch([
        { type: 'put', key: 'foo', value: this.testData },
        { type: 'put', key: 'bar', value: this.testData },
        { type: 'put', key: 'baz', value: 'abazvalue' }
      ], { keyEncoding: 'utf8', valueEncoding: 'binary' }, err => {
        refute(err)
        async.forEach(['foo', 'bar', 'baz'], (key, callback) => {
          db.get(key, { valueEncoding: 'binary' }, (err, value) => {
            refute(err)
            if (key === 'baz') {
              assert(value instanceof Buffer, 'value is buffer')
              assert.equals(value.toString(), 'a' + key + 'value')
              callback()
            } else {
              common.checkBinaryTestData(value, callback)
            }
          })
        }, done)
      })
    })
  }
})
