/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License
 * <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var errno = require('errno')

  , LevelUPError = errno.custom.createError('LevelUPError')

module.exports = {
    LevelUPError  : LevelUPError
  , InitError     : errno.custom.createError('InitError', LevelUPError)
  , OpenError     : errno.custom.createError('OpenError', LevelUPError)
  , ReadError     : errno.custom.createError('ReadError', LevelUPError)
  , WriteError    : errno.custom.createError('WriteError', LevelUPError)
  , NotFoundError : errno.custom.createError('NotFoundError', LevelUPError)
  , CloseError    : errno.custom.createError('CloseError', LevelUPError)
}
