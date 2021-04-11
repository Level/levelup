const levelup = require(process.argv[2] || '../../')
const crypto = require('crypto')
const srcdb = levelup('/tmp/source.db')

const batch = 10000
const total = 200000

function fillBatch (start, callback) {
  const b = []
  for (let i = start; i < start + batch; i++) {
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
  const start = Date.now()

  populate(0, function () {
    const batchTime = Date.now() - start
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
  const start = Date.now()
  srcdb.createReadStream()
    .on('end', function () {
      const copyTime = Date.now() - start
      console.log('Done! Took %sms with %j', copyTime, opts)
      if (cb) cb()
    })
    .on('data', function () {})
}
