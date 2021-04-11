const levelup = require('levelup')
const leveldown = require('leveldown')

const createDb = function (location, callback) {
  levelup(leveldown(location), function (err, db) {
    setTimeout(callback.bind(null, err, db), 50)
  })
}

const closeDb = function (db, callback) {
  db.close(callback)
}

module.exports = {
  createDb: createDb,
  closeDb: closeDb
}
