/* Copyright (c) 2012-2018 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

// Promise polyfill for IE and others.
if (process.browser && typeof Promise !== 'function') {
  global.Promise = require('pinkie')
}

require('./argument-checking-test')
require('./batch-test')
require('./binary-test')
require('./deferred-open-test')
require('./get-put-del-test')
require('./idempotent-test')
require('./init-test')
require('./inject-encoding-test')
require('./json-test')
require('./key-value-streams-test')
require('./maybe-error-test')
require('./no-encoding-test')
require('./null-and-undefined-test')
require('./open-patchsafe-test')
require('./read-stream-test')
require('./snapshot-test')

if (!process.browser) {
  require('./browserify-test')
}
