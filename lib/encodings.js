/* Copyright (c) 2012-2014 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT License
 * <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
 */

var encodingNames = [
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

module.exports = (function () {
  function isBinary (data) {
    return data === undefined || data === null || Buffer.isBuffer(data)
  }

  var encodings = {}

  encodings.utf8 = encodings['utf-8'] = {
      encode : function (data) {
        return isBinary(data) ? data : String(data)
      }
    , decode : function (data) { return data }
    , buffer : false
    , type   : 'utf8'
  }

  encodings.json = {
      encode : JSON.stringify
    , decode : JSON.parse
    , buffer : false
    , type   : 'json'
  }

  encodings.binary = {
      encode : function (data) {
        return isBinary(data) ? data : new Buffer(data)
      }
    , decode : function (data) {
        return data
      }
    , buffer : true
    , type   : 'binary'
  }

  encodingNames.forEach(function (type) {
    if (encodings[type])
      return

    encodings[type] = {
        encode : function (data) {
          return isBinary(data) ? data : new Buffer(data, type)
        }
      , decode : function (buffer) {
          return buffer.toString(type)
        }
      , buffer : true
      , type   : type // useful for debugging purposes
    }
  })

  return encodings
})()

