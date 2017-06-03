const levelup = require(process.argv[2] || '../../')
var crypto = require('crypto')
var srcdb = levelup('/tmp/source.db')

var batch = 10000
var total = 200000

function fillBatch (start, callback) {
  var b = []
  for (var i = start; i < start + batch; i++) {
    b.push({ type: 'put', key: i, value: crypto.randomBytes(100) })
  }
  srcdb.batch(b, callback)
}

function populate (start, callback) {
  if (start > total) { return callback() }
  fillBatch(start, function (err) {
    if (err) throw err
    populate(start + batch, callback)
  })
}

srcdb.on('ready', function () {
  var start = Date.now()

  populate(0, function () {
    var batchTime = Date.now() - start
    console.log('Filled source! Took %sms, reading data now...', batchTime)

    run(function () {
      run(function () {
        run()
      })
    })
  })
})

function run (cb) {
  stream({}, function () {
    stream({ keys: true }, function () {
      stream({ values: true }, function () {
        stream({ keys: true, values: true }, cb)
      })
    })
  })
}

function stream (opts, cb) {
  var start = Date.now()
  srcdb.createReadStream()
    .on('end', function () {
      var copyTime = Date.now() - start
      console.log('Done! Took %sms with %j', copyTime, opts)
      if (cb) cb()
    })
    .on('data', function () {})
}
