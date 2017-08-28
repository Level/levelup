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

function promisify () {
  var callback
  var promise = new Promise(function (resolve, reject) {
    callback = function callback (err, value) {
      if (err) reject(err)
      else resolve(value)
    }
  })
  return [ callback, promise ]
}

module.exports = {
  defaultOptions: defaultOptions,
  getOptions: getOptions,
  dispatchError: dispatchError,
  promisify: promisify
}
