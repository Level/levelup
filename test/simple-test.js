/*global cleanUp:true, openTestDatabase:true*/

var buster  = require('buster')
  , assert  = buster.assert
  , levelup = require('../lib/levelup.js')
  , errors  = require('../lib/errors.js')
  , rimraf  = require('rimraf')
  , async   = require('async')
  , fs      = require('fs')

buster.testCase('Basic API', {
    'setUp': function () {
      this.cleanupDirs = []
      this.closeableDatabases = []
      this.openTestDatabase = openTestDatabase.bind(this)
    }

  , 'tearDown': function (done) {
      cleanUp(this.closeableDatabases, this.cleanupDirs, done)
    }

  , 'createDatabase()': function () {
      var db
      assert.isFunction(levelup.createDatabase)
      assert.equals(levelup.createDatabase.length, 2) // location & options arguments
      assert.exception(levelup.createDatabase, 'InitializationError') // no location

      db = levelup.createDatabase('/tmp/testdb')
      assert.isObject(db)
      assert.isFalse(db.createIfMissing)
      assert.isFalse(db.errorIfExists)
      assert.equals(db.location, '/tmp/testdb')

      // read-only properties
      db.createIfMissing = true
      assert.isFalse(db.createIfMissing)
      db.errorIfExists = true
      assert.isFalse(db.errorIfExists)
      db.location = 'foo'
      assert.equals(db.location, '/tmp/testdb')

      // with options
      db = levelup.createDatabase('/tmp/foodb', {
          createIfMissing : true
        , errorIfExists   : true
      })
      assert.isObject(db)
      assert.isTrue(db.createIfMissing)
      assert.isTrue(db.errorIfExists)
      assert.equals(db.location, '/tmp/foodb')

      // read-only properties
      db.createIfMissing = true
      assert.isTrue(db.createIfMissing)
      db.errorIfExists = true
      assert.isTrue(db.errorIfExists)
      db.location = 'bar'
      assert.equals(db.location, '/tmp/foodb')
    }

  , 'open() with !createIfMissing expects error': function (done) {
      var db = levelup.createDatabase(this.cleanupDirs[0] = '/tmp/levelup_test_db')

      assert.isFalse(db.isOpen())

      db.open(function (err) {
        assert(err)
        assert.isInstanceOf(err, Error)
        assert.isInstanceOf(err, errors.LevelUPError)
        assert.isInstanceOf(err, errors.OpenError)
        assert.isFalse(db.isOpen())
        done()
      })
    }

  , 'open() with createIfMissing expects directory to be created': function (done) {
      var db = levelup.createDatabase(
              this.cleanupDirs[0] = '/tmp/levelup_test_db'
            , { createIfMissing: true }
          )
      this.closeableDatabases.push(db)

      db.open(function (err) {
        refute(err)
        assert.isTrue(db.isOpen())
        fs.stat(this.cleanupDirs[0], function (err, stat) {
          assert(stat.isDirectory())
          done()
        })
      }.bind(this))
    }

  , 'open() with errorIfExists expects error if exists': function (done) {
      var db = levelup.createDatabase(
              this.cleanupDirs[0] = '/tmp/levelup_test_db'
            , { createIfMissing: true }
          )
      this.closeableDatabases.push(db)

      db.open(function (err) {
        refute(err) // sanity
        var db = levelup.createDatabase(
                this.cleanupDirs[0]
              , { errorIfExists   : true }
            )
        db.open(function (err) {
          assert.isInstanceOf(err, Error)
          assert.isInstanceOf(err, errors.LevelUPError)
          assert.isInstanceOf(err, errors.OpenError)
          done()
        })
      }.bind(this))
    }

  , 'open() with !errorIfExists does not expect error if exists': function (done) {
      var db = levelup.createDatabase(
              this.cleanupDirs[0] = '/tmp/levelup_test_db'
            , { createIfMissing: true }
          )
      this.closeableDatabases.push(db)

      db.open(function (err) {
        refute(err) // sanity
        assert.isTrue(db.isOpen())

        db.close(function () {
          assert.isFalse(db.isOpen())

          db = levelup.createDatabase(
                  this.cleanupDirs[0]
                , { errorIfExists   : false }
              )
          this.closeableDatabases.push(db)
          db.open(function (err) {
            refute(err)
            assert.isTrue(db.isOpen())
            done()
          })
        }.bind(this))
      }.bind(this))
    }

  , 'Simple operations': {
        'get() on non-open database causes error': function (done) {
          levelup.createDatabase('foobar').get('undefkey', function (err, value) {
            refute(value)
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            assert.isInstanceOf(err, errors.ReadError)
            assert.match(err, /not .*open/)
            done()
          })
        }

      , 'put() on non-open database causes error': function (done) {
          levelup.createDatabase('foobar').put('somekey', 'somevalue', function (err, value) {
            refute(value)
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            assert.isInstanceOf(err, errors.ReadError)
            assert.match(err, /not .*open/)
            done()
          })
        }

      , 'get() on empty database causes error': function (done) {
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

      , 'del() on non-open database causes error': function (done) {
          levelup.createDatabase('foobar').del('undefkey', function (err) {
            assert.isInstanceOf(err, Error)
            assert.isInstanceOf(err, errors.LevelUPError)
            assert.isInstanceOf(err, errors.ReadError)
            assert.match(err, /not .*open/)
            done()
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
                        callback()
                      })
                    }
                ]
              , done
            )
          })
        }
    }
})