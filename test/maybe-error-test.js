/* Copyright (c) 2012-2018 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */
'use strict'

var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('maybeError() should be called async', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'put()': function (done) {
    this.openTestDatabase(function (db) {
      db.close(function () {
        assert.isTrue(db.isClosed(), 'db is closed')
        let sync = false
        db.put('key', 'value', {}, function (err) {
          sync = true
          assert(err)
          assert.equals(err.message, 'Database is not open')
        })
        assert.isFalse(sync, '.put cb called synchronously')
        done()
      })
    })
  },

  'get()': function (done) {
    this.openTestDatabase(function (db) {
      db.put('key', 'value', {}, function (err) {
        refute(err)
        db.close(function () {
          assert.isTrue(db.isClosed(), 'db is closed')
          let sync = false
          db.get('key', {}, function (err, value) {
            sync = true
            assert(err)
            assert.equals(err.message, 'Database is not open')
          })
          assert.isFalse(sync, '.get cb called synchronously')
          done()
        })
      })
    })
  },

  'del()': function (done) {
    this.openTestDatabase(function (db) {
      db.put('key', 'value', {}, function (err) {
        refute(err)
        db.close(function () {
          assert.isTrue(db.isClosed(), 'db is closed')
          let sync = false
          db.del('key', {}, function (err) {
            sync = true
            assert(err)
            assert.equals(err.message, 'Database is not open')
          })
          assert.isFalse(sync, '.del cb called synchronously')
          done()
        })
      })
    })
  },

  'batch()': function (done) {
    this.openTestDatabase(function (db) {
      db.close(function () {
        assert.isTrue(db.isClosed(), 'db is closed')
        let sync = false
        db.batch([{ type: 'put', key: 'key' }], {}, function (err) {
          sync = true
          assert(err)
          assert.equals(err.message, 'Database is not open')
        })
        assert.isFalse(sync, '.batch cb called synchronously')
        done()
      })
    })
  }
})
