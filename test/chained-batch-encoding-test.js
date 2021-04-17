'use strict'

const concatIterator = require('level-concat-iterator')
const discardable = require('./util/discardable')

module.exports = function (test, testCommon) {
  test('chained batch with per-operation options', function (t) {
    discardable(t, testCommon, function (db, done) {
      let ops

      db.once('batch', function (o) {
        ops = o
      })

      db.batch()
        .put('a', 'a', { valueEncoding: 'json' })
        .put('b', 'b')
        .put('"c"', 'c')
        .del('c', { keyEncoding: 'json', arbitraryOption: true })
        .write(function (err) {
          t.ifError(err, 'no write error')

          t.same(ops, [
            { type: 'put', key: 'a', value: 'a', valueEncoding: 'json' },
            { type: 'put', key: 'b', value: 'b' },
            { type: 'put', key: '"c"', value: 'c' },
            { type: 'del', key: 'c', keyEncoding: 'json', arbitraryOption: true }
          ])

          concatIterator(db.iterator(), function (err, entries) {
            t.ifError(err)
            t.same(entries, [
              { key: 'a', value: '"a"' },
              { key: 'b', value: 'b' }
            ])
            done()
          })
        })
    })
  })
}
