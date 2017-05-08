/* Copyright (c) 2012-2016 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var common  = require('./common')

  , assert  = require('referee').assert
  , refute  = require('referee').refute
  , buster  = require('bustermove')
  , browserify = require('browserify')
  , path = require('path')

var PACKAGE_JSON = path.join(__dirname, '..', 'package.json')

buster.testCase('Browserify Bundle', {
  'does not contain package.json': function (done) {
    var b = browserify(path.join(__dirname, '..'), {browserField: true})
      .once('error', function (error) {
        assert.fail(error)
        done()
      })
    b.pipeline
      .on('file', function (file, id, parent) {
        refute.equals(file, PACKAGE_JSON)
      })
    b.bundle(done)
  }
})
