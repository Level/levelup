/* Copyright (c) 2012-2014 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT License <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
 */

var sqlite3 = require('sqlite3')

  , createDb = function (location, callback) {
      var db = new sqlite3.Database(location, function (err) {
        if (err) return callback(err)
        db.run("CREATE TABLE bench (key VARCHAR(32), value TEXT)", function (err) {
          if (err) return callback(err)
          setTimeout(callback.bind(null, null, db), 50)
        })
      })
    }

  , closeDb = function (db, callback) {
      db.close() // does it have a callback?
      setTimeout(callback, 50)
    }

module.exports = {
    createDb : createDb
  , closeDb  : closeDb
}
