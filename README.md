LevelUP
=======

![LevelDB Logo](https://twimg0-a.akamaihd.net/profile_images/3360574989/92fc472928b444980408147e5e5db2fa_bigger.png)

Fast & simple storage - a Node.js-style LevelDB wrapper
-------------------------------------------------------

[![Build Status](https://secure.travis-ci.org/rvagg/node-levelup.png)](http://travis-ci.org/rvagg/node-levelup)

**[LevelDB](http://code.google.com/p/leveldb/)** is a simple key/value data store built by Google, inspired by BigTable. It's used in Google Chrome and many other products. LevelDB supports arbitrary byte arrays as both keys and values, singular *get*, *put* and *delete* operations, *batched put and delete*, forward and reverse iteration and simple compression using the [Snappy](http://code.google.com/p/snappy/) algorithm which is optimised for speed over compression.

**LevelUP** aims to expose the features of LevelDB in a Node.js-friendly way. Both keys and values are treated as `Buffer` objects and are automatically converted using a specified `'encoding'`. LevelDB's iterators are exposed as a Node.js style object-`ReadStream` and writing can be peformed via an object-`WriteStream`.

An important feature of LevelDB is that it stores entries sorted by keys. This makes LevelUP's <a href="#createReadStream"><code>ReadStream</code></a> interface is a very powerful way to look up items, particularly when combined with the `start` option.

The native LevelDB binding is now provided by a separate package, [LevelDOWN](https://github.com/rvagg/node-leveldown/).

**LevelUP** is an **OPEN Open Source Project**, see the <a href="#contributing">Contributing</a> section to find out what this means.

  * <a href="#platforms">Tested & supported platforms</a>
  * <a href="#basic">Basic usage</a>
  * <a href="#api">API</a>
  * <a href="#events">Events</a>
  * <a href="#json">JSON data</a>
  * <a href="#considerations">Important considerations</a>
  * <a href="#contributing">Contributing</a>
  * <a href="#licence">Licence & copyright</a>

See also a list of <a href="https://github.com/rvagg/node-levelup/wiki/Modules"><b>Node.js LevelDB modules and projects</b></a> in the wiki.

<a name="platforms"></a>
Tested & supported platforms
----------------------------

  * **Linux** (including ARM platforms such as Raspberry Pi *and Kindle!*)
  * **Mac OS**
  * **Solaris** (SmartOS & Nodejitsu)
  * **Windows**
    * Node 0.10 and above only, see [issue #5](https://github.com/rvagg/node-levelup/issues/5) for more info
    * See installation instructions for *node-gyp* dependencies [here](https://github.com/TooTallNate/node-gyp#installation), you'll need these (free) components from Microsoft to compile and run any native Node add-on in Windows.

<a name="basic"></a>
Basic usage
-----------

All operations are asynchronous although they don't necessarily require a callback if you don't need to know when the operation was performed.

```js
var levelup = require('levelup')

// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
var db = levelup('./mydb')

// 2) put a key & value
db.put('name', 'LevelUP', function (err) {
  if (err) return console.log('Ooops!', err) // some kind of I/O error

  // 3) fetch by key
  db.get('name', function (err, value) {
    if (err) return console.log('Ooops!', err) // likely the key was not found

    // ta da!
    console.log('name=' + value)
  })
})
```

<a name="api"></a>
## API

  * <a href="#ctor"><code><b>levelup()</b></code></a>
  * <a href="#open"><code>db.<b>open()</b></code></a>
  * <a href="#close"><code>db.<b>close()</b></code></a>
  * <a href="#put"><code>db.<b>put()</b></code></a>
  * <a href="#get"><code>db.<b>get()</b></code></a>
  * <a href="#del"><code>db.<b>del()</b></code></a>
  * <a href="#batch"><code>db.<b>batch()</b></code></a>
  * <a href="#approximateSize"><code>db.<b>approximateSize()</b></code></a>
  * <a href="#isOpen"><code>db.<b>isOpen()</b></code></a>
  * <a href="#isClosed"><code>db.<b>isClosed()</b></code></a>
  * <a href="#createReadStream"><code>db.<b>createReadStream()</b></code></a>
  * <a href="#createKeyStream"><code>db.<b>createKeyStream()</b></code></a>
  * <a href="#createValueStream"><code>db.<b>createValueStream()</b></code></a>
  * <a href="#createWriteStream"><code>db.<b>createWriteStream()</b></code></a>
  * <a href="#destroy"><code><b>levelup.destroy()</b></code></a>
  * <a href="#repair"><code><b>levelup.repair()</b></code></a>


--------------------------------------------------------
<a name="ctor"></a>
### levelup(location[, options[, callback]])
<code>levelup()</code> is the main entry point for creating a new LevelUP instance and opening the underlying store with LevelDB.

This function returns a new instance of LevelUP and will also initiate an <a href="#open"><code>open()</code></a> operation. Opening the database is an asynchronous operation which will trigger your callback if you provide one. The callback should take the form: `function (err, db) {}` where the `db` is the LevelUP instance. If you don't provide a callback, any read & write operations are simply queued internally until the database is fully opened.

This leads to two alternative ways of managing a new LevelUP instance:

```js
levelup(location, options, function (err, db) {
  if (err) throw err
  db.get('foo', function (err, value) {
    if (err) return console.log('foo does not exist')
    console.log('got foo =', value)
  })
})

// vs the equivalent:

var db = levelup(location, options) // will throw if an error occurs
db.get('foo', function (err, value) {
  if (err) return console.log('foo does not exist')
  console.log('got foo =', value)
})
```

The `location` argument is available as a read-only property on the returned LevelUP instance.

#### `options`

`levelup()` takes an optional options object as its second argument; the following properties are accepted:

* `'createIfMissing'` *(boolean, default: `true`)*: If `true`, will initialise an empty database at the specified location if one doesn't already exist. If `false` and a database doesn't exist you will receive an error in your `open()` callback and your database won't open.

* `'errorIfExists'` *(boolean, default: `false`)*: If `true`, you will receive an error in your `open()` callback if the database exists at the specified location.

* `'compression'` *(boolean, default: `true`)*: If `true`, all *compressible* data will be run through the Snappy compression algorithm before being stored. Snappy is very fast and shouldn't gain much speed by disabling so leave this on unless you have good reason to turn it off.

* `'cacheSize'` *(number, default: `8 * 1024 * 1024`)*: The size (in bytes) of the in-memory [LRU](http://en.wikipedia.org/wiki/Cache_algorithms#Least_Recently_Used) cache with frequently used uncompressed block contents. 

* `'keyEncoding'` and `'valueEncoding'` *(string, default: `'utf8'`)*: The encoding of the keys and values passed through Node.js' `Buffer` implementation (see [Buffer#toString()](http://nodejs.org/docs/latest/api/buffer.html#buffer_buf_tostring_encoding_start_end)). You may also use `'encoding'` as an alias for `'valueEncoding'`.
  <p><code>'utf8'</code> is the default encoding for both keys and values so you can simply pass in strings and expect strings from your <code>get()</code> operations. You can also pass <code>Buffer</code> objects as keys and/or values and conversion will be performed.</p>
  <p>Supported encodings are: hex, utf8, ascii, binary, base64, ucs2, utf16le.</p>
  <p><code>'json'</code> encoding is also supported, see below.</p>

* `'db'` *(object, default: LevelDOWN)*: LevelUP is backed by [LevelDOWN](https://github.com/rvagg/node-leveldown/) to provide an interface to LevelDB. You can completely replace the use of LevelDOWN by providing a "factory" function that will return a LevelDOWN API compatible object given a `location` argument. For further information, see [MemDOWN](https://github.com/rvagg/node-memdown/), a fully LevelDOWN API compatible replacement that uses a memory store rather than LevelDB. Also see [Abstract LevelDOWN](http://github.com/rvagg/node-abstract-leveldown), a partial implementation of the LevelDOWN API that can be used as a base prototype for a LevelDOWN substitute.

Additionally, each of the main interface methods accept an optional options object that can be used to override `'keyEncoding'` and `'valueEncoding'`.

--------------------------------------------------------
<a name="open"></a>
### db.open([callback])
<code>open()</code> opens the underlying LevelDB store. In general **you should never need to call this method directly** as it's automatically called by <a href="#ctor"><code>levelup()</code></a>.

However, it is possible to *reopen* a database after it has been closed with <a href="#close"><code>close()</code></a>, although this is not generally advised.

--------------------------------------------------------
<a name="close"></a>
### db.close([callback])
<code>close()</code> closes the underlying LevelDB store. The callback will receive any error encountered during closing as the first argument.

You should always clean up your LevelUP instance by calling `close()` when you no longer need it to free up resources. A LevelDB store cannot be opened by multiple instances of LevelDB/LevelUP simultaneously.

--------------------------------------------------------
<a name="put"></a>
### db.put(key, value[, options][, callback])
<code>put()</code> is the primary method for inserting data into the store. Both the `key` and `value` can be arbitrary data objects.

The callback argument is optional but if you don't provide one and an error occurs then expect the error to be thrown.

#### `options`

Encoding of the `key` and `value` objects will adhere to `'keyEncoding'` and `'valueEncoding'` options provided to <a href="#ctor"><code>levelup()</code></a>, although you can provide alternative encoding settings in the options for `put()` (it's recommended that you stay consistent in your encoding of keys and values in a single store).

If you provide a `'sync'` value of `true` in your `options` object, LevelDB will perform a synchronous write of the data; although the operation will be asynchronous as far as Node is concerned. Normally, LevelDB passes the data to the operating system for writing and returns immediately, however a synchronous write will use `fsync()` or equivalent so your callback won't be triggered until the data is actually on disk. Synchronous filesystem writes are **significantly** slower than asynchronous writes but if you want to be absolutely sure that the data is flushed then you can use `'sync': true`.

--------------------------------------------------------
<a name="get"></a>
### db.get(key[, options][, callback])
<code>get()</code> is the primary method for fetching data from the store. The `key` can be an arbitrary data object but if it doesn't exist in the store then the callback will receive an error as its first argument.

#### `options`

Encoding of the `key` object will adhere to the `'keyEncoding'` option provided to <a href="#ctor"><code>levelup()</code></a>, although you can provide alternative encoding settings in the options for `get()` (it's recommended that you stay consistent in your encoding of keys and values in a single store).

LevelDB will by default fill the in-memory LRU Cache with data from a call to get. Disabling this is done by setting `fillCache` to `false`. 

--------------------------------------------------------
<a name="del"></a>
### db.del(key[, options][, callback])
<code>del()</code> is the primary method for removing data from the store.

#### `options`

Encoding of the `key` object will adhere to the `'keyEncoding'` option provided to <a href="#ctor"><code>levelup()</code></a>, although you can provide alternative encoding settings in the options for `del()` (it's recommended that you stay consistent in your encoding of keys and values in a single store).

A `'sync'` option can also be passed, see <a href="#put"><code>put()</code></a> for details on how this works.

--------------------------------------------------------
<a name="batch"></a>
### db.batch(array[, options][, callback])
<code>batch()</code> can be used for very fast bulk-write operations (both *put* and *delete*). The `array` argument should contain a list of operations to be executed sequentially, although as a whole they are performed as an atomic operation inside LevelDB. Each operation is contained in an object having the following properties: `type`, `key`, `value`, where the *type* is either `'put'` or `'del'`. In the case of `'del'` the `'value'` property is ignored. Any entries with a `'key'` of `null` or `undefined` will cause an error to be returned on the `callback` and any `'type': 'put'` entry with a `'value'` of `null` or `undefined` will return an error.

```js
var ops = [
    { type: 'del', key: 'father' }
  , { type: 'put', key: 'name', value: 'Yuri Irsenovich Kim' }
  , { type: 'put', key: 'dob', value: '16 February 1941' }
  , { type: 'put', key: 'spouse', value: 'Kim Young-sook' }
  , { type: 'put', key: 'occupation', value: 'Clown' }
]

db.batch(ops, function (err) {
  if (err) return console.log('Ooops!', err)
  console.log('Great success dear leader!')
})
```


#### `options`

See <a href="#put"><code>put()</code></a> for a discussion on the `options` object. You can overwrite default `'keyEncoding'` and `'valueEncoding'` and also specify the use of `sync` filesystem operations.

--------------------------------------------------------
<a name='approximateSize'></a>
### db.approximateSize(start, end, callback)
<code>approximateSize()</code> can used to get the approximate number of bytes of file system space used by the range `[start..end)`. The result may not include recently written data.

```js
db.approximateSize('a', 'c', function (err, size) {
  if (err) return console.error('Ooops!', err)
  console.log('Approximate size of range is %d', size)
})
```

--------------------------------------------------------
<a name="isOpen"></a>
### db.isOpen()

A LevelUP object can be in one of the following states:

  * *"new"*     - newly created, not opened or closed
  * *"opening"* - waiting for the database to be opened
  * *"open"*    - successfully opened the database, available for use
  * *"closing"* - waiting for the database to be closed
  * *"closed"*  - database has been successfully closed, should not be used

`isOpen()` will return `true` only when the state is "open".

--------------------------------------------------------
<a name="isClosed"></a>
### db.isClosed()

*See <a href="#put"><code>isOpen()</code></a>*

`isClosed()` will return `true` only when the state is "closing" *or* "closed", it can be useful for determining if read and write operations are permissible.

--------------------------------------------------------
<a name="createReadStream"></a>
### db.createReadStream([options])

You can obtain a **ReadStream** of the full database by calling the `createReadStream()` method. The resulting stream is a complete Node.js-style [Readable Stream](http://nodejs.org/docs/latest/api/stream.html#stream_readable_stream) where `'data'` events emit objects with `'key'` and `'value'` pairs.

```js
db.createReadStream()
  .on('data', function (data) {
    console.log(data.key, '=', data.value)
  })
  .on('error', function (err) {
    console.log('Oh my!', err)
  })
  .on('close', function () {
    console.log('Stream closed')
  })
  .on('end', function () {
    console.log('Stream closed')
  })
```

The standard `pause()`, `resume()` and `destroy()` methods are implemented on the ReadStream, as is `pipe()` (see below). `'data'`, '`error'`, `'end'` and `'close'` events are emitted.

Additionally, you can supply an options object as the first parameter to `createReadStream()` with the following options:

* `'start'`: the key you wish to start the read at. By default it will start at the beginning of the store. Note that the *start* doesn't have to be an actual key that exists, LevelDB will simply find the *next* key, greater than the key you provide.

* `'end'`: the key you wish to end the read on. By default it will continue until the end of the store. Again, the *end* doesn't have to be an actual key as an (inclusive) `<=`-type operation is performed to detect the end. You can also use the `destroy()` method instead of supplying an `'end'` parameter to achieve the same effect.

* `'reverse'` *(boolean, default: `false`)*: a boolean, set to true if you want the stream to go in reverse order. Beware that due to the way LevelDB works, a reverse seek will be slower than a forward seek.

* `'keys'` *(boolean, default: `true`)*: whether the `'data'` event should contain keys. If set to `true` and `'values'` set to `false` then `'data'` events will simply be keys, rather than objects with a `'key'` property. Used internally by the `createKeyStream()` method.

* `'values'` *(boolean, default: `true`)*: whether the `'data'` event should contain values. If set to `true` and `'keys'` set to `false` then `'data'` events will simply be values, rather than objects with a `'value'` property. Used internally by the `createValueStream()` method.

* `'limit'` *(number, default: `-1`)*: limit the number of results collected by this stream. This number represents a *maximum* number of results and may not be reached if you get to the end of the store or your `'end'` value first. A value of `-1` means there is no limit.

* `'fillCache'` *(boolean, default: `false`)*: wheather LevelDB's LRU-cache should be filled with data read.

--------------------------------------------------------
<a name="createKeyStream"></a>
### db.createKeyStream([options])

A **KeyStream** is a **ReadStream** where the `'data'` events are simply the keys from the database so it can be used like a traditional stream rather than an object stream.

You can obtain a KeyStream either by calling the `createKeyStream()` method on a LevelUP object or by passing passing an options object to `createReadStream()` with `keys` set to `true` and `values` set to `false`.

```js
db.createKeyStream()
  .on('data', function (data) {
    console.log('key=', data)
  })

// same as:
db.createReadStream({ keys: true, values: false })
  .on('data', function (data) {
    console.log('key=', data)
  })
```

--------------------------------------------------------
<a name="createValueStream"></a>
### db.createValueStream([options])

A **ValueStream** is a **ReadStream** where the `'data'` events are simply the values from the database so it can be used like a traditional stream rather than an object stream.

You can obtain a ValueStream either by calling the `createValueStream()` method on a LevelUP object or by passing passing an options object to `createReadStream()` with `values` set to `true` and `keys` set to `false`.

```js
db.createValueStream()
  .on('data', function (data) {
    console.log('value=', data)
  })

// same as:
db.createReadStream({ keys: false, values: true })
  .on('data', function (data) {
    console.log('value=', data)
  })
```

--------------------------------------------------------
<a name="createWriteStream"></a>
### db.createWriteStream([options])

A **WriteStream** can be obtained by calling the `createWriteStream()` method. The resulting stream is a complete Node.js-style [Writable Stream](http://nodejs.org/docs/latest/api/stream.html#stream_writable_stream) which accepts objects with `'key'` and `'value'` pairs on its `write()` method. The WriteStream will buffer writes and submit them as a `batch()` operation where the writes occur on the same event loop tick, otherwise they are treated as simple `put()` operations.

```js
db.createWriteStream()
  .on('error', function (err) {
    console.log('Oh my!', err)
  })
  .on('close', function () {
    console.log('Stream closed')
  })
  .write({ key: 'name', value: 'Yuri Irsenovich Kim' })
  .write({ key: 'dob', value: '16 February 1941' })
  .write({ key: 'spouse', value: 'Kim Young-sook' })
  .write({ key: 'occupation', value: 'Clown' })
  .end()
```

The standard `write()`, `end()`, `destroy()` and `destroySoon()` methods are implemented on the WriteStream. `'drain'`, `'error'`, `'close'` and `'pipe'` events are emitted.

#### Pipes and Node Stream compatibility

A ReadStream can be piped directly to a WriteStream, allowing for easy copying of an entire database. A simple `copy()` operation is included in LevelUP that performs exactly this on two open databases:

```js
function copy (srcdb, dstdb, callback) {
  srcdb.createReadStream().pipe(dstdb.createWriteStream()).on('close', callback)
}
```

The ReadStream is also [fstream](https://github.com/isaacs/fstream)-compatible which means you should be able to pipe to and from fstreams. So you can serialize and deserialize an entire database to a directory where keys are filenames and values are their contents, or even into a *tar* file using [node-tar](https://github.com/isaacs/node-tar). See the [fstream functional test](https://github.com/rvagg/node-levelup/blob/master/test/functional/fstream-test.js) for an example. *(Note: I'm not really sure there's a great use-case for this but it's a fun example and it helps to harden the stream implementations.)*

KeyStreams and ValueStreams can be treated like standard streams of raw data. If `'keyEncoding'` or `'valueEncoding'` is set to `'binary'` the `'data'` events will simply be standard Node `Buffer` objects straight out of the data store.

--------------------------------------------------------
<a name="destroy"></a>
### levelup.destroy(location[, callback])
<code>destroy()</code> is used to completely remove an existing LevelDB database directory. You can use this function in place of a full directory *rm* if you want to be sure to only remove LevelDB-related files. If the directory only contains LevelDB files, the directory itself will be removed as well. If there are additional, non-LevelDB files in the directory, those files, and the directory, will be left alone.

The optional callback will be called when the destroy operation is complete, with a possible `error` argument.

<a name="repair"></a>
### levelup.repair(location[, callback])
<code>repair()</code> can be used to attempt a restoration of a damaged LevelDB store. From the LevelDB documentation:

> If a DB cannot be opened, you may attempt to call this method to resurrect as much of the contents of the database as possible. Some data may be lost, so be careful when calling this function on a database that contains important information.

You will find information on the *repair* operation in the *LOG* file inside the store directory. 

A `repair()` can also be used to perform a compaction of the LevelDB log into table files.

The optional callback will be called when the repair operation is complete, with a possible `error` argument.

<a name="events"></a>
Events
------

LevelUP emits events when the callbacks to the corresponding methods are called.

* `db.emit('put', key, value)` emitted when a new value is `'put'`
* `db.emit('del', key)` emitted when a value is deleted
* `db.emit('batch', ary)` emitted when a batch operation has executed
* `db.emit('ready')` emitted when the database has opened (`'open'` is synonym)
* `db.emit('closed')` emitted when the database has closed
* `db.emit('opening')` emitted when the database is opening
* `db.emit('closing')` emitted when the database is closing

If you do not pass a callback to an async function, and there is an error, LevelUP will `emit('error', err)` instead.

<a name="json"></a>
JSON data
---------

You specify `'json'` encoding for both keys and/or values, you can then supply JavaScript objects to LevelUP and receive them from all fetch operations, including ReadStreams. LevelUP will automatically *stringify* your objects and store them as *utf8* and parse the strings back into objects before passing them back to you.

<a name="considerations"></a>
Important considerations
------------------------

* LevelDB is thread-safe but is **not** suitable for accessing with multiple processes. You should only ever have a LevelDB database open from a single Node.js process.

<a name="contributing"></a>
Contributing
------------

LevelUP is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [CONTRIBUTING.md](https://github.com/rvagg/node-levelup/blob/master/CONTRIBUTING.md) file for more details.

### Contributors

LevelUP is only possible due to the excellent work of the following contributors:

<table><tbody>
<tr><th align="left">Rod Vagg</th><td><a href="https://github.com/rvagg">GitHub/rvagg</a></td><td><a href="http://twitter.com/rvagg">Twitter/@rvagg</a></td></tr>
<tr><th align="left">John Chesley</th><td><a href="https://github.com/chesles/">GitHub/chesles</a></td><td><a href="http://twitter.com/chesles">Twitter/@chesles</a></td></tr>
<tr><th align="left">Jake Verbaten</th><td><a href="https://github.com/raynos">GitHub/raynos</a></td><td><a href="http://twitter.com/raynos2">Twitter/@raynos2</a></td></tr>
<tr><th align="left">Dominic Tarr</th><td><a href="https://github.com/dominictarr">GitHub/dominictarr</a></td><td><a href="http://twitter.com/dominictarr">Twitter/@dominictarr</a></td></tr>
<tr><th align="left">Max Ogden</th><td><a href="https://github.com/maxogden">GitHub/maxogden</a></td><td><a href="http://twitter.com/maxogden">Twitter/@maxogden</a></td></tr>
<tr><th align="left">Lars-Magnus Skog</th><td><a href="https://github.com/ralphtheninja">GitHub/ralphtheninja</a></td><td><a href="http://twitter.com/ralphtheninja">Twitter/@ralphtheninja</a></td></tr>
<tr><th align="left">David Björklund</th><td><a href="https://github.com/kesla">GitHub/kesla</a></td><td><a href="http://twitter.com/david_bjorklund">Twitter/@david_bjorklund</a></td></tr>
<tr><th align="left">Julian Gruber</th><td><a href="https://github.com/juliangruber">GitHub/juliangruber</a></td><td><a href="http://twitter.com/juliangruber">Twitter/@juliangruber</a></td></tr>
<tr><th align="left">Paolo Fragomeni</th><td><a href="https://github.com/hij1nx">GitHub/hij1nx</a></td><td><a href="http://twitter.com/hij1nx">Twitter/@hij1nx</a></td></tr>
</tbody></table>

### Windows

A large portion of the Windows support comes from code by [Krzysztof Kowalczyk](http://blog.kowalczyk.info/) [@kjk](https://twitter.com/kjk), see his Windows LevelDB port [here](http://code.google.com/r/kkowalczyk-leveldb/). If you're using LevelUP on Windows, you should give him your thanks!


<a name="licence"></a>
Licence &amp; copyright
-------------------

Copyright (c) 2012-2013 LevelUP contributors (listed above).

LevelUP is licensed under an MIT +no-false-attribs license. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.

*LevelUP builds on the excellent work of the LevelDB and Snappy teams from Google and additional contributors. LevelDB and Snappy are both issued under the [New BSD Licence](http://opensource.org/licenses/BSD-3-Clause).*