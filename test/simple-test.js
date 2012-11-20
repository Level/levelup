/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var buster  = require('buster')
  , assert  = buster.assert
  , levelup = require('../lib/levelup.js')
  , errors  = require('../lib/errors.js')
  , async   = require('async')
  , fs      = require('fs')
  , common  = require('./common')

buster.testCase('Basic API', {
    'setUp': common.commonSetUp
  , 'tearDown': common.commonTearDown

  , 'levelup()': function () {
      assert.isFunction(levelup)
      assert.equals(levelup.length, 3) // location, options & callback arguments
      assert.exception(levelup, 'InitializationError') // no location
    }

  , 'default options': function (done) {
      var location = common.nextLocation()
      levelup(location, { createIfMissing: true, errorIfExists: true }, function (err, db) {
        assert.isTrue(db.isOpen())
        this.closeableDatabases.push(db)
        this.cleanupDirs.push(location)
        db.close(function (err) {
          refute(err)

          assert.isFalse(db.isOpen())

          levelup(location, function (err, db) { // no options object
            refute(err)
            assert.isObject(db)
            assert.isFalse(db._options.createIfMissing)
            assert.isFalse(db._options.errorIfExists)
            assert.equals(db._location, location)

            /*
            // read-only properties
            db.location = 'foo'
            assert.equals(db.location, location)
            */
            done()
          }.bind(this))
        }.bind(this))
      }.bind(this))
    }

  , 'basic options': function (done) {
      var location = common.nextLocation()
      levelup(location, { createIfMissing: true, errorIfExists: true }, function (err, db) {
        refute(err)

        this.closeableDatabases.push(db)
        this.cleanupDirs.push(location)
        assert.isObject(db)
        assert.isTrue(db._options.createIfMissing)
        assert.isTrue(db._options.errorIfExists)
        assert.equals(db._location, location)

        /*
        // read-only properties
        db._location = 'bar'
        assert.equals(db._location, location)
        */
        done()
      }.bind(this))
    }

  , 'without callback': function (done) {
      var location = common.nextLocation()
      var db = levelup(location, { createIfMissing: true, errorIfExists: true })

      this.closeableDatabases.push(db)
      this.cleanupDirs.push(location)
      assert.isObject(db)
      assert.isTrue(db._options.createIfMissing)
      assert.isTrue(db._options.errorIfExists)
      assert.equals(db._location, location)

      db.on("ready", function () {
        assert.isTrue(db.isOpen())
        done()
      })
    }

  , 'open() with !createIfMissing expects error': function (done) {
      levelup(this.cleanupDirs[0] = common.nextLocation(), function (err, db) {
        assert(err)
        refute(db)
        assert.isInstanceOf(err, Error)
        assert.isInstanceOf(err, errors.LevelUPError)
        assert.isInstanceOf(err, errors.OpenError)
        done()
      }.bind(this))
    }

  , 'open() with createIfMissing expects directory to be created': function (done) {
      levelup(this.cleanupDirs[0] = common.nextLocation(), { createIfMissing: true }, function (err, db) {
        this.closeableDatabases.push(db)
        refute(err)
        assert.isTrue(db.isOpen())
        fs.stat(this.cleanupDirs[0], function (err, stat) {
          refute(err)
          assert(stat.isDirectory())
          done()
        })
      }.bind(this))
    }

  , 'open() with errorIfExists expects error if exists': function (done) {
      levelup(this.cleanupDirs[0] = common.nextLocation(), { createIfMissing: true }, function (err, db) {
        this.closeableDatabases.push(db)
        refute(err) // sanity
        levelup(this.cleanupDirs[0], { errorIfExists   : true }, function (err) {
          assert(err)
          assert.isInstanceOf(err, Error)
          assert.isInstanceOf(err, errors.LevelUPError)
          assert.isInstanceOf(err, errors.OpenError)
          done()
        })
      }.bind(this))
    }

  , 'open() with !errorIfExists does not expect error if exists': function (done) {
      levelup(this.cleanupDirs[0] = common.nextLocation(), { createIfMissing: true }, function (err, db) {
        refute(err) // sanity
        this.closeableDatabases.push(db)
        assert.isTrue(db.isOpen())

        db.close(function () {
          assert.isFalse(db.isOpen())

          levelup(this.cleanupDirs[0], { errorIfExists   : false }, function (err, db) {
            refute(err)
            this.closeableDatabases.push(db)
            assert.isTrue(db.isOpen())
            done()
          }.bind(this))
        }.bind(this))
      }.bind(this))
    }

  , 'Simple operations': {

      'get() on empty database causes error': function (done) {
          this.openTestDatabase(function (db) {
            db.get('undefkey', function (err, value) {
              refute(value)
              assert.isInstanceOf(err, Error)
              assert.isInstanceOf(err, errors.LevelUPError)
              assert.isInstanceOf(err, errors.NotFoundError)
              assert.match(err, '[undefkey]')
              done()
            })
          })
        }

      , 'put() and get() simple string key/value pairs': function (done) {
          this.openTestDatabase(function (db) {
            var count = 0
              , key = 'some key'
              , value = 'some value stored in the database'

            function assertKeyValue(_key, _value) {
              assert.equals(key, _key)
              assert.equals(value, _value)
              count++
            }

            db.on('before:put', assertKeyValue)

            db.on('put', assertKeyValue)

            db.on('after:put', assertKeyValue)

            db.put(key, value, function (err) {
              refute(err)
              db.get(key, function (err, _value) {
                refute(err)
                assert.equals(_value, value)
                assert.equals(count, 3)
                done()
              })
            })
          })
        }

      , 'del() on empty database doesn\'t cause error': function (done) {
          this.openTestDatabase(function (db) {
            var count = 0

            function assertKey(_key) {
              assert.equals('undefkey', _key)
              count++
            }

            db.on('before:del', assertKey)

            db.on('del', assertKey)

            db.on('after:del', assertKey)


            db.del('undefkey', function (err) {
              refute(err)
              assert.equals(count, 3)
              done()
            })
          })
        }

      , 'del() works on real entries': function (done) {
          this.openTestDatabase(function (db) {
            async.series(
                [
                    function (callback) {
                      async.forEach(
                          ['foo', 'bar', 'baz']
                        , function (key, callback) {
                            db.put(key, 1 + Math.random(), callback)
                          }
                        , callback
                      )
                    }
                  , function (callback) {
                      db.del('bar', callback)
                    }
                  , function (callback) {
                      async.forEach(
                          ['foo', 'bar', 'baz']
                        , function (key, callback) {
                            db.get(key, function (err, value) {
                              // we should get foo & baz but not bar
                              if (key == 'bar') {
                                assert(err)
                                refute(value)
                              } else {
                                refute(err)
                                assert(value)
                              }
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
    }

  , 'batch()': {
        'batch() with multiple puts': function (done) {
          this.openTestDatabase(function (db) {
            var count = 0
              , key = 'some key'
              , value = 'some value stored in the database'

            function assertArray(_arr) {
              assert.equals(arr, _arr)
              count++
            }

            var arr = [
                { type: 'put', key: 'foo', value: 'afoovalue' }
              , { type: 'put', key: 'bar', value: 'abarvalue' }
              , { type: 'put', key: 'baz', value: 'abazvalue' }
            ]

            db.on('before:batch', assertArray)

            db.on('batch', assertArray)

            db.on('after:batch', assertArray)


            db.batch(
                arr
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
                    , function () {
                      assert.equals(count, 3)
                      done()
                    }
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
    }

  , 'null and undefined': {
        'setUp': function (done) {
          levelup(this.cleanupDirs[0] = common.nextLocation(), { createIfMissing: true }, function (err, db) {
            refute(err) // sanity
            this.closeableDatabases.push(db)
            assert.isTrue(db.isOpen())
            this.db = db
            done()
          }.bind(this))
        }

      , 'get() with null key causes error': function (done) {
          this.db.get(null, function (err, value) {
            refute(value)
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }

      , 'get() with undefined key causes error': function (done) {
          this.db.get(undefined, function (err, value) {
            refute(value)
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }

      , 'del() with null key causes error': function (done) {
          this.db.del(null, function (err, value) {
            refute(value)
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }

      , 'del() with undefined key causes error': function (done) {
          this.db.del(undefined, function (err, value) {
            refute(value)
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }

      , 'put() with null key causes error': function (done) {
          this.db.put(null, 'foo', function (err, value) {
            refute(value)
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }

      , 'put() with undefined key causes error': function (done) {
          this.db.put(undefined, 'foo', function (err, value) {
            refute(value)
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }

      , 'put() with null value causes error': function (done) {
          this.db.put('foo', null, function (err, value) {
            refute(value)
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }

      , 'put() with undefined value causes error': function (done) {
          this.db.put('foo', undefined, function (err, value) {
            refute(value)
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }
    }
})
