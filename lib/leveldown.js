var LevelUPError   = require('level-errors').LevelUPError
  , format         = require('util').format
  , leveldown

function getLevelDOWN () {
  if (leveldown)
    return leveldown

  var requiredVersion  = require('../package.json').devDependencies.leveldown
    , leveldownVersion

  try {
    leveldownVersion = require('leveldown/package.json').version
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

module.exports = getLevelDOWN
