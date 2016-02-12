/* Copyright (c) 2012-2016 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License
 * <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var extend         = require('xtend')
  , LevelUPError   = require('level-errors').LevelUPError
  , format         = require('util').format
  , defaultOptions = {
        createIfMissing : true
      , errorIfExists   : false
      , keyEncoding     : 'utf8'
      , valueEncoding   : 'utf8'
      , compression     : true
    }

  , leveldown

function getOptions (options) {
  if (typeof options == 'string')
    options = { valueEncoding: options }
  if (typeof options != 'object')
    options = {}
  return options
}

function getLevelDOWN () {
  if (leveldown)
    return leveldown

  var requiredVersion  = require('../package.json').devDependencies.leveldown
    , leveldownVersion

  try {
    leveldownVersion = require('leveldown/package').version
  } catch (e) {
    throw requireError(e)
  }

  if (!require('semver').satisfies(leveldownVersion, requiredVersion)) {
    throw new LevelUPError(
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
    throw requireError(e)
  }
}

function requireError (e) {
  var template = 'Failed to require LevelDOWN (%s). Try `npm install leveldown` if it\'s missing'
  return new LevelUPError(format(template, e.message))
}

function dispatchError (db, error, callback) {
  typeof callback == 'function' ? callback(error) : db.emit('error', error)
}

function isDefined (v) {
  return typeof v !== 'undefined'
}

module.exports = {
    defaultOptions  : defaultOptions
  , getOptions      : getOptions
  , getLevelDOWN    : getLevelDOWN
  , dispatchError   : dispatchError
  , isDefined       : isDefined
}
