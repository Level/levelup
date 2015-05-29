/* Copyright (c) 2012-2016 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License
 * <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var extend        = require('xtend')
  , assert        = require('assert')
  , defaultOptions = {
        keyEncoding     : 'utf8'
      , valueEncoding   : 'utf8'
      , compression     : true
    }

  , leveldown

function getOptions (options) {
  if (typeof options == 'string')
    options = { valueEncoding: options }
  if (typeof options != 'object')
    options = {}
  return options
}

function dispatchError (db, error, callback) {
  typeof callback == 'function' ? callback(error) : db.emit('error', error)
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
    defaultOptions  : defaultOptions
  , getOptions      : getOptions
  , dispatchError   : dispatchError
  , isDefined       : isDefined
  , validateDOWN    : validateDOWN
}
