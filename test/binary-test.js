var each = require('async-each')
var discardable = require('./util/discardable')

module.exports = function (test, testCommon) {
  test('test put() and get() with binary value {valueEncoding:binary}', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put('binarydata', testBuffer(), { valueEncoding: 'binary' }, function (err) {
        t.ifError(err)
        db.get('binarydata', { valueEncoding: 'binary' }, function (err, value) {
          t.ifError(err)
          t.ok(value)
          t.ok(value.equals(testBuffer()))
          done()
        })
      })
    })
  })

  test('test put() and get() with binary value {valueEncoding:binary} in factory', function (t) {
    discardable(t, testCommon, { valueEncoding: 'binary' }, function (db, done) {
      db.put('binarydata', testBuffer(), function (err) {
        t.ifError(err)
        db.get('binarydata', function (err, value) {
          t.ifError(err)
          t.ok(value)
          t.ok(value.equals(testBuffer()))
          done()
        })
      })
    })
  })

  testCommon.bufferKeys && test('test put() and get() with binary key {valueEncoding:binary}', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put(testBuffer(), 'binarydata', { valueEncoding: 'binary' }, function (err) {
        t.ifError(err)
        db.get(testBuffer(), { valueEncoding: 'binary' }, function (err, value) {
          t.ifError(err)
          t.ok(value instanceof Buffer, 'value is buffer')
          t.is(value.toString(), 'binarydata')
          done()
        })
      })
    })
  })

  test('test put() and get() with binary value {keyEncoding:utf8,valueEncoding:binary}', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put('binarydata', testBuffer(), { keyEncoding: 'utf8', valueEncoding: 'binary' }, function (err) {
        t.ifError(err)
        db.get('binarydata', { keyEncoding: 'utf8', valueEncoding: 'binary' }, function (err, value) {
          t.ifError(err)
          t.ok(value)
          t.ok(value.equals(testBuffer()))
          done()
        })
      })
    })
  })

  test('test put() and get() with binary value {keyEncoding:utf8,valueEncoding:binary} in factory', function (t) {
    discardable(t, testCommon, { keyEncoding: 'utf8', valueEncoding: 'binary' }, function (db, done) {
      db.put('binarydata', testBuffer(), function (err) {
        t.ifError(err)
        db.get('binarydata', function (err, value) {
          t.ifError(err)
          t.ok(value)
          t.ok(value.equals(testBuffer()))
          done()
        })
      })
    })
  })

  testCommon.bufferKeys && test('test put() and get() with binary key {keyEncoding:binary,valueEncoding:utf8}', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put(testBuffer(), 'binarydata', { keyEncoding: 'binary', valueEncoding: 'utf8' }, function (err) {
        t.ifError(err)
        db.get(testBuffer(), { keyEncoding: 'binary', valueEncoding: 'utf8' }, function (err, value) {
          t.ifError(err)
          t.is(value, 'binarydata')
          done()
        })
      })
    })
  })

  testCommon.bufferKeys && test('test put() and get() with binary key & value {valueEncoding:binary}', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put(testBuffer(), testBuffer(), { valueEncoding: 'binary' }, function (err) {
        t.ifError(err)
        db.get(testBuffer(), { valueEncoding: 'binary' }, function (err, value) {
          t.ifError(err)
          t.ok(value.equals(testBuffer()))
          done()
        })
      })
    })
  })

  testCommon.bufferKeys && test('test put() and del() and get() with binary key {valueEncoding:binary}', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.put(testBuffer(), 'binarydata', { valueEncoding: 'binary' }, function (err) {
        t.ifError(err)
        db.del(testBuffer(), { valueEncoding: 'binary' }, function (err) {
          t.ifError(err)
          db.get(testBuffer(), { valueEncoding: 'binary' }, function (err, value) {
            t.ok(err)
            t.notOk(value)
            done()
          })
        })
      })
    })
  })

  test('batch() with multiple puts', function (t) {
    discardable(t, testCommon, function (db, done) {
      db.batch([
        { type: 'put', key: 'foo', value: testBuffer() },
        { type: 'put', key: 'bar', value: testBuffer() },
        { type: 'put', key: 'baz', value: 'abazvalue' }
      ], { keyEncoding: 'utf8', valueEncoding: 'binary' }, function (err) {
        t.ifError(err)
        each(['foo', 'bar', 'baz'], function (key, next) {
          db.get(key, { valueEncoding: 'binary' }, function (err, value) {
            t.ifError(err)
            if (key === 'baz') {
              t.ok(value instanceof Buffer, 'value is buffer')
              t.is(value.toString(), 'a' + key + 'value')
              next()
            } else {
              t.ok(value.equals(testBuffer()))
              next()
            }
          })
        }, done)
      })
    })
  })
}

function testBuffer () {
  return Buffer.from('0080c0ff', 'hex')
}
