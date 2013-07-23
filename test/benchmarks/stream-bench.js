const levelup = require('../../')
    , crypto  = require('crypto')
    , srcdb   = levelup('/tmp/source.db')
    , dstdb   = levelup('/tmp/destination.db')

    , batch   = 10000
    , total   = 200000

function fillBatch (start, callback) {
  var b = []
  for (var i = start; i < start + batch; i++) {
    b.push({ type: 'put', key: i, value: crypto.randomBytes(100) })
  }
  srcdb.batch(b, callback)
}

function populate (start, callback) {
  if (start > total)
    return callback()
  fillBatch(start, function (err) {
    if (err) throw err
    populate(start + batch, callback)
  })
}

srcdb.on('ready', function () {
  var start = Date.now()

  populate(0, function () {
    var batchTime = Date.now() - start
    var readTime

    console.log('--------------------------------------------------------------')
    console.log('Filled source! Took', batchTime + 'ms, streaming to destination...')

    var ws = dstdb.createWriteStream()
    ws.once('close', function () {
      var copyTime = Date.now() - start
      console.log('Done! Took', copyTime + 'ms,', Math.round((copyTime / batchTime) * 100) + '% of batch time')
    })

    start = Date.now()
    var rs = srcdb.createReadStream()
    rs.once('end', function () {
      readTime = Date.now() - start
      console.log('Read finished! Took %dms', readTime)
    })
    rs.pipe(ws)
  })
})
