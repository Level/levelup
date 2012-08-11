var toBuffer = function (data, encoding) {
      return data === undefined || data === null || Buffer.isBuffer(data) ? data : new Buffer('' + data, encoding)
    }

  , toEncoding = function (buffer, encoding) {
      return encoding == 'binary' ? buffer : buffer.toString(encoding)
    }

module.exports = {
    toBuffer   : toBuffer
  , toEncoding : toEncoding
}