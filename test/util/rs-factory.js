'use strict'

module.exports = function (testCommon) {
  return function createReadStream (db, options) {
    if (!testCommon.encodings) {
      options = Object.assign({}, options, {
        keyAsBuffer: false,
        valueAsBuffer: false
      })
    }

    return db.createReadStream(options)
  }
}
