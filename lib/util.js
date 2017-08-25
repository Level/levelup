/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License
 * <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var defaultOptions = {
  keyEncoding: 'utf8',
  valueEncoding: 'utf8'
}

function getOptions (options) {
  if (typeof options === 'string') { options = { valueEncoding: options } }
  if (typeof options !== 'object') { options = {} }
  return options
}

function dispatchError (db, error, callback) {
  typeof callback === 'function' ? callback(error) : db.emit('error', error)
}

function isDefined (v) {
  return typeof v !== 'undefined'
}

function promisify () {
  var resolve_, reject_
  var promise = new Promise(function (resolve, reject) {
    [resolve_, reject_] = [resolve, reject]
  })
  function callback (err, value) {
    if (err) reject_(err)
    else resolve_(value)
  }
  return [ callback, promise ]
}

module.exports = {
  defaultOptions: defaultOptions,
  getOptions: getOptions,
  dispatchError: dispatchError,
  isDefined: isDefined,
  promisify: promisify
}
