const levelup = require('../lib/levelup.js')
const nextTick = require('../lib/next-tick')
const memdown = require('memdown')
const sinon = require('sinon')

module.exports = function (test, testCommon) {
  test('call open twice, should emit "open" once', function (t) {
    let n = 0
    let m = 0

    const close = function () {
      const closing = sinon.spy()
      db.on('closing', closing)
      db.on('closed', function () {
        t.is(closing.callCount, 1)
        t.same(closing.getCall(0).args, [])
        t.end()
      })

      // close needs to be idempotent too.
      db.close()
      nextTick(db.close.bind(db))
    }

    const db = levelup(memdown(), function () {
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
