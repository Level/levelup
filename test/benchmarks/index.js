var Benchmark = require('benchmark')
  , rimraf = require('rimraf')
  , async = require('async')
  , colors = require('colors')
  , levelup = require('../../')
  , benchmarks = require('./benchmarks')
  , dbidx = 0

  , K = function (db, cb) { cb() }

  , makedb = function (cb) {
      levelup('./bench_' + (dbidx++) + '.db', { createIfMissing: true, errorIfExists: true }, function (err, db) {
        if (err) throw err
        cb(db)
      })
    }

  , rmdb = function (db, cb) {
      rimraf(db._location, cb)
    }

  , run = function (name, setup, fn, cb) {
      function exec (db, cb) {
        new Benchmark(name, {
          'defer': true,
          'fn': function  (deferred) {
            fn(db, deferred.resolve.bind(deferred))
          }
        })
        /*.on('cycle', function(event) {
          console.log(String(event.target))
        })*/
        .on('complete', function(event) {
          console.log(String(event.target).green.bold)
          cb()
        })
        .run({ async: true })
      }

      makedb(function (db) {
        setup(db, function () {
          exec(db, rmdb.bind(null, db, cb))
        })
      })
    }

async.forEachSeries(
    Object.keys(benchmarks)
  , function (name, cb) {
      var setup = typeof benchmarks[name] == 'function' ? K : benchmarks[name].setup
        , fn = typeof benchmarks[name] == 'function' ? benchmarks[name] : benchmarks[name].fn

      run(name, setup, fn, cb)
    }
  , function () {
      //console.log('Done!')
    }
)