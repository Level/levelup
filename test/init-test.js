/* Copyright (c) 2012-2016 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var levelup   = require('../lib/levelup.js')
  , leveldown = require('leveldown')
  , errors    = levelup.errors
  , fs        = require('fs')
  , common    = require('./common')

  , assert    = require('referee').assert
  , refute    = require('referee').refute
  , buster    = require('bustermove')
  , MemDOWN   = require('memdown')

buster.testCase('Init & open()', {
    'setUp': common.commonSetUp
  , 'tearDown': common.commonTearDown

  , 'levelup()': function () {
      assert.isFunction(levelup)
      assert.equals(levelup.length, 3) // location, options & callback arguments
      assert.exception(levelup, 'InitializationError') // no location
    }

  , 'default options': function (done) {
      var location = common.nextLocation()
      levelup(leveldown(location), function (err, db) {
        refute(err, 'no error')
        assert.isTrue(db.isOpen())
        this.closeableDatabases.push(db)
        this.cleanupDirs.push(location)
        db.close(function (err) {
          refute(err)

          assert.isFalse(db.isOpen())

          levelup(leveldown(location), function (err, db) { // no options object
            refute(err)
            assert.isObject(db)

            done()
          }.bind(this))
        }.bind(this))
      }.bind(this))
    }

  , 'basic options': function (done) {
      var location = common.nextLocation()
      levelup(
          leveldown(location)
        , function (err, db) {
            refute(err)

            this.closeableDatabases.push(db)
            this.cleanupDirs.push(location)
            assert.isObject(db)

            done()
          }.bind(this)
      )
    }

  , 'without callback': function (done) {
      var location = common.nextLocation()
        , db = levelup(leveldown(location))

      this.closeableDatabases.push(db)
      this.cleanupDirs.push(location)
      assert.isObject(db)

      db.on("ready", function () {
        assert.isTrue(db.isOpen())
        done()
      })
    }

  , 'validate leveldown': function (done) {
      var down = leveldown(common.nextLocation())
      Object.defineProperty(down, 'status', {
        get: function () { return null },
        set: function () {}
      })
      try {
        levelup(down)
      } catch (err) {
        return done()
      }
      throw new Error('did not throw')
    }
})
