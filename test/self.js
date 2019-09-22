'use strict'

// Promise polyfill for IE and others.
if (process.browser && typeof Promise !== 'function') {
  global.Promise = require('pinkie')
}

var test = require('tape')
var memdown = require('memdown')
var encode = require('encoding-down')
var levelup = require('../lib/levelup')
var suite = require('.')
var noop = function () {}

suite({
  test: test,
  factory: function (options) {
    return levelup(encode(memdown(), options))
  },
  clear: true,
  deferredOpen: true,
  promises: true,
  streams: true,
  encodings: true
})

suite({
  test: test,
  factory: function (options) {
    return levelup(memdown(), options)
  },
  clear: true,
  deferredOpen: true,
  promises: true,
  streams: true,
  encodings: false
})

// TODO to make this pass:
// - Have abstract-leveldown use level-errors
// - Perform type checks in same order (e.g. check key before callback)
// - Add db.isClosed(), isOpen() to abstract-leveldown
suite({
  test: noop,
  factory: function (options) {
    return memdown()
  },
  clear: true,
  deferredOpen: false,
  promises: false,
  streams: false,
  encodings: false
})

if (!process.browser) {
  require('./browserify-test')(test)
}
