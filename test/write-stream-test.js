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
    'setUp': function (done) {
      common.commonSetUp.call(this, function () {
        this.timeout = 1000

        this.sourceData = []

        for (var i = 0; i < 10; i++) {
          this.sourceData.push({
              type  : 'put'
            , key   : i
            , value : Math.random()
          })
        }

        this.verify = function (ws, db, done, data) {
          if (!data) data = this.sourceData // can pass alternative data array for verification
          assert.isFalse(ws.writable)
          assert.isFalse(ws.readable)
          async.forEach(
              data
            , function (data, callback) {
                db.get(data.key, function (err, value) {
                  refute(err)
                  assert.equals(+value, +data.value, 'WriteStream data #' + data.key + ' has correct value')
                  callback()
                })
              }
            , done
          )
        }

        done()
      }.bind(this))
    }

  , 'tearDown': common.commonTearDown

  //TODO: test various encodings

  , 'test simple WriteStream': function (done) {
      this.openTestDatabase(function (db) {
        var ws = db.createWriteStream()
        ws.on('error', function (err) {
          refute(err)
        })
        ws.on('close', this.verify.bind(this, ws, db, done))
        this.sourceData.forEach(function (d) {
          ws.write(d)
        })
        ws.once('ready', ws.end) // end after it's ready, nextTick makes this work OK
      }.bind(this))
    }

  , 'test WriteStream with async writes': function (done) {
      this.openTestDatabase(function (db) {
        var ws = db.createWriteStream()

        ws.on('error', function (err) {
          refute(err)
        })
        ws.on('close', this.verify.bind(this, ws, db, done))
        async.forEachSeries(
            this.sourceData
          , function (d, callback) {
              // some should batch() and some should put()
              if (d.key % 3) {
                setTimeout(function () {
                  ws.write(d)
                  callback()
                }, 10)
              } else {
                ws.write(d)
                callback()
              }
            }
          , function () {
              ws.end()
            }
        )
      }.bind(this))
    }

  /*
    // exactly the same as previous but should avoid batch() writes
  , 'test WriteStream with async writes and useBatch=false': function (done) {
      this.openTestDatabase(function (db) {
        db.batch = function () {
          Array.prototype.slice.call(arguments).forEach(function (a) {
            if (typeof a == 'function') a('Should not call batch()')
          })
        }

        var ws = db.createWriteStream({ useBatch: false })

        ws.on('error', function (err) {
          refute(err)
        })
        ws.on('close', this.verify.bind(this, ws, db, done))
        async.forEachSeries(
            this.sourceData
          , function (d, callback) {
              if (d.key % 3) {
                setTimeout(function () {
                  ws.write(d)
                  callback()
                }, 10)
              } else {
                ws.write(d)
                callback()
              }
            }
          , function () {
              ws.end()
            }
        )
      }.bind(this))
    }
  */

    // at the moment, destroySoon() is basically just end()
  , 'test destroySoon()': function (done) {
      this.openTestDatabase(function (db) {
        var ws = db.createWriteStream()
        ws.on('error', function (err) {
          refute(err)
        })
        ws.on('close', this.verify.bind(this, ws, db, done))
        this.sourceData.forEach(function (d) {
          ws.write(d)
        })
        ws.once('ready', ws.destroySoon) // end after it's ready, nextTick makes this work OK
      }.bind(this))
    }

  , 'test destroy()': function (done) {
      var verify = function (ws, db) {
        assert.isFalse(ws.writable)
        async.forEach(
            this.sourceData
          , function (data, callback) {
              db.get(data.key, function (err, value) {
                // none of them should exist
                assert(err)
                refute(value)
                callback()
              })
            }
          , done
        )
      }

      this.openTestDatabase(function (db) {
        var ws = db.createWriteStream()
        ws.on('error', function (err) {
          refute(err)
        })
        assert.isTrue(ws.writable)
        assert.isFalse(ws.readable)
        ws.on('close', verify.bind(this, ws, db))
        this.sourceData.forEach(function (d) {
          ws.write(d)
          assert.isTrue(ws.writable)
          assert.isFalse(ws.readable)
        })
        assert.isTrue(ws.writable)
        assert.isFalse(ws.readable)
        ws.once('ready', ws.destroy)
      }.bind(this))
    }

  , 'test json encoding': function (done) {
      var options = { createIfMissing: true, errorIfExists: true, keyEncoding: 'utf8', valueEncoding: 'json' }
        , data = [
              { type: 'put', key: 'aa', value: { a: 'complex', obj: 100 } }
            , { type: 'put', key: 'ab', value: { b: 'foo', bar: [ 1, 2, 3 ] } }
            , { type: 'put', key: 'ac', value: { c: 'w00t', d: { e: [ 0, 10, 20, 30 ], f: 1, g: 'wow' } } }
            , { type: 'put', key: 'ba', value: { a: 'complex', obj: 100 } }
            , { type: 'put', key: 'bb', value: { b: 'foo', bar: [ 1, 2, 3 ] } }
            , { type: 'put', key: 'bc', value: { c: 'w00t', d: { e: [ 0, 10, 20, 30 ], f: 1, g: 'wow' } } }
            , { type: 'put', key: 'ca', value: { a: 'complex', obj: 100 } }
            , { type: 'put', key: 'cb', value: { b: 'foo', bar: [ 1, 2, 3 ] } }
            , { type: 'put', key: 'cc', value: { c: 'w00t', d: { e: [ 0, 10, 20, 30 ], f: 1, g: 'wow' } } }
          ]

      this.openTestDatabase(options, function (db) {
        var ws = db.createWriteStream()
        ws.on('error', function (err) {
          refute(err)
        })
        ws.on('close', this.verify.bind(this, ws, db, done, data))
        data.forEach(function (d) {
          ws.write(d)
        })
        ws.once('ready', ws.end) // end after it's ready, nextTick makes this work OK
      }.bind(this))
    }
})