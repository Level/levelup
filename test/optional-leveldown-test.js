/* Copyright (c) 2012-2015 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var levelup = require('../lib/levelup')
  , assert  = require('referee').assert
  , refute  = require('referee').refute
  , format  = require('util').format
  , buster  = require('bustermove')
  , errors  = levelup.errors

function clearCache () {
  delete require.cache[require.resolve('..')]
  delete require.cache[require.resolve('leveldown')]
  delete require.cache[require.resolve('leveldown/package')]
  delete require.cache[require.resolve('../lib/util')]
}

buster.testCase('Optional LevelDOWN', {
    'setUp': clearCache
  , 'tearDown': clearCache

  , 'test getLevelDOWN()': function () {
      var util = require('../lib/util')
      assert.same(util.getLevelDOWN(), require('leveldown'), 'correct leveldown provided')
    }

  , 'test wrong version': function () {
      var levelup = require('..')
      require('leveldown/package').version = '0.0.0'
      assert.exception(levelup.bind(null, '/foo/bar'), function (err) {
        if (err.name != 'LevelUPError')
          return false
        if (!/Installed version of LevelDOWN \(0\.0\.0\) does not match required version \(\^\d+\.\d+\.\d+\)/.test(err.message))
          return false
        return true
      })
    }

  , 'test no leveldown/package': function () {
      assertRequireThrows('leveldown/package')
    }

  , 'test no leveldown': function () {
      assertRequireThrows('leveldown')
    }
})

function assertRequireThrows (module) {
  var levelup = require('..')
    , error   = 'Wow, this is kind of evil isn\'t it?'
  // simulate an exception from a require() that doesn't resolved a package
  Object.defineProperty(require.cache, require.resolve(module), {
    get: function() {
      throw new Error(error)
    }
  })
  assert.exception(levelup.bind(null, '/foo/bar'), function (err) {
    if (err.name != 'LevelUPError')
      return false
    var template = 'Failed to require LevelDOWN (%s). Try `npm install leveldown` if it\'s missing'
    if (format(template, error) != err.message)
      return false
    return true
  })
}
