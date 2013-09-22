/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var levelup = require('../lib/levelup.js')
  , common  = require('./common')
  , assert  = require('referee').assert
  , refute  = require('referee').refute
  , buster  = require('bustermove')

buster.testCase('Encoding', {
    'setUp': common.readStreamSetUp

  , 'tearDown': common.commonTearDown

  , 'test safe decode in get()': function (done) {
      this.openTestDatabase(
          { createIfMissing: true, errorIfExists: true, encoding: 'utf8', keyEncoding:'typewise' }
        , function (db) {
            db.put('foo', 'this {} is [] not : json', function (err) {
              refute(err)
              db.close(function (err) {
                refute(err)
                db = levelup(db.location, { createIfMissing: false, errorIfExists: false, valueEncoding: 'json', keyEncoding:'typewise' })
                db.get('foo', function (err, value) {
                  assert(err)
                  assert.equals('EncodingError', err.name)
                  refute(value)
                  db.close(done)
                })
              })
            })
          }
      )
    }

  , 'test encoding = valueEncoding': function (done) {
      // write a value as JSON, read as utf8 and check
      // the fact that we can get with keyEncoding of utf8 should demonstrate that
      // the key is not encoded as JSON
      this.openTestDatabase({ encoding: 'json' }, function (db) {
        db.put('foo:foo', { bar: 'bar' }, function (err) {
          refute(err)
          db.get('foo:foo', { keyEncoding: 'utf8', valueEncoding: 'utf8' }, function (err, value) {
            refute(err)
            assert.equals(value, '{"bar":"bar"}')
            db.close(done)
          })
        })
      })
    }
  , 'test write-stream encoding': function (done) {
      this.openTestDatabase({ encoding: 'json' }, function (db) {
        var ws = db.createWriteStream({
          keyEncoding : 'typewise',
          valueEncoding : 'binary'
        })
        ws.on('close', function () {
          db.get(["asdf"], {
            keyEncoding : 'typewise',
            valueEncoding : 'binary'
          }, function (err, val) {
            refute(err)
            assert.equals(val.toString(), '\u0001\u0002\u0003')
            db.close(done)
          })
        })
        ws.write({ key : ["asdf"], value : new Buffer([1, 2, 3]) })
        ws.end()
      })
    }
  , 'test batch op encoding': function (done) {
      this.openTestDatabase({ encoding: 'json' }, function (db) {
        db.batch([
            {
              type : 'put',
              key : [1,2,3,{}, 'asdf'],
              value : new Buffer([4, 5, 6]),
              keyEncoding : 'typewise',
              valueEncoding : 'binary'
            }
          , {
              type : 'put',
              key : [1,2,3,{}, 'asdf', 5],
              keyEncoding : 'typewise',
              value : 'string'
            }
        ], { keyEncoding : 'typewise', valueEncoding : 'utf8' },
        function (err) {
          refute(err)
          db.get([1,2,3,{}, 'asdf'], {
            keyEncoding : 'typewise',
            valueEncoding : 'binary'
          }, function (err, val) {
            refute(err)
            assert.equals(val.toString(), '\u0004\u0005\u0006')

            db.get([1,2,3,{},'asdf', 5], { keyEncoding:'typewise', valueEncoding : 'utf8' }, function (err, val) {
              refute(err)
              assert.equals(val, 'string')
              db.close(done)
            })
          })
        })
      })
    }
})
