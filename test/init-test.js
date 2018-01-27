/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var LevelUp = require('../lib/levelup.js')
var leveldown = require('leveldown')
var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('Init & open()', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'new LevelUp()': function () {
    assert.equals(LevelUp.length, 3) // db, options & callback arguments
    assert.exception(LevelUp, 'InitializationError') // no db
  },

  'open and close statuses': function (done) {
    var location = common.nextLocation()
    new LevelUp(leveldown(location), (err, db) => { // eslint-disable-line no-new
      refute(err, 'no error')
      assert.isTrue(db.isOpen())
      this.closeableDatabases.push(db)
      this.cleanupDirs.push(location)
      db.close(function (err) {
        refute(err)

        assert.isFalse(db.isOpen())
        assert.isTrue(db.isClosed())

        new LevelUp(leveldown(location), function (err, db) { // eslint-disable-line no-new
          refute(err)
          assert.isObject(db)
          done()
        })
      })
    })
  },

  'without callback': function (done) {
    var location = common.nextLocation()
    var db = new LevelUp(leveldown(location)) // eslint-disable-line no-new
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
      new LevelUp(down) // eslint-disable-line no-new
    } catch (err) {
      assert.equals(err.message, '.status required, old abstract-leveldown')
      return done()
    }
    throw new Error('did not throw')
  }
})
