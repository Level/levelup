var async = require('async')

  , setupFn = function (count, db, cb) {
      var queue = async.queue(function (key, callback) {
        db.exec(
            'INSERT INTO bench VALUES('
          + key
          + ', "It\'ll be top end no worries stands out like a bushie. It\'ll be cream no dramas flat out like a rotten. As busy as a slabs bloody built like a stonkered. Get a dog up ya oldies no dramas lets get some bottle-o. Built like a schooner as busy as a big smoke. You little ripper ute my you little ripper dag."'
          + ')'
          , callback
        )
      }, 20)
      queue.drain = cb
      for (var i = 0; i < count; i++)
        queue.push(String(i))
    }

  , fn = function (count, db, cb) {
      var received = 0
        , after = function (err) {
            if (err) throw err
            if (++received == count) cb()
          }

      for (var i = 0; i < count; i++)
        db.get('SELECT value FROM bench WHERE key = "' + i + '"', after)
    }


module.exports = fn.bind(null, 1000)
module.exports.fn = fn
module.exports.setup = setupFn.bind(null, 1000)
module.exports.setupFn = setupFn