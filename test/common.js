// Same interface as abstract-leveldown's testCommon
module.exports = function testCommon (options) {
  const factory = options.factory
  const test = options.test

  if (typeof factory !== 'function') {
    throw new TypeError('factory must be a function')
  }

  if (typeof test !== 'function') {
    throw new TypeError('test must be a function')
  }

  return {
    test: test,
    factory: factory,

    bufferKeys: options.bufferKeys !== false,
    // createIfMissing: options.createIfMissing !== false,
    // errorIfExists: options.errorIfExists !== false,
    snapshots: options.snapshots !== false,
    seek: options.seek !== false,
    clear: !!options.clear,
    deferredOpen: !!options.deferredOpen,
    promises: !!options.promises,
    streams: !!options.streams,
    encodings: !!options.encodings,
    openCallback: !!options.openCallback
  }
}
