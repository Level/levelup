/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var async   = require('async')
  , common  = require('./common')

  , assert  = require('referee').assert
  , refute  = require('referee').refute
  , buster  = require('bustermove')

buster.testCase('WriteStream', {
    'setUp': common.commonSetUp

  , 'tearDown': common.commonTearDown

  //TODO: test various encodings

  , 'test simple write': function (done) {
      var self = this
      this.openTestDatabase(function (db1) {
        self.openTestDatabase(function (db2) {
          db1.pipe(db2)
          db1.put('test1', 'test', function (e) {
            if (e) throw e
            setTimeout(function () {
              db2.get('test1', function (e, val) {
                assert.equals(val, 'test')
                done()
              })
            }, 100)
          })
        })
      }.bind(this))
    }
  , 'test simple delete': function (done) {
      var self = this
      this.openTestDatabase(function (db1) {
        self.openTestDatabase(function (db2) {
          db1.pipe(db2)
          db1.put('test2', 'test', function (e) {
            if (e) throw e
            setTimeout(function () {
              db2.get('test2', function (e, val) {
                assert.equals(val, 'test')
                db1.del('test2', function (e) {
                  setTimeout(function () {
                    db2.get('test2', function (e, val) {
                      assert.defined(e)
                      assert.equals(val, undefined)
                      done()
                    })
                  }, 100)
                })
              })
            }, 100)
          })
        })
      }.bind(this))
    }

})
