/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License
 * <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

var PROBES = {
    'open-start': [],
    // err
    'open-done': ['char *'],
    'close-start': [],
    // err
    'close-done': ['char *'],
    // key, value, options
    'put-start': ['char *', 'char*', 'json'],
    // err, key, value, options
    'put-done': ['char *', 'char *', 'char *', 'json'],
    // key, options
    'get-start': ['char *', 'json'],
    // error, key, value
    'get-done': ['char *', 'char *', 'char *'],
    // key, options
    'del-start': ['char *', 'json'],
    // err, key, options
    'del-done': ['char *', 'char *', 'json'],
    // array, options
    'batchnew-start': ['json', 'json'],
    // err, array, options
    'batchnew-done': ['char *', 'json', 'json'],
    'batchclear-start':[],
    // err
    'batchclear-done': ['char *'],
    // key, options
    'batchdel-start': ['char *', 'json'],
    // err, key, options
    'batchdel-done': ['char *', 'char *', 'json'],
    // err, key, value
    'batchput-start': ['char *', 'char *', 'json'],
    // err, key, value
    'batchput-done': ['char *', 'char *', 'char *', 'json'],
    // operations
    'batchwrite-start': ['json'],
    // err, operations
    'batchwrite-done': ['char *', 'json']
  }
  , PROVIDER

///--- API

module.exports = function exportStaticProvider() {
  if (!PROVIDER) {
    try {
      var dtrace = require('dtrace-provider')
      PROVIDER = dtrace.createDTraceProvider('node-levelup')
    } catch (e) {
      PROVIDER = {
        fire: function () {},
        enable: function () {},
        addProbe: function () {
          var p = {
            fire: function () {}
          }
          return (p)
        },
        removeProbe: function () {},
        disable: function () {}
      }
    }

    PROVIDER._levelup_probes = {}

    Object.keys(PROBES).forEach(function (p) {
      var args = PROBES[p].splice(0)
      args.unshift(p)

      var probe = PROVIDER.addProbe.apply(PROVIDER, args)
      PROVIDER._levelup_probes[p] = probe
    })

    PROVIDER.enable()
  }

  return (PROVIDER)
}()
