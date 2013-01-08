/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var buster  = require('buster')
  , assert  = buster.assert
  , levelup = require('../lib/levelup.js')
  , errors  = require('../lib/errors.js')
  , async   = require('async')
  , fs      = require('fs')
  , common  = require('./common')

buster.testCase('idempotent open & close', {
  'call open twice, should emit "open" once': function (done) {
      var location = common.nextLocation()
      var n = 0, m = 0
      var db = levelup(location, { createIfMissing: true }, function (err, db) {
        //callback should fire only once.
        assert.equals(n++, 0)
        if(n && m) close()
        })

      db.on('open', function () {
        console.log('emit open')
        assert.equals(m++, 0)
        if(n && m) close()    
      })

      db.open()

      //this will only be called once.
      function close () {
        var closing = false
        db.on('closing', function () {
          closing = true
        })
        db.on('closed', function () {
          assert.equals(closing, true)
          done()
        })

        //close needs to be idempotent too.
        db.close()

        process.nextTick(function () {
          db.close()
        })
      }
    }
})
