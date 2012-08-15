/* Copyright (c) 2012 Rod Vagg <@rvagg> */

/*global commonSetUp:true, commonTearDown:true*/

var buster  = require('buster')
  , assert  = buster.assert
  , levelup = require('../lib/levelup.js')
  , errors  = require('../lib/errors.js')
  , rimraf  = require('rimraf')
  , async   = require('async')
  , fs      = require('fs')

buster.testCase('Copy', {
    'setUp': commonSetUp
  , 'tearDown': commonTearDown

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
                    assert.equals(value, data.value, 'Destination data #' + data.key + ' has correct value')
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
            levelup.copy(dbs.src, dbs.dst, function (err) {
              refute(err)
              verify(dbs.dst)
            })
          }
      )
    }
})