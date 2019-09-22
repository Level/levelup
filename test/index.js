'use strict'

var common = require('./common')

function suite (options) {
  var testCommon = common(options)
  var test = testCommon.test

  require('./argument-checking-test')(test, testCommon)
  require('./batch-test')(test, testCommon)
  if (testCommon.encodings) require('./binary-test')(test, testCommon)
  if (testCommon.clear) require('./clear-test')(test)
  if (testCommon.snapshots) require('./create-stream-vs-put-racecondition')(test, testCommon)
  if (testCommon.deferredOpen) require('./deferred-open-test')(test, testCommon)
  require('./get-put-del-test')(test, testCommon)
  require('./idempotent-test')(test, testCommon)
  require('./init-test')(test, testCommon)
  if (testCommon.encodings) require('./custom-encoding-test')(test, testCommon)
  if (testCommon.encodings) require('./json-encoding-test')(test, testCommon)
  if (testCommon.streams) require('./key-value-streams-test')(test, testCommon)
  require('./maybe-error-test')(test, testCommon)
  require('./no-encoding-test')(test, testCommon)
  require('./null-and-undefined-test')(test, testCommon)
  if (testCommon.deferredOpen) require('./open-patchsafe-test')(test, testCommon)
  if (testCommon.streams) require('./read-stream-test')(test, testCommon)
  if (testCommon.snapshots && testCommon.streams) require('./snapshot-test')(test, testCommon)
  require('./iterator-test')(test, testCommon)
  if (testCommon.seek) require('./iterator-seek-test')(test, testCommon)
}

suite.common = common
module.exports = suite
