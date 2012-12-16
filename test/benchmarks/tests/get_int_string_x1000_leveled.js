var setupFn = function (count, db, cb) {
  var batch = db.batch()
  for (var i = 0; i < count; i++)
    batch.put(
        String(i)
      , "It'll be top end no worries stands out like a bushie. It'll be cream no dramas flat out like a rotten. As busy as a slabs bloody built like a stonkered. Get a dog up ya oldies no dramas lets get some bottle-o. Built like a schooner as busy as a big smoke. You little ripper ute my you little ripper dag."
    )

  batch.write(cb)
}

module.exports = require('./get_int_string_x1000_levelup').bind(null) // bind() to make a new function to put .setup on
module.exports.setupFn = setupFn
module.exports.setup = setupFn.bind(null, 1000)