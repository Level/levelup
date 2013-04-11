/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var errors  = require('../lib/errors.js')
  , async   = require('async')
  , common  = require('./common')

  , assert  = require('referee').assert
  , refute  = require('referee').refute
  , buster  = require('bustermove')

buster.testCase('batch()', {
    'setUp': common.commonSetUp
  , 'tearDown': common.commonTearDown

  , 'batch() with multiple puts': function (done) {
      this.openTestDatabase(function (db) {
        db.batch(
            [
                { type: 'put', key: 'foo', value: 'afoovalue' }
              , { type: 'put', key: 'bar', value: 'abarvalue' }
              , { type: 'put', key: 'baz', value: 'abazvalue' }
            ]
          , function (err) {
              refute(err)
              async.forEach(
                  ['foo', 'bar', 'baz']
                , function (key, callback) {
                    db.get(key, function (err, value) {
                      refute(err)
                      assert.equals(value, 'a' + key + 'value')
                      callback()
                    })
                  }
                , done
              )
            }
        )
      })
    }

  , 'batch() with multiple puts and deletes': function (done) {
      this.openTestDatabase(function (db) {
        async.series(
            [
                function (callback) {
                  db.batch(
                      [
                          { type: 'put', key: '1', value: 'one' }
                        , { type: 'put', key: '2', value: 'two' }
                        , { type: 'put', key: '3', value: 'three' }
                      ]
                    , callback
                  )
                }
              , function (callback) {
                  db.batch(
                      [
                          { type: 'put', key: 'foo', value: 'afoovalue' }
                        , { type: 'del', key: '1' }
                        , { type: 'put', key: 'bar', value: 'abarvalue' }
                        , { type: 'del', key: 'foo' }
                        , { type: 'put', key: 'baz', value: 'abazvalue' }
                      ]
                    , callback
                  )
                }
              , function (callback) {
                  // these should exist
                  async.forEach(
                      ['2', '3', 'bar', 'baz']
                    , function (key, callback) {
                        db.get(key, function (err, value) {
                          refute(err)
                          refute.isNull(value)
                          callback()
                        })
                      }
                    , callback
                  )
                }
              , function (callback) {
                  // these shouldn't exist
                  async.forEach(
                      ['1', 'foo']
                    , function (key, callback) {
                        db.get(key, function (err, value) {
                          assert(err)
                          assert.isInstanceOf(err, errors.NotFoundError)
                          refute(value)
                          callback()
                        })
                      }
                    , callback
                  )
                }
            ]
          , done
        )
      })
    }

  , 'batch() with can manipulate data from put()': function (done) {
      // checks encoding and whatnot
      this.openTestDatabase(function (db) {
        async.series(
            [
                db.put.bind(db, '1', 'one')
              , db.put.bind(db, '2', 'two')
              , db.put.bind(db, '3', 'three')
              , function (callback) {
                  db.batch(
                      [
                          { type: 'put', key: 'foo', value: 'afoovalue' }
                        , { type: 'del', key: '1' }
                        , { type: 'put', key: 'bar', value: 'abarvalue' }
                        , { type: 'del', key: 'foo' }
                        , { type: 'put', key: 'baz', value: 'abazvalue' }
                      ]
                    , callback
                  )
                }
              , function (callback) {
                  // these should exist
                  async.forEach(
                      ['2', '3', 'bar', 'baz']
                    , function (key, callback) {
                        db.get(key, function (err, value) {
                          refute(err)
                          refute.isNull(value)
                          callback()
                        })
                      }
                    , callback
                  )
                }
              , function (callback) {
                  // these shouldn't exist
                  async.forEach(
                      ['1', 'foo']
                    , function (key, callback) {
                        db.get(key, function (err, value) {
                          assert(err)
                          assert.isInstanceOf(err, errors.NotFoundError)
                          refute(value)
                          callback()
                        })
                      }
                    , callback
                  )
                }
            ]
          , done
        )
      })
    }

  , 'batch() data can be read with get() and del()': function (done) {
      this.openTestDatabase(function (db) {
        async.series(
            [
                function (callback) {
                  db.batch(
                      [
                          { type: 'put', key: '1', value: 'one' }
                        , { type: 'put', key: '2', value: 'two' }
                        , { type: 'put', key: '3', value: 'three' }
                      ]
                    , callback
                  )
                }
              , db.del.bind(db, '1', 'one')
              , function (callback) {
                  // these should exist
                  async.forEach(
                      ['2', '3']
                    , function (key, callback) {
                        db.get(key, function (err, value) {
                          refute(err)
                          refute.isNull(value)
                          callback()
                        })
                      }
                    , callback
                  )
                }
              , function (callback) {
                  // this shouldn't exist
                  db.get('1', function (err, value) {
                    assert(err)
                    assert.isInstanceOf(err, errors.NotFoundError)
                    refute(value)
                    callback()
                  })
                }
            ]
          , done
        )
      })
    }
})