/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License
 * <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

const promisify = () => {
  let callback
  const promise = new Promise((resolve, reject) => {
    callback = (err, value) => {
      if (err) reject(err)
      else resolve(value)
    }
  })
  callback.promise = promise
  return callback
}

module.exports = promisify
