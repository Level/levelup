/*
 * `exports` is a map of benchmark name to benchmark function:
 *    'name': function (database, callback) { callback() }
 * If a benchmark needs a setup function then it should take the form:
 *    'name': {
 *        'setup': function (database, callback) { callback() }
 *      , 'fn': function (database, callback) { callback() }
 *    }
 *
 * The setup function and the benchmark function both receive a new and empty
 * instance of LevelUP which will be deleted after the benchmark is executed.
 *
 * The setup function will only be run once but the benchmark function will
 * be run multiple times to get a good sample. You can store values on `this`
 * across separate cycles so use it to avoid conflicts in `put()` for example.
 */

module.exports = {

    // Simple put() operation, 1000 objects at a time

    'LevelUP#put(int, string) x 1000': function (db, cb) {
      var puts = 1000
        , received = 0
        , after = function (err) {
            if (err) throw err
            if (++received == puts) cb()
          }

      if (this.cycle == null) this.cycle = 0
      else this.cycle++

      for (var i = 0; i < puts; i++)
        db.put(
            this.cycle * puts + i
          , "It'll be top end no worries stands out like a bushie. It'll be cream no dramas flat out like a rotten. As busy as a slabs bloody built like a stonkered. Get a dog up ya oldies no dramas lets get some bottle-o. Built like a schooner as busy as a big smoke. You little ripper ute my you little ripper dag."
          , after
        )
    }

    // Simple put() operation, 100,000 objects at a time

  , 'LevelUP#put(int, string) x 100,000': function (db, cb) {
      var puts = 100000
        , received = 0
        , after = function (err) {
            if (err) throw err
            if (++received == puts) cb()
          }

      if (this.cycle == null) this.cycle = 0
      else this.cycle++

      for (var i = 0; i < puts; i++)
        db.put(
            this.cycle * puts + i
          , "It'll be top end no worries stands out like a bushie. It'll be cream no dramas flat out like a rotten. As busy as a slabs bloody built like a stonkered. Get a dog up ya oldies no dramas lets get some bottle-o. Built like a schooner as busy as a big smoke. You little ripper ute my you little ripper dag."
          , after
        )
    }

    // Single put as batch() operation, 1000 objects at a time

  , 'LevelUP#batch({put, int, string}) x 1000': function (db, cb) {
      var puts = 1000
        , received = 0
        , after = function (err) {
            if (err) throw err
            if (++received == puts) cb()
          }

      if (this.cycle == null) this.cycle = 0
      else this.cycle++

      for (var i = 0; i < puts; i++)
        db.batch(
            [{
                type: 'put'
              , key: this.cycle * puts + i
              , value: "It'll be top end no worries stands out like a bushie. It'll be cream no dramas flat out like a rotten. As busy as a slabs bloody built like a stonkered. Get a dog up ya oldies no dramas lets get some bottle-o. Built like a schooner as busy as a big smoke. You little ripper ute my you little ripper dag."
            }]
          , after
        )
    }

    // Single put as batch() operation, 1000 objects at a time

  , 'LevelUP#batch({put, int, string}) x 100,000': function (db, cb) {
      var puts = 100000
        , received = 0
        , after = function (err) {
            if (err) throw err
            if (++received == puts) cb()
          }

      if (this.cycle == null) this.cycle = 0
      else this.cycle++

      for (var i = 0; i < puts; i++)
        db.batch(
            [{
                type: 'put'
              , key: this.cycle * puts + i
              , value: "It'll be top end no worries stands out like a bushie. It'll be cream no dramas flat out like a rotten. As busy as a slabs bloody built like a stonkered. Get a dog up ya oldies no dramas lets get some bottle-o. Built like a schooner as busy as a big smoke. You little ripper ute my you little ripper dag."
            }]
          , after
        )
    }

  , 'LevelUP#get(int) x 1000': {
        'setup': function (db, cb) {
          var count = 1000
            , data = []

          for (var i = 0; i < count; i++)
            data.push({
                type: 'put'
              , key: i
              , value: "It'll be top end no worries stands out like a bushie. It'll be cream no dramas flat out like a rotten. As busy as a slabs bloody built like a stonkered. Get a dog up ya oldies no dramas lets get some bottle-o. Built like a schooner as busy as a big smoke. You little ripper ute my you little ripper dag."
            })

          db.batch(data, cb)
        }

      , 'fn': function (db, cb) {
          var count = 1000
            , received = 0
            , after = function (err) {
                if (err) throw err
                if (++received == count) cb()
              }

          for (var i = 0; i < count; i++)
            db.get(i, after)
        }
    }
}