/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var buster     = require('buster')
  , assert     = buster.assert
  , async      = require('async')
  , du         = require('du')
  , delayed    = require('delayed').delayed
  , common     = require('./common')

  , compressableData = new Buffer(Array.apply(null, Array(1024 * 100)).map(function () { return 'aaaaaaaaaa' }).join(''))
  , multiples = 10
  , dataSize = compressableData.length * multiples

  , verify = function(db, done) {
      du(db._location, function (err, size) {
        refute(err)
        //console.log(Math.round((size / dataSize) * 100) + '% compression ratio (', size, 'b vs', dataSize, 'b)')
        assert(size < dataSize, 'on-disk size (' + size + ') is less than data size (' + dataSize + ')')
        done()
      })
    }

buster.testCase('Compression', {
    'setUp': common.readStreamSetUp

  , 'tearDown': common.commonTearDown

  , 'test data is compressed by default (db.put())': function (done) {
      this.openTestDatabase(function (db) {
        async.forEach(
            Array.apply(null, Array(multiples)).map(function (e, i) {
              return [ i, compressableData ]
            })
          , function (args, callback) {
              db.put.apply(db, args.concat([callback]))
            }
          , delayed(verify.bind(null, db, done), 0.1)
        )
      })
    }

  , '//test data is compressed by default (db.batch())': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(
            Array.apply(null, Array(multiples)).map(function (e, i) {
              return { type: 'put', key: i, value: compressableData }
            })
          , delayed(verify.bind(null, db, done), 0.1)
        )
      })
    }
})