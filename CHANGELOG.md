0.8.0 @ 17 Apr 2013
===================
  * More comprehensive argument checking, will now report back directly or throw if there is a problem rather than on nextTick (@rvagg)
  * Expose `.options` property on LevelUP instances. (@rvagg)
  * Further clarify 'encoding' -> 'valueEncoding' shift. db.options.valueEncoding is now authoritative even if user used 'encoding' on initialisation. (@rvagg)
  * 'level' package now published to npm that bundles LevelUP & LevelDOWN and exposes LevelUP directly; for planned shift to detaching LevelDOWN as a direct-dependency of LevelUP. (@rvagg)

0.7.0 @ 8 Apr 2013
==================
  * Windows support in LevelDOWN @0.2.0 (@rvagg)
  * added 'db' option on constructor to replace LevelDOWN (@rvagg)
  * added repair() & destroy() aliases for LevelDOWN implementations (@rvagg)
  * fix early 'close' emit in WriteStream (@rvagg)
  * improved ReadStream reverse=true start key handling (@kesla)
  * ReadStream empty start & end keys ignored rather than segfault (@kesla)
  * 'encoding' option now an alias for 'valueEncoding' only, 'keyEncoding' defaults to 'utf8' and must be changed explicitly (@rvagg)

0.6.2 @ 4 Mar 2013
==================
  * use `xtend` package instead of internal util._extend @ralphtheninja
  * internal cleanup of `callback` argument detection @ralphtheninja
  * move deferred-open-operations into an internal `this._db` wrapper rather than make them call public .get()/.put() etc. for a second time @dominictarr

0.6.1 @ 1 Mar 2013
==================
  * internal code cleanup & refactoring @ralphtheninja
  * fix multiple iterator.end() calls in ReadStreams throwing errors (destroy() called while read/next is in progress) #82 #83 #84 @rvagg

0.6.0 @ Feb 25 2013
===================
  * complete transition to LevelDOWN for the LevelDB binding. No native code left in LevelUP @rvagg
    - LevelDOWN now keeps its own ChangeLog at: https://github.com/rvagg/node-leveldown/blob/master/CHANGELOG.md
    - LevelDB@1.9.0 and Snappy@1.1.0 are included in LevelDOWN@0.1.2
  * simplify callback signature (remove extra, undocumented properties from some callbacks) @rvagg / @dominictarr

0.5.4 @ Feb 16 2013
===================
  * explicit namespaces in C++ @rvagg
  * memory leak, Persistent<Function> callback not Dispose()d for `readStream()` @rvagg
  * allow one next() at a time, improve end() handling @rvagg
  * ensure iterator end & next don't conflict @rvagg
  * remove CloseError @ralphtheninja
  * fix put/batch bug in WriteStream#_process() @ralphtheninja
  * remove `useBatch` in `copy()` @rvagg
  * move encodingOpts levelup.js -> util.js @ralphtheninja

0.5.3-1 @ Feb 5 2013
====================
  * non-shrinkwrapped release @rvagg

0.5.3 @ Jan 28 2013
===================
  * `location` exposed as read-only property on db object @rvagg
  * swap bufferstream dependency for simple-bufferstream, remove unnecessary compile @rvagg
  * comment out all sqlite3 benchmarks @ralphtheninja
  * put LevelUP() into closure @ralphtheninja

0.5.2 @ Jan 24 2013
===================
  * fix: incorrect scope in approximateSize function @sandfox

0.5.1 @ Jan 10 2013
===================
  * change `createIfMissing` option default to `true` @rvagg
  * use util._extend instead of local variant @rvagg
  * adjust copyright & contributors @rvagg
  * idempotent open and close, and emit _state as events @dominictarr
  * fix: check that UINT32_OPTION_VALUE is a Uint32 @kesla
  * feature: Support setting size of LRU-cache @kesla
  * use util.inherits() from node core @ralphtheninja

0.4.4 @ Jan 1 2013
==================
  * set maxListeners to Infinity to prevent warnings when using deferred open @juliangruber

0.4.3 @ Dec 31 2012
===================
  * added @kesla to contributors list @rvagg
  * feature: added approximateSize() @kesla

0.4.2 @ Dec 30 2012
===================
  * process.nextTick->setImmediate with polyfill Node 0.9.5 compat @rvagg
  * added @ralphtheninja to contributors list @rvagg

0.4.1 @ Dec 20 2013
===================
  * remove `useBatch` option on `writeStream()` @rvagg

0.4.0 @ Dec 18 2013
===================
  * remove old, unused util functions @rvagg
  * speed up batch() & allow non-Strings to C++ @rvagg
  * fix batch() benchmarks @rvagg
  * improved compression test @rvagg
  * added SQLite3 to test suite @rvagg
  * remove compile warnings on osx @rvagg
  * return Strings not Buffers from C++ when possible @rvagg
  * optimised encoders & decoders @rvagg
  * added basic get() benchmarks @rvagg
  * revamped benchmark suite @rvagg
  * allow JS Strings through to native layer @rvagg
  * cleaner build for osx @rvagg
  * remove compile warnings for solaris @rvagg
  * LevelDB 1.7 @rvagg
  * added `compress` boolean on open() @rvagg

0.3.x and prior
===============
  * stuff