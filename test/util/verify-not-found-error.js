'use strict'

const nfre = /NotFound/i

// TODO: by code (https://github.com/Level/errors/issues/39)
module.exports = function verifyNotFoundError (err) {
  return nfre.test(err.message) || nfre.test(err.name)
}
