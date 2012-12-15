var levelup = require('../../../')

  , createDb = function (location, callback) {
      levelup(location, { createIfMissing: true, errorIfExists: true }, function (err, db) {
        setTimeout(callback.bind(null, err, db), 50)
      })
    }

  , closeDb = function (db, callback) {
      db.close(callback)
    }

module.exports = {
    createDb : createDb
  , closeDb  : closeDb
}