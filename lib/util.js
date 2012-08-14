/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var toBuffer = function (data, encoding) {
      return data === undefined || data === null || Buffer.isBuffer(data) ? data : new Buffer('' + data, encoding)
    }

  , toEncoding = function (buffer, encoding) {
      return encoding == 'binary' ? buffer : buffer.toString(encoding)
    }

  , copy = function (srcdb, dstdb, callback) {
      srcdb.readStream().pipe(dstdb.writeStream().on('close', callback))
    }

module.exports = {
    toBuffer   : toBuffer
  , toEncoding : toEncoding
  , copy       : copy
}