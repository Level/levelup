/* Copyright (c) 2012-2014 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT License <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
 */

var IteratorStream = require('level-iterator-stream')

module.exports = function (iterator, codec, options) {
  var source = IteratorStream(iterator, options)
  var decode = codec.createDecodeStream(options)

  source.pipe(decode)
  source.on('error', decode.emit.bind(decode, 'error'))
  source.on('close', decode.emit.bind(decode, 'close'))
  decode.destroy = source.destroy.bind(source)

  return decode
}

