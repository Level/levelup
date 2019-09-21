module.exports = function (test, testCommon) {
  test('argument checking', function (t) {
    var db = testCommon.factory()

    t.throws(
      db.get.bind(db),
      /^ReadError: get\(\) requires a key argument$/,
      'no-arg get() throws'
    )

    t.throws(
      db.put.bind(db),
      /^WriteError: put\(\) requires a key argument$/,
      'no-arg put() throws'
    )

    t.throws(
      db.del.bind(db),
      /^WriteError: del\(\) requires a key argument$/,
      'no-arg del() throws'
    )

    t.throws(
      db.batch.bind(db, null, {}),
      /^WriteError: batch\(\) requires an array argument$/,
      'null-arg batch() throws'
    )

    t.throws(
      db.batch.bind(db, {}),
      /^WriteError: batch\(\) requires an array argument$/,
      '1-arg, no array batch() throws'
    )

    db.close(t.end.bind(t))
  })
}
