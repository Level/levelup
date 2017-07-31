/* Copyright (c) 2012-2016 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var levelup = require('../lib/levelup.js')
var leveldown = require('leveldown')
var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')
var MemDOWN = require('memdown')

buster.testCase('Init & open()', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'levelup()': function () {
    assert.isFunction(levelup)
    assert.equals(levelup.length, 3) // location, options & callback arguments
    assert.exception(levelup, 'InitializationError') // no location
  },

  'default options': function (done) {
    var location = common.nextLocation()
    levelup(location, { db: leveldown }, function (err, db) {
      refute(err, 'no error')
      assert.isTrue(db.isOpen())
      this.closeableDatabases.push(db)
      this.cleanupDirs.push(location)
      db.close(function (err) {
        refute(err)

        assert.isFalse(db.isOpen())

        levelup(location, { db: leveldown }, function (err, db) {
          refute(err)
          assert.isObject(db)
          assert.equals(db.options.keyEncoding, 'utf8')
          assert.equals(db.options.valueEncoding, 'utf8')
          assert.equals(db.location, location)

          // TODO remove
          // read-only properties
          db.location = 'foo'
          assert.equals(db.location, location)

          done()
        })
      })
    }.bind(this))
  },

  'basic options': function (done) {
    var location = common.nextLocation()
    levelup(location, { valueEncoding: 'binary', db: leveldown }, function (err, db) {
      refute(err)

      this.closeableDatabases.push(db)
      this.cleanupDirs.push(location)
      assert.isObject(db)
      assert.equals(db.options.keyEncoding, 'utf8')
      assert.equals(db.options.valueEncoding, 'binary')
      assert.equals(db.location, location)

      // read-only properties
      db.location = 'bar'
      assert.equals(db.location, location)

      done()
    }.bind(this))
  },

  'options with encoding': function (done) {
    var location = common.nextLocation()
    levelup(location, { keyEncoding: 'ascii', valueEncoding: 'json', db: leveldown }, function (err, db) {
      refute(err)

      this.closeableDatabases.push(db)
      this.cleanupDirs.push(location)
      assert.isObject(db)
      assert.equals(db.options.keyEncoding, 'ascii')
      assert.equals(db.options.valueEncoding, 'json')
      assert.equals(db.location, location)

      // read-only properties
      db.location = 'bar'
      assert.equals(db.location, location)

      done()
    }.bind(this))
  },

  'without callback': function (done) {
    var location = common.nextLocation()
    var db = levelup(location, { db: leveldown })

    this.closeableDatabases.push(db)
    this.cleanupDirs.push(location)
    assert.isObject(db)
    assert.equals(db.location, location)

    db.on('ready', function () {
      assert.isTrue(db.isOpen())
      done()
    })
  },

  // TODO remove once first parameter is a DOWN
  'constructor with options argument uses factory': function (done) {
    var db = levelup({ db: MemDOWN })
    assert.isNull(db.location, 'location property is null')
    db.on('open', function () {
      assert(db.db instanceof MemDOWN, 'using a memdown backend')
      assert.same(db.db.location, '', 'db location property is ""')
      db.put('foo', 'bar', function (err) {
        refute(err, 'no error')
        db.get('foo', function (err, value) {
          refute(err, 'no error')
          assert.equals(value, 'bar', 'correct value')
          done()
        })
      })
    })
  },

  // TODO remove once first parameter is a DOWN
  'constructor with only function argument uses factory': function (done) {
    var db = levelup(MemDOWN)
    assert.isNull(db.location, 'location property is null')
    db.on('open', function () {
      assert(db.db instanceof MemDOWN, 'using a memdown backend')
      assert.same(db.db.location, '', 'db location property is ""')
      db.put('foo', 'bar', function (err) {
        refute(err, 'no error')
        db.get('foo', function (err, value) {
          refute(err, 'no error')
          assert.equals(value, 'bar', 'correct value')
          done()
        })
      })
    })
  }
})
