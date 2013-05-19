/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License
 * <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var extend = require('xtend')
  , errors = require('./errors')

  , encodings = [
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

  , defaultOptions = {
        createIfMissing : true
      , errorIfExists   : false
      , keyEncoding     : 'utf8'
      , valueEncoding   : 'utf8'
      , compression     : true
    }

  , leveldown

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

  , getOptions = function (levelup, options) {
      var s = typeof options == 'string' // just an encoding
      if (!s && options && options.encoding && !options.valueEncoding)
        options.valueEncoding = options.encoding
      return extend(
          (levelup && levelup.options) || {}
        , s ? encodingOpts[options] || encodingOpts[defaultOptions.valueEncoding]
            : options
      )
    }

  , getLevelDOWN = function () {
      if (leveldown)
        return leveldown

      var requiredVersion       = require('../package.json').devDependencies.leveldown
        , missingLevelDOWNError = 'Could not locate LevelDOWN, try `npm install leveldown`'
        , leveldownVersion

      try {
        leveldownVersion = require('leveldown/package').version
      } catch (e) {
        throw new errors.LevelUPError(missingLevelDOWNError)
      }

      if (!require('semver').satisfies(leveldownVersion, requiredVersion)) {
        throw new errors.LevelUPError(
            'Installed version of LevelDOWN ('
          + leveldownVersion
          + ') does not match required version ('
          + requiredVersion
          + ')'
        )
      }

      try {
        return leveldown = require('leveldown')
      } catch (e) {
        throw new errors.LevelUPError(missingLevelDOWNError)
      }
    }

module.exports = {
    defaultOptions : defaultOptions
  , toSlice        : toSlice
  , toEncoding     : toEncoding
  , copy           : copy
  , setImmediate   : setImmediate
  , getOptions     : getOptions
  , getLevelDOWN   : getLevelDOWN
}
