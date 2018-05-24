/* Copyright (c) 2012-2018 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var referee = require('referee')
var assert = referee.assert
var refute = referee.refute
var async = require('async')
var delayed = require('delayed').delayed
var levelup = require('../lib/levelup.js')
var errors = require('level-errors')
var memdown = require('memdown')
var encDown = require('encoding-down')

assert(levelup.errors === errors)

referee.add('isInstanceOf', {
  assert: function (actual, expected) {
    return actual instanceof expected
  },
  refute: function (actual, expected) {
    return !(actual instanceof expected)
  },
  assertMessage: '${0} expected to be instance of ${1}', // eslint-disable-line
  refuteMessage: '${0} expected not to be instance of ${1}' // eslint-disable-line
})

referee.add('isUndefined', {
  assert: function (actual) {
    return actual === undefined
  },
  refute: function (actual) {
    return actual !== undefined
  },
  assertMessage: '${0} expected to be undefined', // eslint-disable-line
  refuteMessage: '${0} expected not to be undefined' // eslint-disable-line
})

module.exports.openTestDatabase = function () {
  var options = typeof arguments[0] === 'object' ? arguments[0] : {}
  var callback = typeof arguments[0] === 'function' ? arguments[0] : arguments[1]

  levelup(encDown(memdown(), options), function (err, db) {
    refute(err)
    if (!err) {
      this.closeableDatabases.push(db)
      callback(db)
    }
  }.bind(this))
}

module.exports.commonTearDown = function (done) {
  async.forEach(this.closeableDatabases, function (db, callback) {
    db.close(callback)
  }, done)
}

module.exports.commonSetUp = function (done) {
  this.closeableDatabases = []
  this.openTestDatabase = module.exports.openTestDatabase.bind(this)
  this.timeout = 10000
  process.nextTick(done)
}

module.exports.readStreamSetUp = function (done) {
  module.exports.commonSetUp.call(this, function () {
    var i
    var k

    this.dataSpy = this.spy()
    this.endSpy = this.spy()
    this.sourceData = []

    for (i = 0; i < 100; i++) {
      k = (i < 10 ? '0' : '') + i
      this.sourceData.push({
        type: 'put',
        key: k,
        value: Math.random()
      })
    }

    this.verify = delayed(function (rs, done, data) {
      if (!data) data = this.sourceData // can pass alternative data array for verification
      assert.equals(this.endSpy.callCount, 1, 'ReadStream emitted single "end" event')
      assert.equals(this.dataSpy.callCount, data.length, 'ReadStream emitted correct number of "data" events')
      data.forEach(function (d, i) {
        var call = this.dataSpy.getCall(i)
        if (call) {
          assert.equals(call.args.length, 1, 'ReadStream "data" event #' + i + ' fired with 1 argument')
          refute.isNull(call.args[0].key, 'ReadStream "data" event #' + i + ' argument has "key" property')
          refute.isNull(call.args[0].value, 'ReadStream "data" event #' + i + ' argument has "value" property')
          assert.equals(call.args[0].key, d.key, 'ReadStream "data" event #' + i + ' argument has correct "key"')
          assert.equals(+call.args[0].value, +d.value, 'ReadStream "data" event #' + i + ' argument has correct "value"')
        }
      }.bind(this))
      done()
    }, 0.05, this)

    done()
  }.bind(this))
}
