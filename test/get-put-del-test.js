/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var levelup = require('../lib/levelup.js')
var errors = levelup.errors
var async = require('async')
var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('get() / put() / del()', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'Simple operations': {
    'get() on empty database causes error': function (done) {
      this.openTestDatabase(function (db) {
        db.get('undefkey', function (err, value) {
          refute(value)
          assert.isInstanceOf(err, Error)
          assert.isInstanceOf(err, errors.LevelUPError)
          assert.isInstanceOf(err, errors.NotFoundError)
          assert(err.notFound === true, 'err.notFound is `true`')
          assert.equals(err.status, 404, 'err.status is 404')
          assert.match(err, '[undefkey]')
          done()
        })
      })
    },

    'get() on empty database raises promise error': function (done) {
      this.openTestDatabase(function (db) {
        db.get('undefkey').catch(function (err) {
          assert.isInstanceOf(err, Error)
          assert.isInstanceOf(err, errors.LevelUPError)
          assert.isInstanceOf(err, errors.NotFoundError)
          assert(err.notFound === true, 'err.notFound is `true`')
          assert.equals(err.status, 404, 'err.status is 404')
          assert.match(err, '[undefkey]')
          done()
        })
      })
    },

    'put() and get() simple string key/value pairs': function (done) {
      this.openTestDatabase(function (db) {
        db.put('some key', 'some value stored in the database', function (err) {
          refute(err)
          db.get('some key', function (err, value) {
            refute(err)
            assert.equals(value, 'some value stored in the database')
            done()
          })
        })
      })
    },

    'put() and get() promise interface': function (done) {
      this.openTestDatabase(function (db) {
        db.put('some key', 'some value stored in the database')
          .then(function () {
            return db.get('some key')
          })
          .then(function (value) {
            assert.equals(value, 'some value stored in the database')
            done()
          })
          .catch(done)
      })
    },

    'del() on empty database doesn\'t cause error': function (done) {
      this.openTestDatabase(function (db) {
        db.del('undefkey', function (err) {
          refute(err)
          done()
        })
      })
    },

    'del() promise interface': function (done) {
      this.openTestDatabase(function (db) {
        db.del('undefkey')
          .then(done)
          .catch(done)
      })
    },

    'del() works on real entries': function (done) {
      this.openTestDatabase(function (db) {
        async.series([
          function (callback) {
            async.forEach(['foo', 'bar', 'baz'], function (key, callback) {
              db.put(key, 1 + Math.random(), callback)
            }, callback)
          },
          function (callback) {
            db.del('bar', callback)
          },
          function (callback) {
            async.forEach(['foo', 'bar', 'baz'], function (key, callback) {
              db.get(key, function (err, value) {
                // we should get foo & baz but not bar
                if (key === 'bar') {
                  assert(err)
                  refute(value)
                } else {
                  refute(err)
                  assert(value)
                }
                callback()
              })
            }, callback)
          }
        ], done)
      })
    }
  },

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
  }

})
