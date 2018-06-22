var levelup = require('../lib/levelup.js')
var memdown = require('memdown')
var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('without encoding-down', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

  'serializes key': function (done) {
    var down = memdown()

    down._serializeKey = function (key) {
      return key.toUpperCase()
    }

    var db = levelup(down)

    this.closeableDatabases.push(db)

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
    var down = memdown()

    down._serializeValue = function (value) {
      return value.toUpperCase()
    }

    var db = levelup(down)

    this.closeableDatabases.push(db)

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
