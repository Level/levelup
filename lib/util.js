/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var toBuffer = function (data, encoding) {
      if (encoding == 'json') {
        data = JSON.stringify(data)
        encoding = 'utf8'
      }
      if (data === undefined || data === null || Buffer.isBuffer(data)) return data
      data = String(data)
      return encoding == 'utf8' ? data : new Buffer(data, encoding)
    }

  , toEncoding = function (buffer, encoding) {
      return encoding == 'binary'
        ? buffer
        : encoding == 'json'
          ? JSON.parse(buffer.toString('utf8'))
          : buffer.toString(encoding)
    }

  , extend = function (dst, src) {
      for (var p in src) dst[p] = src[p]
      return dst
    }

  , copy = function (srcdb, dstdb, callback) {
      srcdb.readStream()
        .pipe(dstdb.writeStream({useBatch:false}))
        .on('close', callback ? callback : function () {})
        .on('error', callback ? callback : function (err) { throw err })
    }

module.exports = {
    toBuffer   : toBuffer
  , toEncoding : toEncoding
  , extend     : extend
  , copy       : copy
}