/* Copyright (c) 2012-2014 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT License <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
 */

var levelup = require('../lib/levelup.js')
  , assert  = require('referee').assert
  , refute  = require('referee').refute
  , buster  = require('bustermove')
  , MemDOWN = require('memdown')

require('./common')

buster.testCase('levelup from leveldown', {
    'levelup from leveldown in location slot': function (done) {
      var md       = new MemDOWN('foo')
        , db       = levelup(md)
        , entries  = []
        , expected = [
              { key: 'a', value: 'A' }
            , { key: 'b', value: 'B' }
            , { key: 'c', value: 'C' }
            , { key: 'd', value: 'D' }
            , { key: 'e', value: 'E' }
            , { key: 'f', value: 'F' }
            , { key: 'i', value: 'I' }
          ]

      db.put('f', 'F')
      db.put('h', 'H')
      db.put('i', 'I')
      db.put('a', 'A')
      db.put('c', 'C')
      db.put('e', 'E')
      db.del('g')
      db.batch([
          { type: 'put', key: 'd', value: 'D' }
        , { type: 'del', key: 'h' }
        , { type: 'put', key: 'b', value: 'B' }
      ])

      db.createReadStream()
        .on('data', function (data) { entries.push(data) })
        .on('error', function (err) { refute(err, 'readStream emitted an error') })
        .on('close', function () {
          assert.equals(entries, expected, 'correct entries')
          assert.equals(
              md._store['$foo'].keys
            , expected.map(function (e) { return e.key })
            , 'memdown has the entries'
          )
          done()
        })
    },
    'levelup from leveldown in options.db slot': function (done) {
      var md       = new MemDOWN('foo')
        , db       = levelup({ db: md })
        , entries  = []
        , expected = [
              { key: 'a', value: 'A' }
            , { key: 'b', value: 'B' }
            , { key: 'c', value: 'C' }
            , { key: 'd', value: 'D' }
            , { key: 'e', value: 'E' }
            , { key: 'f', value: 'F' }
            , { key: 'i', value: 'I' }
          ]

      db.put('f', 'F')
      db.put('h', 'H')
      db.put('i', 'I')
      db.put('a', 'A')
      db.put('c', 'C')
      db.put('e', 'E')
      db.del('g')
      db.batch([
          { type: 'put', key: 'd', value: 'D' }
        , { type: 'del', key: 'h' }
        , { type: 'put', key: 'b', value: 'B' }
      ])

      db.createReadStream()
        .on('data', function (data) { entries.push(data) })
        .on('error', function (err) { refute(err, 'readStream emitted an error') })
        .on('close', function () {
          assert.equals(entries, expected, 'correct entries')
          assert.equals(
              md._store['$foo'].keys
            , expected.map(function (e) { return e.key })
            , 'memdown has the entries'
          )
          done()
        })
    },
    'levelup from leveldown in options.db slot with encodings': function (done) {
      var md       = new MemDOWN('foo')
        , kenc     = {
              encode: function (s) { return Buffer(s + '!E') }
            , decode: function (s) { return s.toString() + '!D' }
          }
        , opts     = { db: md, keyEncoding: kenc, valueEncoding: 'json' }
        , db       = levelup(opts)
        , entries  = []
        , expected = [
              { key: 'a!E!D', value: [1,2] }
            , { key: 'b!E!D', value: {x:3,y:4} }
            , { key: 'c!E!D', value: 'C' }
            , { key: 'd!E!D', value: 'D' }
            , { key: 'e!E!D', value: 'E' }
            , { key: 'f!E!D', value: 'F' }
            , { key: 'i!E!D', value: 'I' }
          ]

      db.put('f', 'F')
      db.put('h', 'H')
      db.put('i', 'I')
      db.put('a', [1,2])
      db.put('c', 'C')
      db.put('e', 'E')
      db.del('g')
      db.batch([
          { type: 'put', key: 'd', value: 'D' }
        , { type: 'del', key: 'h' }
        , { type: 'put', key: 'b', value: {x:3,y:4} }
      ])
      db.createReadStream()
        .on('data', function (data) { entries.push(data) })
        .on('error', function (err) { refute(err, 'readStream emitted an error') })
        .on('close', function () {
          assert.equals(entries, expected, 'correct entries')
          assert.equals(
              md._store['$foo'].keys
            , expected.map(function (e) { return e.key })
            , 'memdown has the entries'
          )
          done()
        })
    },
    'levelup from leveldown in location slot with encodings': function (done) {
      var md       = new MemDOWN('foo')
        , kenc     = {
              encode: function (s) { return Buffer(s + '!E') }
            , decode: function (s) { return s.toString() + '!D' }
          }
        , opts     = { keyEncoding: kenc, valueEncoding: 'json' }
        , db       = levelup(md, opts)
        , entries  = []
        , expected = [
              { key: 'a!E!D', value: [1,2] }
            , { key: 'b!E!D', value: {x:3,y:4} }
            , { key: 'c!E!D', value: 'C' }
            , { key: 'd!E!D', value: 'D' }
            , { key: 'e!E!D', value: 'E' }
            , { key: 'f!E!D', value: 'F' }
            , { key: 'i!E!D', value: 'I' }
          ]

      db.put('f', 'F')
      db.put('h', 'H')
      db.put('i', 'I')
      db.put('a', [1,2])
      db.put('c', 'C')
      db.put('e', 'E')
      db.del('g')
      db.batch([
          { type: 'put', key: 'd', value: 'D' }
        , { type: 'del', key: 'h' }
        , { type: 'put', key: 'b', value: {x:3,y:4} }
      ])
      db.createReadStream()
        .on('data', function (data) { entries.push(data) })
        .on('error', function (err) { refute(err, 'readStream emitted an error') })
        .on('close', function () {
          assert.equals(entries, expected, 'correct entries')
          assert.equals(
              md._store['$foo'].keys
            , expected.map(function (e) { return e.key })
            , 'memdown has the entries'
          )
          done()
        })
    }
})
