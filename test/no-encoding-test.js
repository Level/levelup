/* Copyright (c) 2012-2018 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var levelup = require('../lib/levelup.js')
var leveldown = require('leveldown')
var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('without encoding-down', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'serializes key': function (done) {
    var location = common.nextLocation()
    var down = leveldown(location)

    down._serializeKey = function (key) {
      return key.toUpperCase()
    }

    var db = levelup(down)

    this.closeableDatabases.push(db)
    this.cleanupDirs.push(location)

    db.put('key', 'value', function (err) {
      refute(err)

      db.get('KEY', { asBuffer: false }, function (err, value) {
        refute(err)
        assert.same(value, 'value')
        done()
      })
    })
  },

  'serializes value': function (done) {
    var location = common.nextLocation()
    var down = leveldown(location)

    down._serializeValue = function (value) {
      return value.toUpperCase()
    }

    var db = levelup(down)

    this.closeableDatabases.push(db)
    this.cleanupDirs.push(location)

    db.put('key', 'value', function (err) {
      refute(err)

      db.get('key', { asBuffer: false }, function (err, value) {
        refute(err)
        assert.same(value, 'VALUE')
        done()
      })
    })
  }
})
