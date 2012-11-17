/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var errno = require('errno')

  , LevelUPError = errno.custom.createError('LevelUPError')

module.exports = {
    LevelUPError        : LevelUPError
  , InitializationError : errno.custom.createError('InitializationError', LevelUPError)
  , OpenError           : errno.custom.createError('OpenError', LevelUPError)
  , ReadError           : errno.custom.createError('ReadError', LevelUPError)
  , WriteError          : errno.custom.createError('WriteError', LevelUPError)
  , NotFoundError       : errno.custom.createError('NotFoundError', LevelUPError)
  , CloseError          : errno.custom.createError('CloseError', LevelUPError)
}
