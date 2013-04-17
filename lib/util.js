/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License
 * <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var encodings = [
        'hex'
      , 'utf8'
      , 'utf-8'
      , 'ascii'
      , 'binary'
      , 'base64'
      , 'ucs2'
      , 'ucs-2'
      , 'utf16le'
      , 'utf-16le'
    ]

  , toSlice = (function () {
      var slicers = {}
        , isBuffer = function (data) {
            return data === undefined || data === null || Buffer.isBuffer(data)
          }
      slicers.json = JSON.stringify.bind(JSON)
      slicers.utf8 = function (data) {
        return isBuffer(data) ? data : String(data)
      }
      encodings.forEach(function (enc) {
        if (slicers[enc]) return
        slicers[enc] = function (data) {
          return isBuffer(data) ? data : new Buffer(data, enc)
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

  , copy = function (srcdb, dstdb, callback) {
      srcdb.readStream()
        .pipe(dstdb.writeStream())
        .on('close', callback ? callback : function () {})
        .on('error', callback ? callback : function (err) { throw err })
    }

  , setImmediate = global.setImmediate || process.nextTick

  , encodingOpts = (function () {
      var eo = {}
      encodings.forEach(function (e) {
        eo[e] = { valueEncoding : e }
      })
      return eo
    }())

module.exports = {
    toSlice      : toSlice
  , toEncoding   : toEncoding
  , copy         : copy
  , setImmediate : setImmediate
  , encodingOpts : encodingOpts
}