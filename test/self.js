'use strict'

const test = require('tape')
const memdown = require('memdown')
const encode = require('encoding-down')
const levelup = require('../lib/levelup')
const suite = require('.')
const noop = function () {}

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

// Integration tests that can't use a generic testCommon.factory()
require('./self/manifest-test')

if (!process.browser) {
  require('./browserify-test')(test)
}
