/* Copyright (c) 2012-2015 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

var levelup = require('../lib/levelup.js')
  , common  = require('./common')

  , assert  = require('referee').assert
  , refute  = require('referee').refute
  , buster  = require('bustermove')


buster.testCase('Close', {
    'setUp': common.commonSetUp
  , 'tearDown': common.commonTearDown
  , 'several put() operations followed by a close()': function(done) {
    this.openTestDatabase(function(db) {
      var putsCompleted = 0
      db.put('some key 1', 'some value 1 stored in the database', function (err) {
        putsCompleted++
        refute(err)
      })
      db.put('some key 2', 'some value 2 stored in the database', function (err) {
        putsCompleted++
        refute(err)
      })
      db.put('some key 3', 'some value 3 stored in the database', function (err) {
        putsCompleted++
        refute(err)
      })
      db.close(function(err) {
        assert(db._activeOperations === 0, 'close called while there are still active operations')
        assert(putsCompleted === 3, 'close completed before put operations')
        refute(err)
        done()
      })
    }.bind(this))
  }
})
