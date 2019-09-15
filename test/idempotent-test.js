var levelup = require('../lib/levelup.js')
var memdown = require('memdown')
var sinon = require('sinon')

module.exports = function (test, testCommon) {
  test('call open twice, should emit "open" once', function (t) {
    var n = 0
    var m = 0
    var db
    var close = function () {
      var closing = sinon.spy()
      db.on('closing', closing)
      db.on('closed', function () {
        t.is(closing.callCount, 1)
        t.same(closing.getCall(0).args, [])
        t.end()
      })

      // close needs to be idempotent too.
      db.close()
      process.nextTick(db.close.bind(db))
    }

    db = levelup(memdown(), function () {
      t.is(n++, 0, 'callback should fire only once')
      if (n && m) { close() }
    })

    db.on('open', function () {
      t.is(m++, 0, 'callback should fire only once')
      if (n && m) { close() }
    })

    db.open()
  })
}
