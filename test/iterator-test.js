var memdown = require('memdown')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')
var encode = require('encoding-down')
var levelup = require('../lib/levelup')
var common = require('./common')

buster.testCase('iterator', {
  setUp: common.commonSetUp,
  tearDown: common.commonTearDown,

  'test simple iterator': function (done) {
    var db = levelup(memdown())
    this.closeableDatabases.push(db)

    db.put('key', 'value', function (err) {
      refute(err)

      var it = db.iterator({
        keyAsBuffer: false,
        valueAsBuffer: false
      })

      it.next(function (err, key, value) {
        refute(err)

        assert.equals(key, 'key')
        assert.equals(value, 'value')

        it.end(done)
      })
    })
  }
})

buster.testCase('iterator#seek()', {
  setUp: function (done) {
    this.mem = memdown()
    this.mem.open(function () {})
    this.mem.batch([
      { type: 'put', key: '"a"', value: 'a' },
      { type: 'put', key: '"b"', value: 'b' }
    ], function () {})
    this.mem.close(done)
  },
  tearDown: function (done) {
    this.db.close(done)
  },

  'without encoding, without deferred-open': function (done) {
    var db = this.db = levelup(this.mem)

    db.open(function (err) {
      refute(err)

      var it = db.iterator({ keyAsBuffer: false })

      it.seek('"b"')
      it.next(function (err, key, value) {
        refute(err)
        assert.equals(key, '"b"')
        it.end(done)
      })
    })
  },

  'without encoding, with deferred-open': function (done) {
    var db = this.db = levelup(this.mem)
    var it = db.iterator({ keyAsBuffer: false })

    it.seek('"b"')
    it.next(function (err, key, value) {
      refute(err)
      assert.equals(key, '"b"')
      it.end(done)
    })
  },

  'with encoding, with deferred-open': function (done) {
    var db = this.db = levelup(encode(this.mem, { keyEncoding: 'json' }))
    var it = db.iterator()

    it.seek('b')
    it.next(function (err, key, value) {
      refute(err)
      assert.equals(key, 'b')
      it.end(done)
    })
  },

  'with encoding, without deferred-open': function (done) {
    var db = this.db = levelup(encode(this.mem, { keyEncoding: 'json' }))

    db.open(function (err) {
      refute(err)

      var it = db.iterator()

      it.seek('b')
      it.next(function (err, key, value) {
        refute(err)
        assert.equals(key, 'b')
        it.end(done)
      })
    })
  }
})
