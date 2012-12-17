var fn = function (puts, db, cb) {
  var after = function (err) {
        if (err) throw err
        cb()
      }
    , data = []

  if (this.cycle == null) this.cycle = 0
  else this.cycle++

  for (var i = 0; i < puts; i++)
    data.push({
            type: 'put'
          , key: this.cycle * puts + i
          , value: "It'll be top end no worries stands out like a bushie. It'll be cream no dramas flat out like a rotten. As busy as a slabs bloody built like a stonkered. Get a dog up ya oldies no dramas lets get some bottle-o. Built like a schooner as busy as a big smoke. You little ripper ute my you little ripper dag."
        })
  db.batch(data, after)
}

module.exports = fn.bind(null, 1000)
module.exports.fn = fn