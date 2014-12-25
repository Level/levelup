/* Copyright (c) 2012-2014 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT License <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
 */

var levelup     = require('../lib/levelup.js')
  , async       = require('async')
  , common      = require('./common')
  , WriteStream = require('level-ws')

  , assert      = require('referee').assert
  , refute      = require('referee').refute
  , buster      = require('bustermove')


function copy (srcdb, dstdb, callback) {
  srcdb.readStream()
    .pipe(new WriteStream(dstdb))
    .on('close', callback ? callback : function () {})
    .on('error', callback ? callback : function (err) { throw err })
}


buster.testCase('Copy', {
    'setUp': common.commonSetUp
  , 'tearDown': common.commonTearDown

  , 'copy full database': function (done) {
      var sourceData = []

      for (var i = 0; i < 100; i++) {
        sourceData.push({
            type  : 'put'
          , key   : i
          , value : Math.random()
        })
      }

      var opensrc = function (callback) {
            this.openTestDatabase(function (db) {
              db.batch(sourceData.slice(), function (err) {
                callback(err, db)
              })
            })
          }.bind(this)

        , opendst = function (callback) {
            this.openTestDatabase(function (db) {
              callback(null, db)
            })
          }.bind(this)

        , verify = function (dstdb) {
            async.forEach(
                sourceData
              , function (data, callback) {
                  dstdb.get(data.key, function (err, value) {
                    refute(err)
                    assert.equals(+value.toString(), data.value, 'Destination data #' + data.key + ' has correct value')
                    callback()
                  })
                }
              , done
            )
          }.bind(this)

      async.parallel(
          { src: opensrc, dst: opendst }
        , function (err, dbs) {
            refute(err)
            copy(dbs.src, dbs.dst, function (err) {
              refute(err)
              verify(dbs.dst)
            })
          }
      )
    }
})
