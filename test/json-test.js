/* Copyright (c) 2012-2018 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var levelup = require('../lib/levelup.js')
var memdown = require('memdown')
var encDown = require('encoding-down')
var async = require('async')
var concat = require('concat-stream')
var common = require('./common')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')

buster.testCase('JSON encoding', {
  'setUp': function (done) {
    common.commonSetUp.call(this, function () {
      this.runTest = function (testData, assertType, done) {
        levelup(encDown(memdown(), {
          keyEncoding: 'json',
          valueEncoding: 'json'
        }), function (err, db) {
          refute(err)
          if (err) return

          this.closeableDatabases.push(db)

          var PUT = testData.map(function (d) { return db.put.bind(db, d.key, d.value) })
          async.parallel(PUT, function (err) {
            refute(err)
            async.parallel([testGet, testStream], done)
          })

          function testGet (next) {
            async.forEach(testData, function (d, callback) {
              db.get(d.key, function (err, value) {
                if (err) console.error(err.stack)
                refute(err)
                assert[assertType](d.value, value)
                callback()
              })
            }, next)
          }

          function testStream (next) {
            db.createReadStream().pipe(concat(function (result) {
              assert.equals(result, testData)
              next()
            }))
          }
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
      { key: '2', value: 'a string' },
      { key: '3', value: true },
      { key: '4', value: false }
    ], 'same', done)
  },

  'simple-object keys in "json" encoding': function (done) {
    this.runTest([
      { value: 'string', key: 'a string' },
      { value: '0', key: 0 },
      { value: '1', key: 1 },
      { value: 'false', key: false },
      { value: 'true', key: true }
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
      {
        value: '0',
        key: {
          foo: 'bar',
          bar: [ 1, 2, 3 ],
          bang: { yes: true, no: false }
        }
      }
    ], 'same', done)
  }
})
