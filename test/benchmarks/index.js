const DB_ROOT = __dirname
const path = require('path')
const Benchmark = require('benchmark')
const rimraf = require('rimraf')
const async = require('async')
const engines = require('./engines/')
let tests = require('./tests/')

let dbidx = 0

const printableEngineName = function (engineName) {
  const len = Object.keys(engines).reduce(function (m, c) { return Math.max(c.length, m) }, 0)
  while (engineName.length < len) engineName += ' '
  return engineName
}

const mklocation = function () {
  return path.join(DB_ROOT, '_benchdb_' + dbidx++)
}

const mkdb = function (engine, location, callback) {
  rimraf(location, engine.createDb.bind(null, location, callback))
}

const rmdb = function (engine, db, location, callback) {
  engine.closeDb(db, rimraf.bind(null, location, callback))
}

const run = function (db, name, fn, color, cb) {
  const exec = function () {
    new Benchmark(name, {
      defer: true,
      fn: function (deferred) {
        fn(db, deferred.resolve.bind(deferred))
      }
    })
      .on('complete', function (event) {
        console.log(String(event.target)[color].bold)
        cb()
      })
      .run({ async: true })
  }

  if (fn.setup) {
    fn.setup(db, function (err) {
      if (err) return cb(err)
      exec()
    })
  } else { exec() }
}

const runTest = function (testName, callback) {
  async.forEachSeries(
    Object.keys(engines), function (engineKey, callback) {
      const engine = engines[engineKey]
      const location = mklocation()
      mkdb(engine, location, function (err, db) {
        if (err) return callback(err)
        if (!tests[testName][engineKey]) { console.log('Skipping for', testName, engineKey); return callback() }
        run(db,
          printableEngineName(engineKey) + ' ' + testName,
          tests[testName][engineKey],
          engine.color, function (err) {
            rmdb(engine, db, location, function (_err) {
              callback(err || _err)
            })
          })
      })
    }, function (err) {
      if (err) throw err
      console.log()
      callback.apply(null, arguments)
    }
  )
}

const focusKey = Object.keys(tests).filter(function (k) { return (/=>/).test(k) })

if (focusKey.length) {
  const focusTest = tests[focusKey[0]]
  tests = {}
  tests[focusKey[0]] = focusTest
}

require('colors')
async.forEachSeries(Object.keys(tests), runTest)
