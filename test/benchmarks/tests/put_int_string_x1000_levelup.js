var fn = function (puts, db, cb) {
  var received = 0
    , after = function (err) {
        if (err) throw err
        if (++received == puts) cb()
      }

  if (this.cycle == null) this.cycle = 0
  else this.cycle++

  for (var i = 0; i < puts; i++)
    db.put(
        String(this.cycle * puts + i)
      , "It'll be top end no worries stands out like a bushie. It'll be cream no dramas flat out like a rotten. As busy as a slabs bloody built like a stonkered. Get a dog up ya oldies no dramas lets get some bottle-o. Built like a schooner as busy as a big smoke. You little ripper ute my you little ripper dag."
      , after
    )
}

module.exports = fn.bind(null, 1000)
module.exports.fn = fn