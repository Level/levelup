/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var toBuffer = function (data, encoding) {
      if (encoding == 'json') {
        data = JSON.stringify(data)
        encoding = 'utf8'
      }
      return data === undefined || data === null || Buffer.isBuffer(data) ? data : new Buffer(String(data), encoding)
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
      srcdb.readStream().pipe(dstdb.writeStream().on('close', callback))
    }

module.exports = {
    toBuffer   : toBuffer
  , toEncoding : toEncoding
  , extend     : extend
  , copy       : copy
}