var buster  = require('buster')
    , assert  = buster.assert
    , levelup = require('../lib/levelup')
    , common  = require('./common')

buster.testCase('put hook', {
    'setUp': common.commonSetUp
  , 'tearDown': common.commonTearDown

  , 'hook(put)': function (done) {
      function handler(key, value, array) {
        array.push({ type: "del", key: key })
      }

      var location = common.nextLocation()
        , db = levelup(location, {
          createIfMissing: true
        })

      assert(db.hook)
      assert(db.removeHook)

      db.hook("put", handler)

      db.put("42", "winning", function (err) {
        db.get("42", function (err, value) {
          assert.equals(value, undefined)
          db.removeHook("put", handler)
          done()
        })
      })
    }

  , 'hook(del)': function (done) {
      function handler(key, array) {
        array.push({ type: "put", key: key, value: "winning" })
      }

      var location = common.nextLocation()
        , db = levelup(location, {
          createIfMissing: true
        })

      db.hook("del", handler)

      db.del("42", function (err) {
        db.get("42", function (err, value) {
          assert.equals(value, "winning")
          db.removeHook("del", handler)
          done()
        })
      })
    }
})
