# Changelog

## [Unreleased]

## [2.0.2] - 2018-02-12

### Added
* Add 9 to Travis (@ralphtheninja)

### Changed
* Update `browserify` to `16.0.0` (@ralphtheninja)
* Update `leveldown` to `3.0.0` (@ralphtheninja)
* Update `deferred-leveldown` to `3.0.0` (@ralphtheninja)
* README: normalize readme style (@ralphtheninja)
* README: use markdown links instead of `<a href></a>` (@ralphtheninja)
* Clarify 'must provide db' error message (@adityapurwa)
* Update copyright year to 2018 (@adityapurwa)

### Removed
* Remove `abstract-leveldown` devDependency (@ralphtheninja)

## [2.0.1] - 2017-11-11

### Changed
* README: clarify that options are specific to the underlying store (@ralphtheninja)
* Update `abstract-leveldown` to `3.0.0` (@ralphtheninja)
* Update `encoding-down` to `3.0.0` (@ralphtheninja)

### Fixed
* Restore support for node 4 (@farskipper)

## [2.0.0] - 2017-10-10

### Added
* Add default export (@zixia)
* Test that key and value of queued operation is not serialized (@vweevers)
* Test JSON encoding with stream (@vweevers)
* Add smoke test for `levelup` and `leveldown` without `encoding-down` (@vweevers)

### Changed
* Update `leveldown` (@ralphtheninja)
* README: prefer 'underlying store' over database, backend etc (@vweevers)
* README: update badges (@ralphtheninja)
* README: unquote properties (@vweevers)
* README: clarify what excluding callback means (@vweevers)
* README: 'arbitrary data object' => 'of any type' (@vweevers)
* README: reduce 'supported platforms' section (@vweevers)
* README: rewrite intro and relationship with leveldown (@vweevers)
* README: cleanup (@vweevers)
* README: fix bad async code example (@ralphtheninja)
* Update `deferred-leveldown` (@ralphtheninja)

### Removed
* Remove unstable typings and Typescript tests (@MeirionHughes)

## [2.0.0-rc3] - 2017-09-15

### Changed
* Refactor typings, use `abstract-leveldown` types (@MeirionHughes)
* Update `leveldown` (@MeirionHughes)

### Fixed
* Correct bad encoding options in tests (@MeirionHughes)

## [2.0.0-rc2] - 2017-09-11

### Added
* README: add node version badge (@ralphtheninja)
* Add Typescript definitions and testing (@MeirionHughes)

### Changed
* README: homogenize readme style (@vweevers)
* Update `level-errors` (@ralphtheninja)
* Optimize Typescript tests (@vweevers)

### Removed
* Remove 7 from Travis (@ralphtheninja)

## [2.0.0-rc1] - 2017-09-01

### Added
* Add `Promise` to the API if callbacks are omitted (@juliangruber)
* Add Greenkeeper badge (@ralphtheninja)
* Add tests for `maybeError()` calling back synchronously if db is closed (@ralphtheninja)

### Changed
* Update `deferred-leveldown` to `2.0.0` (@ralphtheninja)
* Change `levelup` constructor to take store as first parameter (@ralphtheninja)
* Switch to use `AbstractLevelDOWN#status` (@ralphtheninja)
* Update copyright year to 2017 (@ralphtheninja)
* Rename `lib/util.js` to `lib/promisify.js` (@ralphtheninja)

### Removed
* Remove `approximateSize()` (@ralphtheninja)
* Remove `destroy()` (@ralphtheninja)
* Remove `repair()` (@ralphtheninja)
* Remove `getProperty()` (@ralphtheninja)
* Remove `.errorIfExists` (@ralphtheninja)
* Remove `.createIfMissing` (@ralphtheninja)
* Remove `.compression` (@ralphtheninja)
* Remove `.cacheSize` (@ralphtheninja)
* Remove `.sync` (@ralphtheninja)
* Remove `.fillCache` (@ralphtheninja)
* Remove optional `leveldown` (@ralphtheninja)
* Remove unused `options` parameter from `maybeError` (@ralphtheninja)
* Remove `browser` field from `package.json` (@ralphtheninja)
* Remove 0.12 and 4 from Travis (@juliangruber)
* Remove unused `isDefined` from `lib/util.js` (@ralphtheninja)
* Remove encodings (@ralphtheninja)
* Remove `dispatchError()`, callback is always a function (@ralphtheninja)

### Fixed
* Fix problems with zalgo in `maybeError()` (@ralphtheninja)

## [1.3.9] - 2017-07-26

### Added
* Add `standard` for linting (@ralphtheninja)
* Add 8 to Travis (@ralphtheninja)

### Changed
* Ignore `package-lock.json` and `yarn.lock` (@ralphtheninja)
* README: make code examples adhere to `standard` (@ralphtheninja)
* Update dependencies (@ralphtheninja)

## [1.3.8] - 2017-05-29

### Changed
* Revert previous `getLevelDOWN` fix (@ralphtheninja)
* Throw more descriptive error if db factory is not a function (@ralphtheninja)

## [1.3.7] - 2017-05-24

### Fixed
* Avoid calling `getLevelDOWN` if not present (@diasdavid)

## [1.3.6] - 2017-05-10

### Changed
* Pull `LevelDOWN` loader out to non browserified module (@kemitchell)

## [1.3.5] - 2017-03-02

### Changed
* Explicitly require `leveldown/package.json` (@PascalTemel)

## [1.3.4] - 2017-03-02

### Added
* Add 7 to Travis (@ralphtheninja)

### Removed
* Remove 0.10 and 5 from Travis (@ralphtheninja)

## [1.3.3] - 2016-10-09

### Changed
* README: fix typo (@jamesgrayling)
* README: fix typo (@danielravina)
* README: fix typo (@juliangruber)

## [1.3.2] - 2016-05-17

### Added
* Add node 6 to Travis (@ralphtheninja)

### Changed
* Use `sudo: false` to run tests in containers on Travis (@ralphtheninja)
* Update `package.json` (@0x00A)
* README: fix typos (@pra85)
* README: changed build status ticker from png to svg (@montyanderson)
* README: link build badge to master branch (@a0viedo)
* Update copyright year to 2016 (@ralphtheninja)
* Rename `appromixate-size-test.js` to `approximate-size-test.js` (@ralphtheninja)

### Removed
* Remove non supported versions from Travis (@ralphtheninja)

### Fixed
* Ensure Travis can compile in case no prebuilt binaries can be found (@ralphtheninja)
* Fix deprecation test (@juliangruber)

## [1.3.1] - 2015-12-10

### Added
* Add node 5 to travis (@ralphtheninja)

### Changed
* Update outdated dependencies (@ralphtheninja)
* Test on latest node 2, node 3 (@ralphtheninja)

## [1.3.0] - 2015-11-12

### Changed
* README: fixed small typo (Stephen Sawchuck)
* README: update url to Snappy (@hansott)
* README: add dependency badge (@ralphtheninja)
* Test on all major abi versions (@ralphtheninja)
* Update outdated dependencies (@ralphtheninja)
* Track and expose chained batch ops queue length (@kemitchell)

### Fixed
* Dev depend on `tap` to fix `npm@3` warning (@ralphtheninja)

## [1.2.1] - 2015-06-10

### Changed
* Improve error message when trying to require `leveldown` (@ralphtheninja)

## [1.2.0] - 2015-06-04

### Changed
* Less restrictive version on `leveldown` (@ralphtheninja)

### Fixed
* Handle errors in benchmarks (@juliangruber)

## [1.1.1] - 2015-05-29

### Added
* Add link to `level/community` (@ralphtheninja)

### Changed
* Update `leveldown` dependency (@juliangruber)

### Removed
* Remove compression tests (@juliangruber)

## [1.1.0] - 2015-05-17

### Changed
* Batch operation default to `'put'` (@ralphtheninja)

## [1.0.0] - 2015-05-14

### Removed
* Remove return values from `dispatchError()` and `readError()`, they are used as voids (@ralphtheninja)

## [1.0.0-5] - 2015-05-07

### Changed
* Target multiple iojs versions, remove notifications (@ralphtheninja)
* Deprecate static functions `destroy()` and `repair()` (@juliangruber)

## [1.0.0-4] - 2015-05-06

### Changed
* Deprecate `.approximateSize()` (@juliangruber)

## [1.0.0-3] - 2015-05-05

### Changed
* Replace `tap` with `tape` + `faucet` (@ralphtheninja)
* Refactor read streams using `level-iterator-stream` and `level-codec` (@juliangruber)

## [1.0.0-2] - 2015-04-30

### Changed
* Refactor ltgt encoding (@juliangruber)

### Fixed
* Fix readStream \*AsBuffer options (@juliangruber)

## [1.0.0-1] - 2015-04-28

### Added
* Add test for `valueEncoding` `'hex'` for `createReadStream` (@braydonf)

### Changed
* Update dependencies (@ralphtheninja)

### Fixed
* Fix `valueEncoding` bug by passing options without array (@braydonf)

## [1.0.0-0] - 2015-04-28

### Added
* Add @jcrugzz as contributor
* Add 0.12 and iojs to Travis (@ralphtheninja)

### Changed
* Support values to be `null` or `undefined` (@kesla)
* README: explain callback arguments to `del` (@bewest)
* README: update logo and copyright (@ralphtheninja)
* README: remove docs on `createWriteStream()` and add note on what happened to it (@jcrugzz)
* README: tweak explanation on why `createWriteStream()` was removed (@ralphtheninja)
* README: clean up old `level-ws` reference (@ralphtheninja)
* README: changed options for get to same as put (@RichardLitt)
* README: remove reference to write-stream and iterators (@ralphtheninja)
* Explicit devdep versions (@rvagg)
* Update Travis and `package.json` scripts (@jcrugzz)
* Added errors to the available namespace when requiring `levelup` (@braydonf)
* Extract error codes into `level-errors` module (@ralphtheninja)
* Use `level-codec` (@juliangruber)
* Refactor iterators using new `deferred-leveldown` (@juliangruber)

### Removed
* Remove 0.8 from Travis (@rvagg)
* Remove references to write-stream in tests (@jcrugzz)
* Remove references to write-stream (@jcrugzz)
* Remove fstream based tests (@jcrugzz)
* Remove `copy` as it requires write-stream (@jcrugzz)
* Remove unused dependencies (@ralphtheninja)
* Remove `encoding` option (@juliangruber)
* Remove `leveled` benchmarks (@juliangruber)

### Fixed
* README: fix the leveldb link (@seriousManual)
* Use newer memdown store (@sorribas)
* Check `notFound` on err (@doowb)
* Fix benchmarks by installing `leveldown@^0.10.4` (@juliangruber)
* Fix `stream-bench.js` (@juliangruber)
* Replace `rvagg/node-` with `level` (@ralphtheninja)

## [0.19.1] - 2016-01-23

### Added
* Add 0.12, 1.0, 1.8, 2, 3, 4, 5 to Travis (@ralphtheninja)
* Add `tape@4.x.x` (@ralphtheninja)

### Changed
* Update `semver` (@ralphtheninja)
* Update `tap` (@ralphtheninja)
* Update compiler on Travis (@ralphtheninja)
* Fix `bustermove` version (@ralphtheninja)

### Removed
* Remove 0.8 from Travis (@ralphtheninja)

## [0.19.0] - 2014-08-26

### Added
* Add suport for `lt`, `lte`, `gt`, and `gte` (@dominictarr)
* Add `isDefined` to util (@dominictarr)

### Changed
* Refactor encodings and codec from util to separate file (@dominictarr)
* Decouple codec from levelup parts for allowing arbitrary encoding strategies (@dominictarr)
* Decouple read-stream from encoding and opening stuff (@dominictarr)
* Keep codec on the db as `db._codec` (@dominictarr)
* Refactor error checks (@dominictarr)
* README: document `lt`, `lte`, `gt`, and `gte` (@dominictarr)
* README: clarify ltgt (@dominictarr)
* README: unmention bops (@dominictarr)
* README: discourage the use of `start` and `end` a bit (@raboof)
* README: document what `limit` does in reverse mode (@raboof)
* README: use highest/lowest instead of largest/smallest (@raboof)
* Binary encoding in the browser (@calvinmetcalf)
* Document code with comments (@dominictarr)
* Minor style fixes (@rvagg)
* Minor whitespace changes (@rvagg)
* Update nodeico badge (@rvagg)

### Fixed
* Fix license (@rvagg)

## [0.18.6] - 2014-07-26

### Changed
* Change from MIT +no-false-attribs License to plain MIT (@andrewrk)
* Upgrade `bl` dependency (@raynos)

## [0.18.5] - 2014-06-26

### Fixed
* Replace `concat-stream` with `bl`, fixes [#251](https://github.com/Level/levelup/issues/251) (@rvagg)

## [0.18.4] - 2014-06-24

### Changed
* Reorder dependencies (@juliangruber)
* Update dependencies (@rvagg)

### Fixed
* Fix race condition on read stream's `self._iterator` (@nolanlawson)

## [0.18.3] - 2014-04-26

### Changed
* README: fix formatting (@rvagg)
* README: minor corrections (@guybrush)
* README: fix leveldown method wording (@juliangruber)
* README: clarify `start`, `end` and `limit` options in `createReadStream` docs (@maxogden)

### Removed
* Remove `bops` and use `Buffer` instead (@nolanlawson)

## [0.18.2] - 2013-11-26

### Added
* Add `DNT` configuration (@rvagg)

### Changed
* Use `readable-stream` from user land across all node version (@rvagg)

## [0.18.1] - 2013-11-20

### Changed
* Make chained-batch obey global LevelUP object options (@mcavage)

## [0.18.0] - 2013-11-18

### Changed
* Upgrade to `LevelDOWN@0.10.0` (and bops@0.1.0 and readable-stream@1.1.9) (@rvagg)

## [0.17.0] - 2013-10-01

### Changed
* Undo factory pattern, use plain prototypal object and expose full prototype (@rvagg)
* Move Batch object to batch.js and expose (@rvagg)
* Use new package, DeferredLevelDOWN to handle all deferred open logic (@rvagg)
* Code cleanup, update deps (xtend) (@rvagg, @juliangruber)

## [0.16.0] - 2013-09-10

### Added
* Add `notFound` boolean property and `status=404` property to NotFoundError (@rvagg)

### Changed
* Upgrade to `errno@0.1.0` which aliases `.type` and `.name` properties (@rvagg)
* ReadStream gracefully handles multiple `destroy()` calls (@mcollina)

## [0.15.0] - 2013-08-26

### Added
* Add @substack as contributor

### Changed
* New ReadStream: upgrade to streams2, remove all state-management cruft, remove fstream support (@substack)
* Update LevelDOWN dependency to ~0.8.0 with Iterator lt/lte/gt/gte support and NAN as a dependency (@rvagg)

## [0.14.0] - 2013-08-19

### Changed
* Encodings overhaul, allow custom encoders/decoders for `keyEncoding` or `valueEncoding` (@dominictarr)

## [0.13.0] - 2013-08-11

### Changed
* Update LevelDOWN dependency version ~0.7.0 for Node 0.8->0.11 compatibility (@rvagg)

## [0.12.0] - 2013-07-25

### Changed
* Update LevelDOWN dependency version ~0.6.2 (@rvagg)

## [0.11.0] - 2013-07-17

### Added
* Add @pgte as contributor

### Changed
* Switch from direct Buffer access to bops for better browser compatibility (@juliangruber)
* WriteStream#end accepts `data` argument (@pgte)

### Removed
* Remove all Function#bind calls for better browser compatibility (@juliangruber)

## [0.10.0] - 2013-06-14

### Changed
* Upgrade to `LevelDOWN@0.6.0` which upgrades to `LevelDB@1.11.0`, some important bugfixes: https://groups.google.com/forum/#!topic/leveldb/vS1JvmGlp4E (@rvagg)

## [0.9.0] - 2013-05-21

### Changed
* Use LevelDOWN@0.5.0, see https://github.com/level/leveldown/blob/master/CHANGELOG.md for details (@rvagg)
* Race-condition(ish) fixed in ReadStream--createReadStream() does not start immediately and therefore allowed put()s to happen before the stream starts (@dominictarr)
* ReadStream doesn't emit "ready" event (@dominictarr)
* Allow separate encodings per operation in db.batch() (@juliangruber)
* Allow separate encodings per write() in WriteStream (@juliangruber)
* WriteStream supports "type" option ("put" [default] or "del") on constructor and individual write()s (@mcollina)
* Expose LevelDOWN (or LevelDOWN substitute) as `db` property on LevelUP instance (e.g. db.db.approximateSize()) (@rvagg)
* Chained batch exposed from LevelDOWN, invoked with argument-less db.batch() (@juliangruber, @rvagg)
* Significantly improve ReadStream performance by replacing .bind() and .apply() (@mcollina, @kesla)
* Better Browserify support (@rvagg, @juliangruber, @maxogden, etc.)
* Deprecate secondary LevelDB-specific operations on LevelUP, prefer direct LevelDOWN access (approximateSize(), repair(), destroy(), getProperty()--new in LevelDOWN@0.5.0) (@rvagg)

### Removed
* Remove "leveldown" from dependencies (see http://r.va.gg/2013/05/levelup-v0.9-some-major-changes.html) (@rvagg)

## [0.8.0] - 2013-04-17

### Changed
* More comprehensive argument checking, will now report back directly or throw if there is a problem rather than on nextTick (@rvagg)
* Expose `.options` property on LevelUP instances. (@rvagg)
* Further clarify 'encoding' -> 'valueEncoding' shift. db.options.valueEncoding is now authoritative even if user used 'encoding' on initialisation. (@rvagg)
* `level` package now published to npm that bundles `LevelUP` and `LevelDOWN` and exposes `LevelUP` directly; for planned shift to detaching LevelDOWN as a direct-dependency of LevelUP. (@rvagg)

## [0.7.0] - 2013-04-08

### Added
* Add windows support in `LevelDOWN@0.2.0` (@rvagg)
* Add 'db' option on constructor to replace LevelDOWN (@rvagg)
* Add `repair()` and `destroy()` aliases for LevelDOWN implementations (@rvagg)

### Changed
* Improved ReadStream reverse=true start key handling (@kesla)
* ReadStream empty start and end keys ignored rather than segfault (@kesla)
* 'encoding' option now an alias for `valueEncoding` only, `keyEncoding` defaults to `'utf8'` and must be changed explicitly (@rvagg)

### Fixed
* Fix early `close` emit in WriteStream (@rvagg)

## [0.6.2] - 2013-03-04

### Changed
* Use `xtend` package instead of internal `util._extend` (@ralphtheninja)
* Internal cleanup of `callback` argument detection (@ralphtheninja)
* Move deferred-open-operations into an internal `this._db` wrapper rather than make them call public .get()/.put() etc. for a second time (@dominictarr)

## [0.6.1] - 2013-03-01

### Changed
* Internal code cleanup and refactoring (@ralphtheninja)

### Fixed
* Fix multiple `iterator.end()` calls in ReadStreams throwing errors, destroy() called while read/next is in progress #82 #83 #84 (@rvagg)

## [0.6.0] - 2013-02-25

### Changed
* Rename `ReadStream`, `KeyStream` and `ValueStream` to `createReadStream`, `createKeyStream` and `createValueStream` (@rvagg)
* Complete transition to `LevelDOWN` for the `LevelDB` binding. No native code left in `LevelUP` (@rvagg)
  - LevelDOWN now keeps its own ChangeLog at: https://github.com/level/leveldown/blob/master/CHANGELOG.md
  - LevelDB@1.9.0 and Snappy@1.1.0 are included in LevelDOWN@0.1.2

## [0.6.0-rc1] - 2013-02-24

### Changed
* Refactor and simplify db state code (@ralphtheninja)
* Extract all binding code to `leveldown` project (@rvagg)
* Depend on `leveldown@0.0.1` (@rvagg)
* Simplify callback signature by removing extra, undocumented properties from some callbacks (@rvagg, @dominictarr)

## [0.5.4] - 2013-02-15

### Changed
* Move `encodingOpts` from `levelup.js` to `util.js` (@ralphtheninja)
* Allow one `next()` at a time, improve `end()` handling (@rvagg)
* Use explicit namespaces in C++ (@rvagg)

### Removed
* Remove `CloseError` (@ralphtheninja)
* Remove `.useBatch` in `copy()` (@ralphtheninja)
* Ensure iterator `end` and `next` don't conflict (@rvagg)

### Fixed
* Fix `put`/`batch` bug in `WriteStream#_process()` (@ralphtheninja)
* Fix memory leak, `Persistent<Function>` callback not Dispose()d for `readStream()` (@rvagg)

## [0.5.3-1] - 2013-02-05

### Changed
* Non shrinkwrapped release @rvagg

## [0.5.3] - 2013-01-28

### Changed
* Disable all sqlite3 benchmarks (@ralphtheninja)
* Put `LevelUP()` into closure (@ralphtheninja)
* Swap `bufferstream` dependency for `simple-bufferstream` (@rvagg)
* Make `location` a read-only property on db object (@rvagg)

## [0.5.2] - 2013-01-23

### Fixed
* Fix incorrect scope in approximateSize function (@sandfox)

## [0.5.1] - 2013-01-10

### Changed
* Version bump (@rvagg)

## [0.5.0-1] - 2013-01-09

### Added

### Changed
* Change `createIfMissing` option default to `true` (@rvagg)
* Use `util._extend` instead of local variant (@rvagg)

## [0.5.0] - 2013-01-08

### Added
* Add support for setting size of LRU-cache (@kesla)

### Changed
* Use `util.inherits()` from node core (@ralphtheninja)
* Adjust copyright & contributors (@rvagg)

### Fixed
* Idempotent open and close, and emit _state as events (@dominictarr)
* Check that UINT32_OPTION_VALUE is a Uint32 (@kesla)

## [0.4.4] - 2013-01-01

### Fixed
* Set `.maxListeners` to `Infinity` to prevent warnings when using deferred open (@juliangruber)

## [0.4.3] - 2012-12-30

### Added
* Add @kesla to contributors list (@rvagg)
* Add `approximateSize()` (@kesla)

## [0.4.2] - 2012-12-30

### Added
* Add @ralphtheninja to contributors list (@rvagg)

### Fixed
* Use `setImmediate` instead of `process.nextTick` for `node@0.9.5` compatibility (@rvagg)

## [0.4.1] - 2012-12-19

### Removed
* Remove `useBatch` option on `writeStream()` @rvagg

## [0.4.0] - 2012-12-17

### Added
* Add SQLite3 to test suite (@rvagg)
* Add basic `get()` benchmarks (@rvagg)
* Add `compress` boolean on `open()` (@rvagg)

### Changed
* Speed up `batch()` and allow non-Strings to C++ (@rvagg)
* Improved compression test (@rvagg)
* Return Strings not Buffers from C++ when possible (@rvagg)
* Optimised encoders and decoders (@rvagg)
* Revamped benchmark suite (@rvagg)
* Allow JS Strings through to native layer (@rvagg)
* Cleaner build for osx (@rvagg)
* Update to `LevelDB@1.7` (@rvagg)

### Removed
* Remove old and unused util functions (@rvagg)
* Remove compile warnings on osx (@rvagg)
* Remove compile warnings for solaris (@rvagg)

### Fixed
* Fix `batch()` benchmarks (@rvagg)

## [0.3.3] - 2012-12-14

### Added
* Add compression tests (@rvagg)

### Fixed
* Fix Snappy compression (@rvagg)

## [0.3.2] - 2012-11-24

### Added
* Add more functional tests (@rvagg)
* Add snapshot tests (@rvagg)

### Changed
* Emit raw keys and values in events (@rvagg)

## [0.3.1] - 2012-11-21

### Added
* Add benchmark suite (@rvagg)
* Add `limit` option to `ReadStream` (@rvagg)

## [0.3.0] - 2012-11-18

### Added
* Add `.status` property to keep track of db status (@raynos, @rvagg)
* Add `CloseError` error type (@raynos, @rvagg)
* Add tests for deferred operations (@rvagg)

### Changed
* Document events (@rvagg)
* Run the encoding on `start` and `end` in case your keys are JSON encoded (@raynos)
* First attempt at deferring operations. All operations that used to throw when called before open are now called once the database is open (@raynos, @rvagg)

### Fixed
* If status is `'closing'`, call callback after db is closed (@raynos, @rvagg)

## [0.2.1] - 2012-10-28

### Fixed
* Fix db GC when using multiple `ReadStream` (@rvagg)

## [0.2.0] - 2012-10-28

### Added
* Add support for Solaris/SunOS/SmartOS (@rvagg)

## [0.1.2] - 2012-10-26

### Fixed
* Fix bug with falsey values on `start` and `end`, fixes [#8](https://github.com/Level/levelup/issues/8) (@rvagg)

## [0.1.1] - 2012-10-17

### Fixed
* Fix bug with sticky options, fixes [#6](https://github.com/Level/levelup/issues/6) (@rvagg)

## [0.1.0] - 2012-09-28

### Added
* Add Travis setup (@rvagg)
* Add `KeyStream()` and `ValueStream()` (@rvagg)

## [0.0.5-1] - 2012-09-28

### Added
* Add description to `package.json` (@rvagg)

## [0.0.5] - 2012-09-22

### Changed
* Native layer errors if `key` or `value` are `undefined` or `null` (@rvagg)

## [0.0.4] - 2012-09-12

### Fixed
* Fix bug with `options` not being passed to readable streams (@rvagg)

## [0.0.3] - 2012-09-09

### Added
* Add `reverse` functionality to readable streams (@rvagg)

## [0.0.2-1] - 2012-09-07

### Added
* Add repository information to `package.json` (@rvagg)

## [0.0.2] - 2012-09-07

### Changed
* Do not encourage using async `throw` in documentation (@rvagg)
* Return to classical prototypal inheritance (@rvagg)

### Fixed
* Fix typos in documentation (@rvagg)

## [0.0.1] - 2012-08-31

### Added
* Add `start` and `end` options for readable streams (@rvagg)
* Add `'json'` encoding (@rvagg)
* Add `.nextLocation()`, `.checkBinaryTestData()`, `.loadBinaryTestData()`, `.openTestDatabase()`, `.commonTearDown()`, `.commonSetup()` and `.binaryTestDataMD5Sum` to `test/common.js` (@rvagg)
* Add tests for `.readStream()` with `start` being midway key (@rvagg)
* Add keywords to `package.json` (@rvagg)

### Changed
* New API. Database constructor now accepts callback (@rvagg)
* Update documentation for new API (@rvagg)

### Removed
* Remove usage of `global` in tests (@rvagg)

## [0.0.0-1] - 2012-08-18

### Added
* Add `bufferstream` dependency (@rvagg)

### Changed
* Document `ReadStream` and `WriteStream` (@rvagg)
* Start using `~` in dependencies (@rvagg)

### Removed
* Remove unused `inherits` variable (@rvagg)

## 0.0.0 - 2012-08-17

:seedling: Initial release.

[Unreleased]: https://github.com/level/levelup/compare/v2.0.2...HEAD
[2.0.2]: https://github.com/level/levelup/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/level/levelup/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/level/levelup/compare/v2.0.0-rc3...v2.0.0
[2.0.0-rc3]: https://github.com/level/levelup/compare/v2.0.0-rc2...v2.0.0-rc3
[2.0.0-rc2]: https://github.com/level/levelup/compare/v2.0.0-rc1...v2.0.0-rc2
[2.0.0-rc1]: https://github.com/level/levelup/compare/v1.3.9...v2.0.0-rc1
[1.3.9]: https://github.com/level/levelup/compare/v1.3.8...v1.3.9
[1.3.8]: https://github.com/level/levelup/compare/v1.3.7...v1.3.8
[1.3.7]: https://github.com/level/levelup/compare/v1.3.6...v1.3.7
[1.3.6]: https://github.com/level/levelup/compare/v1.3.5...v1.3.6
[1.3.5]: https://github.com/level/levelup/compare/v1.3.4...v1.3.5
[1.3.4]: https://github.com/level/levelup/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/level/levelup/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/level/levelup/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/level/levelup/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/level/levelup/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/level/levelup/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/level/levelup/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/level/levelup/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/level/levelup/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/level/levelup/compare/v1.0.0-5...v1.0.0
[1.0.0-5]: https://github.com/level/levelup/compare/v1.0.0-4...v1.0.0-5
[1.0.0-4]: https://github.com/level/levelup/compare/v1.0.0-3...v1.0.0-4
[1.0.0-3]: https://github.com/level/levelup/compare/v1.0.0-2...v1.0.0-3
[1.0.0-2]: https://github.com/level/levelup/compare/v1.0.0-1...v1.0.0-2
[1.0.0-1]: https://github.com/level/levelup/compare/v1.0.0-0...v1.0.0-1
[1.0.0-0]: https://github.com/level/levelup/compare/v0.19.0...v1.0.0-0
[0.19.1]: https://github.com/level/levelup/compare/v0.19.0...v0.19.1
[0.19.0]: https://github.com/level/levelup/compare/v0.18.6...v0.19.0
[0.18.6]: https://github.com/level/levelup/compare/v0.18.5...v0.18.6
[0.18.5]: https://github.com/level/levelup/compare/v0.18.4...v0.18.5
[0.18.4]: https://github.com/level/levelup/compare/v0.18.3...v0.18.4
[0.18.3]: https://github.com/level/levelup/compare/v0.18.2...v0.18.3
[0.18.2]: https://github.com/level/levelup/compare/v0.18.1...v0.18.2
[0.18.1]: https://github.com/level/levelup/compare/0.18.0...v0.18.1
[0.18.0]: https://github.com/level/levelup/compare/0.17.0...0.18.0
[0.17.0]: https://github.com/level/levelup/compare/0.16.0...0.17.0
[0.16.0]: https://github.com/level/levelup/compare/0.15.0...0.16.0
[0.15.0]: https://github.com/level/levelup/compare/0.14.0...0.15.0
[0.14.0]: https://github.com/level/levelup/compare/0.13.0...0.14.0
[0.13.0]: https://github.com/level/levelup/compare/0.12.0...0.13.0
[0.12.0]: https://github.com/level/levelup/compare/0.11.0...0.12.0
[0.11.0]: https://github.com/level/levelup/compare/0.10.0...0.11.0
[0.10.0]: https://github.com/level/levelup/compare/0.9.0...0.10.0
[0.9.0]: https://github.com/level/levelup/compare/0.8.0...0.9.0
[0.8.0]: https://github.com/level/levelup/compare/0.7.0...0.8.0
[0.7.0]: https://github.com/level/levelup/compare/0.6.2...0.7.0
[0.6.2]: https://github.com/level/levelup/compare/0.6.1...0.6.2
[0.6.1]: https://github.com/level/levelup/compare/0.6.0...0.6.1
[0.6.0]: https://github.com/level/levelup/compare/0.6.0-rc1...0.6.0
[0.6.0-rc1]: https://github.com/level/levelup/compare/0.5.4...0.6.0-rc1
[0.5.4]: https://github.com/level/levelup/compare/0.5.3-1...0.5.4
[0.5.3-1]: https://github.com/level/levelup/compare/0.5.3...0.5.3-1
[0.5.3]: https://github.com/level/levelup/compare/0.5.2...0.5.3
[0.5.2]: https://github.com/level/levelup/compare/0.5.1...0.5.2
[0.5.1]: https://github.com/level/levelup/compare/0.5.0-1...0.5.1
[0.5.0-1]: https://github.com/level/levelup/compare/0.5.0...0.5.0-1
[0.5.0]: https://github.com/level/levelup/compare/0.4.4...0.5.0
[0.4.4]: https://github.com/level/levelup/compare/0.4.3...0.4.4
[0.4.3]: https://github.com/level/levelup/compare/0.4.2...0.4.3
[0.4.2]: https://github.com/level/levelup/compare/0.4.1...0.4.2
[0.4.1]: https://github.com/level/levelup/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/level/levelup/compare/0.3.3...0.4.0
[0.3.3]: https://github.com/level/levelup/compare/0.3.2...0.3.3
[0.3.2]: https://github.com/level/levelup/compare/0.3.1...0.3.2
[0.3.1]: https://github.com/level/levelup/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/level/levelup/compare/0.2.1...0.3.0
[0.2.1]: https://github.com/level/levelup/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/level/levelup/compare/0.1.2...0.2.0
[0.1.2]: https://github.com/level/levelup/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/level/levelup/compare/0.1.0...0.1.1
[0.1.0]: https://github.com/level/levelup/compare/0.0.5-1...0.1.0
[0.0.5-1]: https://github.com/level/levelup/compare/0.0.5...0.0.5-1
[0.0.5]: https://github.com/level/levelup/compare/0.0.4...0.0.5
[0.0.4]: https://github.com/level/levelup/compare/0.0.3...0.0.4
[0.0.3]: https://github.com/level/levelup/compare/0.0.2-1...0.0.3
[0.0.2-1]: https://github.com/level/levelup/compare/0.0.2...0.0.2-1
[0.0.2]: https://github.com/level/levelup/compare/0.0.1...0.0.2
[0.0.1]: https://github.com/level/levelup/compare/0.0.0-1...0.0.1
[0.0.0-1]: https://github.com/level/levelup/compare/0.0.0...0.0.0-1
