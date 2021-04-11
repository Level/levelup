const setupFn = function (count, db, cb) {
  const data = []

  for (let i = 0; i < count; i++) {
    data.push({
      type: 'put',
      key: String(i),
      value: 'It\'ll be top end no worries stands out like a bushie. It\'ll be cream no dramas flat out like a rotten. As busy as a slabs bloody built like a stonkered. Get a dog up ya oldies no dramas lets get some bottle-o. Built like a schooner as busy as a big smoke. You little ripper ute my you little ripper dag.'
    })
  }

  db.batch(data, cb)
}

const fn = function (count, db, cb) {
  let received = 0
  const after = function (err) {
    if (err) throw err
    if (++received === count) cb()
  }
  for (let i = 0; i < count; i++) { db.get(String(i), after) }
}

module.exports = fn.bind(null, 1000)
module.exports.fn = fn
module.exports.setup = setupFn.bind(null, 1000)
module.exports.setupFn = setupFn
