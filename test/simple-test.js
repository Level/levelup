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
    }

  , 'tearDown': function (done) {
      async.forEach(
          this.closeableDatabases
        , function (db, callback) {
            db.close(callback)
          }
        , function () {
            async.forEach(this.cleanupDirs, rimraf, done)
          }.bind(this)
      )
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
        'setUp': function () {
          this.openTestDatabase = function (callback) {
            var db = levelup.createDatabase(
                    this.cleanupDirs[0] = '/tmp/levelup_test_db'
                  , {
                        createIfMissing: true
                      , errorIfExists: true
                    }
                )
            this.closeableDatabases.push(db)
            db.open(function (err) {
              refute(err)
              callback(db)
            })
          }.bind(this)
        }

      , 'get() on non-open database causes error': function (done) {
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
    }
})