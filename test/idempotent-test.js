var levelup = require('../lib/levelup.js')
var memdown = require('memdown')
var common = require('./common')
var assert = require('referee').assert
var buster = require('bustermove')

buster.testCase('Idempotent open & close', {
  'setUp': common.readStreamSetUp,

  'tearDown': common.commonTearDown,

  'call open twice, should emit "open" once': function (done) {
    var n = 0
    var m = 0
    var db
    var close = function () {
      var closing = this.spy()
      db.on('closing', closing)
      db.on('closed', function () {
        assert.equals(closing.callCount, 1)
        assert.equals(closing.getCall(0).args, [])
        done()
      })

      // close needs to be idempotent too.
      db.close()
      process.nextTick(db.close.bind(db))
    }.bind(this)

    db = levelup(memdown(), function () {
      assert.equals(n++, 0, 'callback should fire only once')
      if (n && m) { close() }
    })

    db.on('open', function () {
      assert.equals(m++, 0, 'callback should fire only once')
      if (n && m) { close() }
    })

    db.open()
  }
})
