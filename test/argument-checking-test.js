/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var common = require('./common')
var assert = require('referee').assert
var buster = require('bustermove')

buster.testCase('Argument checking', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'test get() throwables': function (done) {
    this.openTestDatabase(function (db) {
      assert.exception(
        db.get.bind(db),
        { name: 'ReadError', message: 'get() requires a key argument' },
        'no-arg get() throws'
      )
      done()
    })
  },

  'test put() throwables': function (done) {
    this.openTestDatabase(function (db) {
      assert.exception(
        db.put.bind(db),
        { name: 'WriteError', message: 'put() requires a key argument' },
        'no-arg put() throws'
      )

      done()
    })
  },

  'test del() throwables': function (done) {
    this.openTestDatabase(function (db) {
      assert.exception(
        db.del.bind(db),
        { name: 'WriteError', message: 'del() requires a key argument' },
        'no-arg del() throws'
      )

      done()
    })
  },

  'test batch() throwables': function (done) {
    this.openTestDatabase(function (db) {
      assert.exception(
        db.batch.bind(db, null, {}),
        { name: 'WriteError', message: 'batch() requires an array argument' },
        'no-arg batch() throws'
      )

      assert.exception(
        db.batch.bind(db, {}),
        { name: 'WriteError', message: 'batch() requires an array argument' },
        '1-arg, no Array batch() throws'
      )

      done()
    })
  }
})
