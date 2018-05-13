/* Copyright (c) 2012-2018 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var levelup = require('../lib/levelup.js')
var memdown = require('memdown')
var errors = levelup.errors
var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('null & undefined keys & values', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'null and undefined': {
    'setUp': function (done) {
      levelup(memdown(), function (err, db) {
        refute(err) // sanity
        this.closeableDatabases.push(db)
        assert.isTrue(db.isOpen())
        this.db = db
        done()
      }.bind(this))
    },

    'get() with null key causes error': function (done) {
      assert.exception(
        this.db.get.bind(this.db, null),
        { name: 'ReadError', message: 'get() requires a key argument' }
      )
      done()
    },

    'get() with undefined key causes error': function (done) {
      assert.exception(
        this.db.get.bind(this.db, undefined),
        { name: 'ReadError', message: 'get() requires a key argument' }
      )
      done()
    },

    'del() with null key causes error': function (done) {
      assert.exception(
        this.db.del.bind(this.db, null),
        { name: 'WriteError', message: 'del() requires a key argument' }
      )
      done()
    },

    'del() with undefined key causes error': function (done) {
      assert.exception(
        this.db.del.bind(this.db, undefined),
        { name: 'WriteError', message: 'del() requires a key argument' }
      )
      done()
    },

    'put() with null key causes error': function (done) {
      assert.exception(
        this.db.put.bind(this.db, null, 'foo'),
        { name: 'WriteError', message: 'put() requires a key argument' }
      )
      done()
    },

    'put() with undefined key causes error': function (done) {
      assert.exception(
        this.db.put.bind(this.db, undefined, 'foo'),
        { name: 'WriteError', message: 'put() requires a key argument' }
      )
      done()
    },

    'put() with null value works': function (done) {
      this.db.put('foo', null, function (err, value) {
        refute(err)
        done()
      })
    },

    'put() with undefined value works': function (done) {
      this.db.put('foo', undefined, function (err, value) {
        refute(err)
        done()
      })
    },
    'batch() with undefined value works': function (done) {
      this.db.batch([{ key: 'foo', value: undefined, type: 'put' }], function (err) {
        refute(err)
        done()
      })
    },
    'batch() with null value works': function (done) {
      this.db.batch([{ key: 'foo', value: null, type: 'put' }], function (err) {
        refute(err)
        done()
      })
    },
    'batch() with undefined key causes error': function (done) {
      this.db.batch([{ key: undefined, value: 'bar', type: 'put' }], function (err) {
        assert.isInstanceOf(err, Error)
        assert.isInstanceOf(err, errors.LevelUPError)
        done()
      })
    },
    'batch() with null key causes error': function (done) {
      this.db.batch([{ key: null, value: 'bar', type: 'put' }], function (err) {
        assert.isInstanceOf(err, Error)
        assert.isInstanceOf(err, errors.LevelUPError)
        done()
      })
    }
  }
})
