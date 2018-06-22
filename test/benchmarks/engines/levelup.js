var levelup = require('../../../')
var leveldown = require('leveldown')

var createDb = function (location, callback) {
  levelup(leveldown(location), function (err, db) {
    setTimeout(callback.bind(null, err, db), 50)
  })
}

var closeDb = function (db, callback) {
  db.close(callback)
}

module.exports = {
  createDb: createDb,
  closeDb: closeDb
}
