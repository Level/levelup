/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var levelup = require('levelup')

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