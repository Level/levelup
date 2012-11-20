LevelUP
=======

Fast & simple storage - a Node.js-style LevelDB wrapper
-------------------------------------------------------

[![Build Status](https://secure.travis-ci.org/rvagg/node-levelup.png)](http://travis-ci.org/rvagg/node-levelup)

**[LevelDB](http://code.google.com/p/leveldb/)** is a simple key/value data store built by Google, inspired by BigTable. It's used in Google Chrome and many other products. LevelDB supports arbitrary byte arrays as both keys and values, singular *get*, *put* and *delete* operations, *batched put and delete*, forward and reverse iteration and simple compression using the [Snappy](http://code.google.com/p/snappy/) algorithm which is optimised for speed over compression.

**LevelUP** aims to expose the features of LevelDB in a Node.js-friendly way. Both keys and values are treated as `Buffer` objects and are automatically converted using a specified `'encoding'`. LevelDB's iterators are exposed as a Node.js style object-`ReadStream` and writing can be peformed via an object-`WriteStream`.

**LevelUP** is an **OPEN Open Source Project**, see the <a href="#contributing">Contributing</a> section to find out what this means.

  * <a href="#platforms">Tested & supported platforms</a>
  * <a href="#basic">Basic usage</a>
  * <a href="#api">API</a>
  * <a href="#events">Events</a>
  * <a href="#json">JSON data</a>
  * <a href="#considerations">Important considerations</a>
  * <a href="#contributing">Contributing</a>
  * <a href="#licence">Licence & copyright</a>


<a name="platforms"></a>
Tested & supported platforms
----------------------------

  * **Linux** (tested on Ubuntu)
  * **Mac OS**
  * **Solaris** (tested on SmartOS & Nodejitsu)

**Windows** support is coming soon; see [issue #5](https://github.com/rvagg/node-levelup/issues/5) if you would like to help on that front.

<a name="basic"></a>
Basic usage
-----------

All operations are asynchronous although they don't necessarily require a callback if you don't need to know when the operation was performed.

```js
var levelup = require('levelup')

// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
var options = { createIfMissing: true, errorIfExists: false }
var db = levelup('./mydb', options)

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
  * <a href="#hook"><code>db.<b>hook()</b></code></a>
  * <a href="#isOpen"><code>db.<b>isOpen()</b></code></a>
  * <a href="#isClosed"><code>db.<b>isClosed()</b></code></a>
  * <a href="#readStream"><code>db.<b>readStream()</b></code></a>
  * <a href="#keyStream"><code>db.<b>keyStream()</b></code></a>
  * <a href="#valueStream"><code>db.<b>valueStream()</b></code></a>
  * <a href="#writeStream"><code>db.<b>writeStream()</b></code></a>


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

#### `options`

`levelup()` takes an optional options object as its second argument; the following properties are accepted:

* `createIfMissing` *(boolean)*: If `true`, will initialise an empty database at the specified location if one doesn't already exit. If `false` and a database doesn't exist you will receive an error in your `open()` callback and your database won't open. Defaults to `false`.

* `errorIfExists` *(boolean)*: If `true`, you will receive an error in your `open()` callback if the database exists at the specified location. Defaults to `false`.

* `encoding` *(string)*: The encoding of the keys and values passed through Node.js' `Buffer` implementation (see [Buffer#toString()](http://nodejs.org/docs/latest/api/buffer.html#buffer_buf_tostring_encoding_start_end))
  <p><code>'utf8'</code> is the default encoding for both keys and values so you can simply pass in strings and expect strings from your <code>get()</code> operations. You can also pass <code>Buffer</code> objects as keys and/or values and converstion will be performed.</p>
  <p>Supported encodings are: hex, utf8, ascii, binary, base64, ucs2, utf16le.</p>
  <p><code>'json'</code> encoding is also supported, see below.</p>

* `keyEncoding` and `valueEncoding` *(string)*: use instead of `encoding` to specify the exact encoding of both the keys and the values in this database.

Additionally, each of the main interface methods accept an optional options object that can be used to override `encoding` (or `keyEncoding` & `valueEncoding`).

--------------------------------------------------------
<a name="open"></a>
### db.open([callback])
<code>open()</code> opens the underlying LevelDB store. In general **you should never need to call this method directly** as it's automatically called by <a href="#ctor"><code>levelup()</code></a>.

However, it is possible to *reopen* a database after it has been closed with <a href="#close"><code>close()</code></a>; although this is not generally advised.

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

Encoding of the `key` and `value` objects will adhere to `encoding` option(s) provided to <a href="#ctor"><code>levelup()</code></a>, although you can provide alternative encoding settings in the options for `put()` (it's recommended that stay consistent in your encoding of keys and values in a single store).

If you provide a `'sync'` value of `true` in your `options` object, LevelDB will perform a synchronous write of the data; although the operation will be asynchronous as far as Node is concerned. Normally, LevelDB passes the data to the operating system for writing and returns immediately, however a synchronous write will use `fsync()` or equivalent so your callback won't be triggered until the data is actually on disk. Synchronous filesystem writes are **significantly** slower than asynchronous writes but if you want to be absolutely sure that the data is flushed then you can use `'sync': true`.

--------------------------------------------------------
<a name="get"></a>
### db.get(key[, options][, callback])
<code>get()</code> is the primary method for fetching data from the store. The `key` can be an arbitrary data object but if it doesn't exist in the store then the callback will receive an error as its first argument.

#### `options`

Encoding of the `key` objects will adhere to `encoding` option(s) provided to <a href="#ctor"><code>levelup()</code></a>, although you can provide alternative encoding settings in the options for `et()` (it's recommended that stay consistent in your encoding of keys and values in a single store).

--------------------------------------------------------
<a name="del"></a>
### db.del(key[, options][, callback])
<code>del()</code> is the primary method for removing data from the store. The `key` can be an arbitrary data object but if it doesn't exist in the store then the callback will receive an error as its first argument.

#### `options`

Encoding of the `key` objects will adhere to `encoding` option(s) provided to <a href="#ctor"><code>levelup()</code></a>, although you can provide alternative encoding settings in the options for `et()` (it's recommended that stay consistent in your encoding of keys and values in a single store).

A `'sync'` option can also be passed, see <a href="#put"><code>put()</code></a> for details on how this works.

--------------------------------------------------------
<a name="batch"></a>
### db.batch(array[, options][, callback])
<code>batch()</code> can be used for very fast bulk-write operations (both *put* and *delete*). The `array` argument should contain a list of operations to be executed sequentially. Each operation is contained in an object having the following properties: `type`, `key`, `value`, where the *type* is either `'put'` or `'del'`. In the case of `'del'` the `'value'` property is ignored.

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

See <a href="#put"><code>put()</code></a> for a discussion on the `options` object. You can overwrite default `key` and `value` encodings and also specify the use of `sync` filesystem operations.

--------------------------------------------------------
<a name="hook"></a>
### db.hook(type, listener)
`hook` can be used to intercept a put or del command and turn it
  into a batch instead.

This is useful if you need to transparently intercept database
  mutation for a job queue system and want to ensure that your
  interceptions have the failure tolerance garantuees that batch
  has.

```js
function delHook(key, arr) {
  // insert stuff into array that is patched to batch here too
}

db.hook("put", function (value, key, arr) {
  // insert a token into the db that a job needs to be run.
  // this is fault tolerant way to run recoverable jobs
  arr.push({ type: "put", key: "~job:" + key, value: key })
})

db.hook("del", delHook)

// Actually don't use hook
db.removeHook(delHook)

...
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
<a name="readStream"></a>
### db.readStream()

You can obtain a **ReadStream** of the full database by calling the `readStream()` method. The resulting stream is a complete Node.js-style [Readable Stream](http://nodejs.org/docs/latest/api/stream.html#stream_readable_stream) where `'data'` events emit objects with `'key'` and `'value'` pairs.

```js
db.readStream()
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

Additionally, you can supply an options object as the first parameter to `readStream()` with the following options:

* `'start'`: the key you wish to start the read at. By default it will start at the beginning of the store. Note that the *start* doesn't have to be an actual key that exists, LevelDB will simply find the *next* key, greater than the key you provide.

* `'end'`: the key you wish to end the read on. By default it will continue until the end of the store. Again, the *end* doesn't have to be an actual key as an (inclusive) `<=`-type operation is performed to detect the end. You can also use the `destroy()` method instead of supplying an `'end'` parameter to achieve the same effect.

* `'reverse'`: a boolean, set to true if you want the stream to go in reverse order. Beware that due to the way LevelDB works, a reverse seek will be slower than a forward seek.

* `'keys'`: a boolean (defaults to `true`) to indicate whether the `'data'` event should contain keys. If set to `true` and `'values'` set to `false` then `'data'` events will simply be keys, rather than objects with a `'key'` property. Used internally by the `keyStream()` method.

* `'values'`: a boolean (defaults to `true`) to indicate whether the `'data'` event should contain values. If set to `true` and `'keys'` set to `false` then `'data'` events will simply be values, rather than objects with a `'value'` property. Used internally by the `valueStream()` method.

--------------------------------------------------------
<a name="keyStream"></a>
### db.keyStream()

A **KeyStream** is a **ReadStream** where the `'data'` events are simply the keys from the database so it can be used like a traditional stream rather than an object stream.

You can obtain a KeyStream either by calling the `keyStream()` method on a LevelUP object or by passing passing an options object to `readStream()` with `keys` set to `true` and `values` set to `false`.

```js
db.keyStream()
  .on('data', function (data) {
    console.log('key=', data)
  })

// same as:
db.readStream({ keys: true, values: false })
  .on('data', function (data) {
    console.log('key=', data)
  })
```

--------------------------------------------------------
<a name="valueStream"></a>
### db.valueStream()

A **ValueStream** is a **ReadStream** where the `'data'` events are simply the values from the database so it can be used like a traditional stream rather than an object stream.

You can obtain a ValueStream either by calling the `valueStream()` method on a LevelUP object or by passing passing an options object to `readStream()` with `valuess` set to `true` and `keys` set to `false`.

```js
db.valueStream()
  .on('data', function (data) {
    console.log('value=', data)
  })

// same as:
db.readStream({ keys: false, values: true })
  .on('data', function (data) {
    console.log('value=', data)
  })
```

--------------------------------------------------------
<a name="writeStream"></a>
### db.writeStream()

A **WriteStream** can be obtained by calling the `writeStream()` method. The resulting stream is a complete Node.js-style [Writable Stream](http://nodejs.org/docs/latest/api/stream.html#stream_writable_stream) which accepts objects with `'key'` and `'value'` pairs on its `write()` method. Tce WriteStream will buffer writes and submit them as a `batch()` operation where the writes occur on the same event loop tick, otherwise they are treated as simple `put()` operations.

```js
db.writeStream()
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
  srcdb.readStream().pipe(dstdb.writeStream().on('close', callback))
}
```

The ReadStream is also [fstream](https://github.com/isaacs/fstream)-compatible which means you should be able to pipe to and from fstreams. So you can serialize and deserialize an entire database to a directory where keys are filenames and values are their contents, or even into a *tar* file using [node-tar](https://github.com/isaacs/node-tar). See the [fstream functional test](https://github.com/rvagg/node-levelup/blob/master/test/functional/fstream-test.js) for an example. *(Note: I'm not really sure there's a great use-case for this but it's a fun example and it helps to harden the stream implementations.)*

KeyStreams and ValueStreams can be treated like standard streams of raw data. If `'encoding'` is set to `'binary'` the `'data'` events will simply be standard Node `Buffer` objects straight out of the data store.

<a name="events"></a>
Events
------

LevelUP emits events when the callbacks to the corresponding methods are called.

* `db.emit('put', key, value)` emitted when a new value is `'put'`
* `db.emit('del', key)` emitted when a value is deleted
* `db.emit('batch', ary)` emitted when a batch operation has executed
* `db.emit('ready')` emitted when the database has opened
* `db.emit('closed')` emitted when the database has closed

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

* Rod Vagg - [GitHub/rvagg](https://github.com/rvagg) - [Twitter/@rvagg](https://twitter.com/rvagg)
* John Chesley - [GitHub/chesles](https://github.com/chesles/) - [Twitter/@chesles](https://twitter.com/chesles)
* Jake Verbaten - [GitHub/raynos](https://github.com/raynos) - [Twitter/@raynos2](https://twitter.com/Raynos2)
* Dominic Tarr - [GitHub/dominictarr](https://github.com/dominictarr) - [Twitter/@dominictarr](https://twitter.com/dominictarr)

<a name="licence"></a>
Licence & copyright
-------------------

LevelUP is Copyright (c) 2012 Rod Vagg and other contributors listed above.

LevelUP is licensed under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.

LevelUP builds on the excellent work of the LevelDB and Snappy teams from Google and additional contributors. LevelDB and Snappy are both issued under the [New BSD Licence](http://opensource.org/licenses/BSD-3-Clause).
