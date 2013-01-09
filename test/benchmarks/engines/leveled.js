/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var leveled = require('leveled')

  , createDb = function (location, callback) {
      var db = leveled(location) // no callback, is it sync?
      setTimeout(callback.bind(null, null, db), 50)
    }

  , closeDb = function (db, callback) {
      // has no close()
      callback()
    }

module.exports = {
    createDb : createDb
  , closeDb  : closeDb
}