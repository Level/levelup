// Promise polyfill for IE and others.
if (process.browser && typeof Promise !== 'function') {
  global.Promise = require('pinkie')
}

var test = require('tape')
var memdown = require('memdown')
var encode = require('encoding-down')
var levelup = require('../lib/levelup')

var testCommon = require('./common2')({
  test: test,
  factory: function (options, callback) {
    if (typeof options === 'function') {
      return levelup(encode(memdown()), options)
    } else if (callback) {
      return levelup(encode(memdown(), options), callback)
    } else {
      return levelup(encode(memdown(), options))
    }
  },
  clear: true
})

require('./argument-checking-test')(test, testCommon)
require('./batch-test')
require('./binary-test')(test, testCommon)
if (testCommon.clear) require('./clear-test')(test)
if (testCommon.snapshots) require('./create-stream-vs-put-racecondition')(test, testCommon)
require('./deferred-open-test')
require('./get-put-del-test')
require('./idempotent-test')(test, testCommon)
require('./init-test')(test, testCommon)
require('./custom-encoding-test')(test, testCommon)
require('./json-encoding-test')(test, testCommon)
require('./key-value-streams-test')
require('./maybe-error-test')(test, testCommon)
require('./no-encoding-test')
require('./null-and-undefined-test')
require('./open-patchsafe-test')
require('./read-stream-test')
if (testCommon.snapshots) require('./snapshot-test')(test, testCommon)
require('./iterator-test')(test, testCommon)
if (testCommon.seek) require('./iterator-seek-test')(test, testCommon)

if (!process.browser) {
  require('./browserify-test')(test)
}
