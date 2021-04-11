'use strict'

const xtend = require('xtend')

module.exports = function (testCommon) {
  return function createReadStream (db, options) {
    if (!testCommon.encodings) {
      options = xtend(options, {
        keyAsBuffer: false,
        valueAsBuffer: false
      })
    }

    return db.createReadStream(options)
  }
}
