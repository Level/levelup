/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var buster  = require('buster')
  , assert  = buster.assert
  , levelup = require('../lib/levelup.js')
  , common  = require('./common')

buster.testCase('Idempotent open & close', {
    'call open twice, should emit "open" once': function (done) {
      var location = common.nextLocation()
        , n = 0
        , m = 0
        , db
        , close = function () {
            var closing = this.spy()
            db.on('closing', closing)
            db.on('closed', function () {
              assert.equals(closing.callCount, 1)
              assert.equals(closing.getCall(0).args, [])
              done()
            })

            //close needs to be idempotent too.
            db.close()
            process.nextTick(db.close.bind(db))
          }.bind(this)

      db = levelup(
          location
        , { createIfMissing: true }
        , function () {
            assert.equals(n++, 0, 'callback should fire only once')
            if (n && m)
              close()
          }
      )

      db.on('open', function () {
        assert.equals(m++, 0, 'callback should fire only once')
        if (n && m)
          close()
      })

      db.open()
    }
})
