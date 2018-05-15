/* Copyright (c) 2012-2018 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var levelup = require('../lib/levelup')
var errors = levelup.errors
var async = require('async')
var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('batch()', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'batch() with multiple puts': function (done) {
    this.openTestDatabase(function (db) {
      db.batch([
        { type: 'put', key: 'foo', value: 'afoovalue' },
        { type: 'put', key: 'bar', value: 'abarvalue' },
        { type: 'put', key: 'baz', value: 'abazvalue' }
      ], function (err) {
        refute(err)
        async.forEach(['foo', 'bar', 'baz'], function (key, callback) {
          db.get(key, function (err, value) {
            refute(err)
            assert.equals(value, 'a' + key + 'value')
            callback()
          })
        }, done)
      })
    })
  },

  'batch() with promise interface': function (done) {
    this.openTestDatabase(function (db) {
      db.batch([
        { type: 'put', key: 'foo', value: 'afoovalue' },
        { type: 'put', key: 'bar', value: 'abarvalue' },
        { type: 'put', key: 'baz', value: 'abazvalue' }
      ])
        .then(function () {
          async.forEach(['foo', 'bar', 'baz'], function (key, callback) {
            db.get(key, function (err, value) {
              refute(err)
              assert.equals(value, 'a' + key + 'value')
              callback()
            })
          }, done)
        })
        .catch(done)
    })
  },

  'batch() with multiple puts and deletes': function (done) {
    this.openTestDatabase(function (db) {
      async.series([
        function (callback) {
          db.batch([
            { type: 'put', key: '1', value: 'one' },
            { type: 'put', key: '2', value: 'two' },
            { type: 'put', key: '3', value: 'three' }
          ], callback)
        },
        function (callback) {
          db.batch([
            { type: 'put', key: 'foo', value: 'afoovalue' },
            { type: 'del', key: '1' },
            { type: 'put', key: 'bar', value: 'abarvalue' },
            { type: 'del', key: 'foo' },
            { type: 'put', key: 'baz', value: 'abazvalue' }
          ], callback)
        },
        function (callback) {
          // these should exist
          async.forEach(['2', '3', 'bar', 'baz'], function (key, callback) {
            db.get(key, function (err, value) {
              refute(err)
              refute.isNull(value)
              callback()
            })
          }, callback)
        },
        function (callback) {
          // these shouldn't exist
          async.forEach(['1', 'foo'], function (key, callback) {
            db.get(key, function (err, value) {
              assert(err)
              assert.isInstanceOf(err, errors.NotFoundError)
              refute(value)
              callback()
            })
          }, callback)
        }
      ], done)
    })
  },

  'batch() with chained interface': function (done) {
    this.openTestDatabase(function (db) {
      db.put('1', 'one', function (err) {
        refute(err)

        db.batch()
          .put('one', '1')
          .del('two')
          .put('three', '3')
          .clear()
          .del('1')
          .put('2', 'two')
          .put('3', 'three')
          .del('3')
          .write(function (err) {
            refute(err)

            async.forEach([ 'one', 'three', '1', '2', '3' ], function (key, callback) {
              db.get(key, function (err) {
                if ([ 'one', 'three', '1', '3' ].indexOf(key) > -1) { assert(err) } else { refute(err) }
                callback()
              })
            }, done)
          })
      })
    })
  },

  'batch() with chained promise interface': function (done) {
    this.openTestDatabase(function (db) {
      db.put('1', 'one', function (err) {
        refute(err)

        db.batch()
          .put('one', '1')
          .del('two')
          .put('three', '3')
          .clear()
          .del('1')
          .put('2', 'two')
          .put('3', 'three')
          .del('3')
          .write()
          .then(function () {
            async.forEach([ 'one', 'three', '1', '2', '3' ], function (key, callback) {
              db.get(key, function (err) {
                if ([ 'one', 'three', '1', '3' ].indexOf(key) > -1) { assert(err) } else { refute(err) }
                callback()
              })
            }, done)
          })
          .catch(done)
      })
    })
  },

  'batch() exposes ops queue length': function (done) {
    this.openTestDatabase(function (db) {
      var batch = db.batch()
        .put('one', '1')
        .del('two')
        .put('three', '3')
      assert.equals(batch.length, 3)
      batch.clear()
      assert.equals(batch.length, 0)
      batch
        .del('1')
        .put('2', 'two')
        .put('3', 'three')
        .del('3')
      assert.equals(batch.length, 4)
      done()
    })
  },

  'batch() with can manipulate data from put()': function (done) {
    // checks encoding and whatnot
    this.openTestDatabase(function (db) {
      async.series(
        [
          db.put.bind(db, '1', 'one'),
          db.put.bind(db, '2', 'two'),
          db.put.bind(db, '3', 'three'),
          function (callback) {
            db.batch([
              { type: 'put', key: 'foo', value: 'afoovalue' },
              { type: 'del', key: '1' },
              { type: 'put', key: 'bar', value: 'abarvalue' },
              { type: 'del', key: 'foo' },
              { type: 'put', key: 'baz', value: 'abazvalue' }
            ], callback)
          },
          function (callback) {
            // these should exist
            async.forEach(['2', '3', 'bar', 'baz'], function (key, callback) {
              db.get(key, function (err, value) {
                refute(err)
                refute.isNull(value)
                callback()
              })
            }, callback)
          },
          function (callback) {
            // these shouldn't exist
            async.forEach(['1', 'foo'], function (key, callback) {
              db.get(key, function (err, value) {
                assert(err)
                assert.isInstanceOf(err, errors.NotFoundError)
                refute(value)
                callback()
              })
            }, callback)
          }
        ], done)
    })
  },

  'batch() data can be read with get() and del()': function (done) {
    this.openTestDatabase(function (db) {
      async.series([
        function (callback) {
          db.batch([
            { type: 'put', key: '1', value: 'one' },
            { type: 'put', key: '2', value: 'two' },
            { type: 'put', key: '3', value: 'three' }
          ], callback)
        },
        db.del.bind(db, '1', 'one'),
        function (callback) {
          // these should exist
          async.forEach(['2', '3'], function (key, callback) {
            db.get(key, function (err, value) {
              refute(err)
              refute.isNull(value)
              callback()
            })
          }, callback)
        },
        function (callback) {
          // this shouldn't exist
          db.get('1', function (err, value) {
            assert(err)
            assert.isInstanceOf(err, errors.NotFoundError)
            refute(value)
            callback()
          })
        }
      ], done)
    })
  },

  'chained batch() arguments': {
    'setUp': function (done) {
      this.openTestDatabase(function (db) {
        this.db = db
        this.batch = db.batch()
        done()
      }.bind(this))
    },

    'test batch#put() with missing `value`': function () {
      // value = undefined
      this.batch.put('foo1')

      this.batch.put('foo1', null)
    },

    'test batch#put() with missing `key`': function () {
      // key = undefined
      assert.exception(this.batch.put.bind(this.batch, undefined, 'foo1'), function (err) {
        if (err.name !== 'WriteError') { return false }
        if (err.message !== 'key cannot be `null` or `undefined`') { return false }
        return true
      })

      // key = null
      assert.exception(this.batch.put.bind(this.batch, null, 'foo1'), function (err) {
        if (err.name !== 'WriteError') { return false }
        if (err.message !== 'key cannot be `null` or `undefined`') { return false }
        return true
      })
    },

    'test batch#put() with missing `key` and `value`': function () {
      // undefined
      assert.exception(this.batch.put.bind(this.batch), function (err) {
        if (err.name !== 'WriteError') { return false }
        if (err.message !== 'key cannot be `null` or `undefined`') { return false }
        return true
      })

      // null
      assert.exception(this.batch.put.bind(this.batch, null, null), function (err) {
        if (err.name !== 'WriteError') { return false }
        if (err.message !== 'key cannot be `null` or `undefined`') { return false }
        return true
      })
    },

    'test batch#del() with missing `key`': function () {
      // key = undefined
      assert.exception(this.batch.del.bind(this.batch, undefined, 'foo1'), function (err) {
        if (err.name !== 'WriteError') { return false }
        if (err.message !== 'key cannot be `null` or `undefined`') { return false }
        return true
      })

      // key = null
      assert.exception(this.batch.del.bind(this.batch, null, 'foo1'), function (err) {
        if (err.name !== 'WriteError') { return false }
        if (err.message !== 'key cannot be `null` or `undefined`') { return false }
        return true
      })
    },

    'test batch#write() with no callback': function () {
      this.batch.write() // should not cause an error with no cb
    },

    'test batch operations after write()': {
      'setUp': function (done) {
        this.batch.put('foo', 'bar').put('boom', 'bang').del('foo').write(done)
        this.verify = function (cb) {
          assert.exception(cb, function (err) {
            if (err.name !== 'WriteError') { return false }
            if (err.message !== 'write() already called on this batch') { return false }
            return true
          })
        }
      },

      'test put()': function () {
        this.verify(function () {
          this.batch.put('whoa', 'dude')
        }.bind(this))
      },

      'test del()': function () {
        this.verify(function () {
          this.batch.del('foo')
        }.bind(this))
      },

      'test clear()': function () {
        this.verify(function () {
          this.batch.clear()
        }.bind(this))
      }
    }
  }
})
