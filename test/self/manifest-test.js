'use strict'

const test = require('tape')
const levelup = require('../..')
const memdown = require('memdown')
const sinon = require('sinon')

test('manifest: additionalMethod is proxied', function (t) {
  const mem = memdown()

  mem.beep = sinon.spy()
  mem.supports = { additionalMethods: { beep: true } }

  const db = levelup(mem)
  const noop = () => {}

  t.is(typeof db.beep, 'function')
  t.is(typeof levelup.prototype.beep, 'undefined')

  db.beep(noop)
  t.is(mem.beep.callCount, 0, 'deferred')

  db.on('open', function () {
    t.is(mem.beep.callCount, 1)
    t.same(mem.beep.getCall(0).args, [noop])

    db.beep('boop', noop)
    t.same(mem.beep.getCall(1).args, ['boop', noop])

    db.close(t.end.bind(t))
  })
})

test('manifest: additionalMethod is proxied even if function does not exist', function (t) {
  const mem = memdown()
  mem.supports = { additionalMethods: { beep: true } }
  const db = levelup(mem)

  t.is(typeof db.beep, 'function')
  t.is(typeof levelup.prototype.beep, 'undefined')
  t.end()
})

test('manifest: approximateSize() et al are proxied even if manifest does not exist', function (t) {
  const mem = memdown()

  // deferred-leveldown should feature-detect these methods (for now)
  mem.approximateSize = function () {}
  mem.compactRange = function () {}

  mem.otherMethod = function () {}
  mem.supports = null

  const db = levelup(mem)

  t.is(typeof db.approximateSize, 'function')
  t.is(typeof db.compactRange, 'function')
  t.is(typeof db.otherMethod, 'undefined')

  t.end()
})
