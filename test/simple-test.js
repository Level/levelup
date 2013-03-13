/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var levelup = require('../lib/levelup.js')
  , errors  = require('../lib/errors.js')
  , async   = require('async')
  , fs      = require('fs')
  , common  = require('./common')

  , assert  = require('referee').assert
  , refute  = require('referee').refute
  , buster  = require('bustermove')

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
        refute(err, 'no error')
        assert.isTrue(db.isOpen())
        this.closeableDatabases.push(db)
        this.cleanupDirs.push(location)
        db.close(function (err) {
          refute(err)

          assert.isFalse(db.isOpen())

          levelup(location, function (err, db) { // no options object
            refute(err)
            assert.isObject(db)
            assert.isTrue(db._options.createIfMissing)
            assert.isFalse(db._options.errorIfExists)
            assert.equals(db.location, location)

            // read-only properties
            db.location = 'foo'
            assert.equals(db.location, location)

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
        assert.equals(db.location, location)


        // read-only properties
        db.location = 'bar'
        assert.equals(db.location, location)

        done()
      }.bind(this))
    }

  , 'without callback': function (done) {
      var location = common.nextLocation()
        , db = levelup(location, { createIfMissing: true, errorIfExists: true })

      this.closeableDatabases.push(db)
      this.cleanupDirs.push(location)
      assert.isObject(db)
      assert.isTrue(db._options.createIfMissing)
      assert.isTrue(db._options.errorIfExists)
      assert.equals(db.location, location)

      db.on("ready", function () {
        assert.isTrue(db.isOpen())
        done()
      })
    }

  , 'open() with !createIfMissing expects error': function (done) {
      levelup(this.cleanupDirs[0] = common.nextLocation(), { createIfMissing: false }, function (err, db) {
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
            db.put('some key', 'some value stored in the database', function (err) {
              refute(err)
              db.get('some key', function (err, value) {
                refute(err)
                assert.equals(value, 'some value stored in the database')
                done()
              })
            })
          })
        }

      , 'del() on empty database doesn\'t cause error': function (done) {
          this.openTestDatabase(function (db) {
            db.del('undefkey', function (err) {
              refute(err)
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
    }

  , 'approximateSize()': {
        'approximateSize() works on empty database': function (done) {
          this.openTestDatabase(function (db) {
            db.approximateSize('a', 'z', function(err, size) {
              refute(err) // sanity
              assert.equals(size, 0)
              done()
            })
          })
        }

      , 'approximateSize() work on none-empty database': function(done) {
          var location = common.nextLocation()
            , db

          async.series(
              [
                  function (callback) {
                    this.openTestDatabase(
                        location
                      , function (_db) {
                        db = _db
                        callback()
                      }
                    )
                  }.bind(this)
                , function (callback) {
                    var batch = []
                      , i     = 0

                    for (; i < 10; ++i) {
                      batch.push({
                        type: 'put', key: String(i), value: 'afoovalue'
                      })
                    }
                    db.batch(
                        batch
                      , { sync: true }
                      , callback
                    )
                  }
                , function (callback) {
                    // close db to make sure stuff gets written to disc
                    db.close(callback)
                  }
                , function (callback) {
                    levelup(location, function (err, _db) {
                      refute(err)
                      db = _db
                      callback()
                    })
                  }
                , function (callback) {
                    db.approximateSize('0', '99', function(err, size) {
                      refute(err) // sanity
                      refute.equals(size, 0)
                      callback()
                    })
                  }
              ]
            , done
          )
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
      , 'batch() with undefined value causes error': function (done) {
          this.db.batch([{key: 'foo', value: undefined, type: 'put'}]
          , function (err) {
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }
      , 'batch() with null value causes error': function (done) {
          this.db.batch([{key: 'foo', value: null, type: 'put'}]
          , function (err) {
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }
      , 'batch() with undefined key causes error': function (done) {
          this.db.batch([{key: undefined, value: 'bar', type: 'put'}]
          , function (err) {
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }
      , 'batch() with null key causes error': function (done) {
          this.db.batch([{key: null, value: 'bar', type: 'put'}]
          , function (err) {
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            done()
          })
        }
    }
})
