var bridge              = require('../build/Release/levelup')
  , errors              = require('./errors')

  , defaultOptions = {
        createIfMissing : false
      , errorIfExists   : false
    }

  , toString = function () {
      return "LevelUPDatabase"
    }

  , Database = {
        open: function (callback) {
          var options = {}
            , execute = function () {
                Object.keys(defaultOptions).forEach(function (p) {
                  options[p] = this[p]
                }.bind(this))
                this.db = bridge.createDatabase()
                this.db.open(this.location, options, function (err) {
                  if (err) {
                    this.db = null
                    err = new errors.OpenError(err)
                  }
                  if (callback)
                    callback.apply(null, err ? [ err ] : [])
                  else if (err)
                    throw err
                }.bind(this))
              }.bind(this)

          if (this.isOpen())
            this.close(execute)
          else
            execute()
        }

      , close: function (callback) {
          if (this.isOpen()) {
            this.db.close(callback)
            this.db = null
          } else {
            callback()
          }
        }

      , isOpen: function () {
          return !!this.db
        }

      , get: function (key, callback) {
          if (this.isOpen()) {
            this.db.get(key, function (err, value) {
              if (err) {
                err = new errors.NotFoundError('Key not found in database [' + key + ']')
                if (callback)
                  return callback(err)
                throw err
              }
              callback && callback(null, value)
            })
          } else
            callback(new errors.ReadError('Database has not been opened'))
        }

      , put: function (key, value, callback) {
          if (this.isOpen()) {
            this.db.put(key, value, function (err) {
              if (err) {
                err = new errors.WriteError(err)
                if (callback)
                  return callback(err)
                throw err
              }
              callback && callback()
            })
          } else
            callback(new errors.ReadError('Database has not been opened'))
        }

      , del: function (key, callback) {
          if (this.isOpen()) {
            this.db.del(key, function (err) {
              if (err) {
                err = new errors.WriteError(err)
                if (callback)
                  return callback(err)
                throw err
              }
              callback && callback()
            })
          } else
            callback(new errors.ReadError('Database has not been opened'))
        }

      , batch: function (arr, callback) {
          if (this.isOpen()) {
            this.db.batch(arr, function (err) {
              if (err) {
                err = new errors.WriteError(err)
                if (callback)
                  return callback(err)
                throw err
              }
              callback && callback()
            })
          } else
            callback(new errors.ReadError('Database has not been opened'))
        }
    }

  , defineReadOnlyProperty = function (obj, key, value) {
      Object.defineProperty(obj, key, {
          value        : value
        , writeable    : false
        , enumerable   : true
        , configurable : false
      })
    }

  , createDatabase = function (location, options) {
      var database, ctx

      if (typeof location != 'string')
        throw new errors.InitializationError('Must provide a location for the database')

      database = Object.create({ toString: toString })
      ctx = {}

      defineReadOnlyProperty(database, 'location', location)
      ctx.location = location
      Object.keys(defaultOptions).forEach(function (p) {
        var value = (options && options[p]) || defaultOptions[p]
        defineReadOnlyProperty(database, p, value)
        ctx[p] = value
      })

      Object.keys(Database).forEach(function (p) {
        database[p] = ctx[p] = Database[p].bind(ctx)
      })

      return database
    }

module.exports.createDatabase = createDatabase