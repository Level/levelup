/* Copyright (c) 2012-2016 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License
 * <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var assert        = require('assert')

function dispatchError (db, error, callback) {
  typeof callback == 'function' ? callback(error) : db.emit('error', error)
}

function getOptions (options) {
  return typeof options === 'object' && options !== null
    ? options
    : {}
}

function isDefined (v) {
  return typeof v !== 'undefined'
}

function validateDOWN (db) {
  assert(db.status,
    '.status required. upgrade your backend / its abstract-leveldown dependency'
  )
}

module.exports = {
    dispatchError   : dispatchError
  , isDefined       : isDefined
  , validateDOWN    : validateDOWN
  , getOptions      : getOptions
}
