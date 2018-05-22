/* Copyright (c) 2012-2018 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var levelup = require('../lib/levelup.js')
var memdown = require('memdown')
var encDown = require('encoding-down')
var async = require('async')
var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('custom encoding', {
  'setUp': function (done) {
    common.commonSetUp.call(this, function () {
      this.runTest = function (testData, assertType, done) {
        var customEncoding = {
          encode: JSON.stringify,
          decode: JSON.parse,
          buffer: false,
          type: 'custom'
        }

        levelup(encDown(memdown(), {
          keyEncoding: customEncoding,
          valueEncoding: customEncoding
        }), function (err, db) {
          refute(err)
          if (err) return

          this.closeableDatabases.push(db)

          var PUT = testData.map(function (d) { return db.put.bind(db, d.key, d.value) })
          async.parallel(PUT, function (err) {
            refute(err)
            async.forEach(testData, function (d, callback) {
              db.get(d.key, function (err, value) {
                if (err) console.error(err.stack)
                refute(err)
                assert[assertType](d.value, value)
                callback()
              })
            }, done)
          })
        }.bind(this))
      }
      done()
    }.bind(this))
  },

  'tearDown': common.commonTearDown,

  'simple-object values in "json" encoding': function (done) {
    this.runTest([
      { key: '0', value: 0 },
      { key: '1', value: 1 },
      { key: 'string', value: 'a string' },
      { key: 'true', value: true },
      { key: 'false', value: false }
    ], 'same', done)
  },

  'simple-object keys in "json" encoding': function (done) {
    this.runTest([
      // Test keys that would be considered the same with default utf8 encoding.
      // Because String([1]) === String(1).
      { value: '0', key: [1] },
      { value: '1', key: 1 },
      { value: 'string', key: 'a string' },
      { value: 'true', key: true },
      { value: 'false', key: false }
    ], 'same', done)
  },

  'complex-object values in "json" encoding': function (done) {
    this.runTest([
      {
        key: '0',
        value: {
          foo: 'bar',
          bar: [ 1, 2, 3 ],
          bang: { yes: true, no: false }
        }
      }
    ], 'equals', done)
  },

  'complex-object keys in "json" encoding': function (done) {
    this.runTest([
      // Test keys that would be considered the same with default utf8 encoding.
      // Because String({}) === String({}) === '[object Object]'.
      {
        value: '0',
        key: {
          foo: 'bar',
          bar: [ 1, 2, 3 ],
          bang: { yes: true, no: false }
        }
      },
      {
        value: '1',
        key: {
          foo: 'different',
          bar: [ 1, 2, 3 ],
          bang: { yes: true, no: false }
        }
      }
    ], 'same', done)
  }
})
