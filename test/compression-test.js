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

  , verify = function(compressed, db, done) {
      du(db._location, function (err, size) {
        refute(err)
        //console.log(Math.round((size / dataSize) * 100) + '% compression ratio (', size, 'b vs', dataSize, 'b)')
        if (compressed)
          assert(size < dataSize, 'on-disk size (' + size + ') is less than data size (' + dataSize + ')')
        else
          assert(size >= dataSize, 'on-disk size (' + size + ') is greater than data size (' + dataSize + ')')
        done()
      })
    }

  , verifyCompressed = verify.bind(null, true)
  , verifyNotCompressed = verify.bind(null, false)

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
          , delayed(verifyCompressed.bind(null, db, done), 0.1)
        )
      })
    }

  , 'test data is not compressed with compression=true on open() (db.put())': function (done) {
      this.openTestDatabase({ createIfMissing: true, errorIfExists: true, compression: false }, function (db) {
        async.forEach(
            Array.apply(null, Array(multiples)).map(function (e, i) {
              return [ i, compressableData ]
            })
          , function (args, callback) {
              db.put.apply(db, args.concat([callback]))
            }
          , delayed(verifyNotCompressed.bind(null, db, done), 0.1)
        )
      })
    }

  , '//test data is compressed by default (db.batch())': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(
            Array.apply(null, Array(multiples)).map(function (e, i) {
              return { type: 'put', key: i, value: compressableData }
            })
          , delayed(verifyCompressed.bind(null, db, done), 0.1)
        )
      })
    }
})