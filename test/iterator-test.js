var memdown = require('memdown')
var assert = require('referee').assert
var refute = require('referee').refute
var buster = require('bustermove')
var levelup = require('../lib/levelup')
var common = require('./common')

buster.testCase('iterator', {
  'setUp': common.commonSetUp,
  'tearDown': common.commonTearDown,

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
