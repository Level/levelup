/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

const referee = require('referee')
const { assert, refute } = referee
const crypto = require('crypto')
const async = require('async')
const rimraf = require('rimraf')
const fs = require('fs')
const path = require('path')
const { delayed } = require('delayed')
const LevelUp = require('../lib/levelup.js')
const errors = require('level-errors')
let dbidx = 0
const leveldown = require('leveldown')
const encDown = require('encoding-down')

assert(LevelUp.errors === errors)

referee.add('isInstanceOf', {
  assert: (actual, expected) => {
    return actual instanceof expected
  },
  refute: (actual, expected) => {
    return !(actual instanceof expected)
  },
  assertMessage: '${0} expected to be instance of ${1}', // eslint-disable-line
  refuteMessage: '${0} expected not to be instance of ${1}' // eslint-disable-line
})

referee.add('isUndefined', {
  assert: actual => {
    return actual === undefined
  },
  refute: actual => {
    return actual !== undefined
  },
  assertMessage: '${0} expected to be undefined', // eslint-disable-line
  refuteMessage: '${0} expected not to be undefined' // eslint-disable-line
})

module.exports.nextLocation = () =>
  path.join(__dirname, '_levelup_test_db_' + dbidx++)

module.exports.cleanup = callback =>
  fs.readdir(__dirname, function (err, list) {
    if (err) return callback(err)

    list = list.filter(function (f) {
      return (/^_levelup_test_db_/).test(f)
    })

    if (!list.length) { return callback() }

    var ret = 0

    list.forEach(function (f) {
      rimraf(path.join(__dirname, f), function () {
        if (++ret === list.length) { callback() }
      })
    })
  })

module.exports.openTestDatabase = function () {
  var options = typeof arguments[0] === 'object' ? arguments[0] : {}
  var callback = typeof arguments[0] === 'function' ? arguments[0] : arguments[1]
  var location = typeof arguments[0] === 'string' ? arguments[0] : module.exports.nextLocation()

  rimraf(location, err => {
    refute(err)
    this.cleanupDirs.push(location)
    new LevelUp(encDown(leveldown(location), options), (err, db) => { // eslint-disable-line no-new
      refute(err)
      if (!err) {
        this.closeableDatabases.push(db)
        callback(db)
      }
    })
  })
}

module.exports.commonTearDown = done => {
  async.forEach(this.closeableDatabases, (db, callback) => {
    db.close(callback)
  }, module.exports.cleanup.bind(null, done))
}

module.exports.loadBinaryTestData = callback => {
  fs.readFile(path.join(__dirname, 'data/testdata.bin'), callback)
}

module.exports.binaryTestDataMD5Sum = '920725ef1a3b32af40ccd0b78f4a62fd'

module.exports.checkBinaryTestData = (testData, callback) => {
  var md5sum = crypto.createHash('md5')
  md5sum.update(testData)
  assert.equals(md5sum.digest('hex'), module.exports.binaryTestDataMD5Sum)
  callback()
}

module.exports.commonSetUp = function (done) {
  this.cleanupDirs = []
  this.closeableDatabases = []
  this.openTestDatabase = module.exports.openTestDatabase.bind(this)
  this.timeout = 10000
  module.exports.cleanup(done)
}

module.exports.readStreamSetUp = function (done) {
  module.exports.commonSetUp.call(this, () => {
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

    this.verify = delayed((rs, done, data) => {
      if (!data) data = this.sourceData // can pass alternative data array for verification
      assert.equals(this.endSpy.callCount, 1, 'ReadStream emitted single "end" event')
      assert.equals(this.dataSpy.callCount, data.length, 'ReadStream emitted correct number of "data" events')
      data.forEach((d, i) => {
        var call = this.dataSpy.getCall(i)
        if (call) {
          assert.equals(call.args.length, 1, 'ReadStream "data" event #' + i + ' fired with 1 argument')
          refute.isNull(call.args[0].key, 'ReadStream "data" event #' + i + ' argument has "key" property')
          refute.isNull(call.args[0].value, 'ReadStream "data" event #' + i + ' argument has "value" property')
          assert.equals(call.args[0].key, d.key, 'ReadStream "data" event #' + i + ' argument has correct "key"')
          assert.equals(+call.args[0].value, +d.value, 'ReadStream "data" event #' + i + ' argument has correct "value"')
        }
      })
      done()
    }, 0.05, this)

    done()
  })
}
