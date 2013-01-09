/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var encodings = 'hex utf8 utf-8 ascii binary base64 ucs2 ucs-2 utf16le utf-16le'.split(' ')

  , toSlice = (function () {
      var slicers = {}
      slicers.json = JSON.stringify.bind(JSON)
      slicers.utf8 = function (data) {
        return data === undefined || data === null || Buffer.isBuffer(data) ? data : String(data)
      }
      encodings.forEach(function (enc) {
        if (slicers[enc]) return
        slicers[enc] = function (data) {
          return data === undefined || data === null || Buffer.isBuffer(data) ? data : new Buffer(data, enc)
        }
      })
      return slicers
    }())

  , toEncoding = (function () {
      var encoders = {}
      encoders.json = function (str) { return JSON.parse(str) }
      encoders.utf8 = function (str) { return str }
      encoders.binary = function (buffer) { return buffer }
      encodings.forEach(function (enc) {
        if (encoders[enc]) return
        encoders[enc] = function (buffer) { return buffer.toString(enc) }
      })
      return encoders
    }())

  , extend = function (dst, src) {
      for (var p in src) dst[p] = src[p]
      return dst
    }

  , copy = function (srcdb, dstdb, callback) {
      srcdb.readStream()
        .pipe(dstdb.writeStream({useBatch:false}))
        .on('close', callback ? callback : function () {})
        .on('error', callback ? callback : function (err) { throw err })
    }

  , setImmediate = global.setImmediate || process.nextTick

module.exports = {
    encodings    : encodings
  , toSlice      : toSlice
  , toEncoding   : toEncoding
  , extend       : extend
  , copy         : copy
  , setImmediate : setImmediate
}