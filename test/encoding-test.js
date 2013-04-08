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
          { createIfMissing: true, errorIfExists: true, encoding: 'utf8' }
        , function (db) {
            db.put('foo', 'this {} is [] not : json', function (err) {
              refute(err)
              db.close(function (err) {
                refute(err)
                db = levelup(db.location, { createIfMissing: false, errorIfExists: false, valueEncoding: 'json' })
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

  , 'test safe decode in readStream()': function (done) {
      this.openTestDatabase(
          { createIfMissing: true, errorIfExists: true, encoding: 'utf8' }
        , function (db) {
            db.put('foo', 'this {} is [] not : json', function (err) {
              refute(err)
              db.close(function (err) {
                refute(err)

                var dataSpy  = this.spy()
                  , errorSpy = this.spy()

                db = levelup(db.location, { createIfMissing: false, errorIfExists: false, valueEncoding: 'json' })
                db.readStream()
                  .on('data', dataSpy)
                  .on('error', errorSpy)
                  .on('close', function () {
                    assert.equals(dataSpy.callCount, 0, 'no data')
                    assert.equals(errorSpy.callCount, 1, 'error emitted')
                    assert.equals('EncodingError', errorSpy.getCall(0).args[0].name)
                    db.close(done)
                  })
              }.bind(this))
            }.bind(this))
          }.bind(this)
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
})