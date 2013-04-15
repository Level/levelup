var assert = require('assert')

assert(require('./') === require('levelup'))
console.log('All good! level === levelup')