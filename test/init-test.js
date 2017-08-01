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

buster.testCase('Init & open()', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'levelup()': function () {
    assert.isFunction(levelup)
    assert.equals(levelup.length, 3) // db, options & callback arguments
    assert.exception(levelup, 'InitializationError') // no db
  },

  'default options': function (done) {
    var location = common.nextLocation()
    levelup(leveldown(location), function (err, db) {
      refute(err, 'no error')
      assert.isTrue(db.isOpen())
      this.closeableDatabases.push(db)
      this.cleanupDirs.push(location)
      db.close(function (err) {
        refute(err)

        assert.isFalse(db.isOpen())

        levelup(leveldown(location), function (err, db) {
          refute(err)
          assert.isObject(db)
          assert.equals(db.options.keyEncoding, 'utf8')
          assert.equals(db.options.valueEncoding, 'utf8')
          done()
        })
      })
    }.bind(this))
  },

  'basic options': function (done) {
    var location = common.nextLocation()
    levelup(leveldown(location), { valueEncoding: 'binary' }, function (err, db) {
      refute(err)
      this.closeableDatabases.push(db)
      this.cleanupDirs.push(location)
      assert.isObject(db)
      assert.equals(db.options.keyEncoding, 'utf8')
      assert.equals(db.options.valueEncoding, 'binary')
      done()
    }.bind(this))
  },

  'options with encoding': function (done) {
    var location = common.nextLocation()
    levelup(leveldown(location), { keyEncoding: 'ascii', valueEncoding: 'json' }, function (err, db) {
      refute(err)
      this.closeableDatabases.push(db)
      this.cleanupDirs.push(location)
      assert.isObject(db)
      assert.equals(db.options.keyEncoding, 'ascii')
      assert.equals(db.options.valueEncoding, 'json')
      done()
    }.bind(this))
  },

  'without callback': function (done) {
    var location = common.nextLocation()
    var db = levelup(leveldown(location))
    this.closeableDatabases.push(db)
    this.cleanupDirs.push(location)
    assert.isObject(db)
    db.on('ready', function () {
      assert.isTrue(db.isOpen())
      done()
    })
  },

  'validate abstract-leveldown': function (done) {
    var down = leveldown(common.nextLocation())
    Object.defineProperty(down, 'status', {
      get: function () { return null },
      set: function () {}
    })
    try {
      levelup(down)
    } catch (err) {
      assert.equals(err.message, '.status required, old abstract-leveldown')
      return done()
    }
    throw new Error('did not throw')
  }
})
