'use strict'

var sinon = require('sinon')

module.exports = function readStreamContext (t) {
  var ctx = {}
  var i
  var k

  ctx.dataSpy = sinon.spy()
  ctx.endSpy = sinon.spy()
  ctx.sourceData = []

  for (i = 0; i < 100; i++) {
    k = (i < 10 ? '0' : '') + i
    ctx.sourceData.push({
      type: 'put',
      key: k,
      value: Math.random()
    })
  }

  ctx.verify = function (data) {
    if (!data) data = ctx.sourceData // can pass alternative data array for verification

    t.is(ctx.endSpy.callCount, 1, 'ReadStream emitted single "end" event')
    t.is(ctx.dataSpy.callCount, data.length, 'ReadStream emitted correct number of "data" events')

    data.forEach(function (d, i) {
      var call = ctx.dataSpy.getCall(i)
      if (call) {
        t.is(call.args.length, 1, 'ReadStream "data" event #' + i + ' fired with 1 argument')
        t.ok(call.args[0].key, 'ReadStream "data" event #' + i + ' argument has "key" property')
        t.ok(call.args[0].value, 'ReadStream "data" event #' + i + ' argument has "value" property')
        t.is(call.args[0].key, d.key, 'ReadStream "data" event #' + i + ' argument has correct "key"')
        t.is(+call.args[0].value, +d.value, 'ReadStream "data" event #' + i + ' argument has correct "value"')
      }
    })
  }

  return ctx
}
