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

if (!process.browser) {
  require('./browserify-test')(test)
}
