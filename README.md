LevelUP
=======

Fast & simple storage - a Node.js-style LevelDB wrapper
-------------------------------------------------------

**[LevelDB](http://code.google.com/p/leveldb/)** is a simple key/value data store built by Google, inspired by BigTable. It's used in Google Chrome and many other products. LevelDB supports arbitrary byte arrays as both keys and values, singular *get*, *put* and *delete* operations, *batched put and delete*, forward and reverse iteration and simple compression using the [Snappy](http://code.google.com/p/snappy/) algorithm which is optimised for speed over compression.


**LevelUP** aims to expose the features of LevelDB in a Node.js-friendly way. Both keys and values are treated as `Buffer` objects and are automatically converted using a specified `'encoding'`. LevelDB's iterators are exposed as a Node.js style object-`ReadStream` and writing can be peformed via an object-`WriteStream`.

Basic usage
-----------

All operations are asynchronous although they don't necessarily require a callback if you don't need to know when the operation was performed.

```js
var levelup = require('levelup')

// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
var options = { createIfMissing: true, errorIfExists: false }
levelup('./mydb', options, function (err, db) {
  if (err) return console.log('Ooops!', err)

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
})
```

### Options

`levelup()` takes an optional options object as its second argument; the following properties are accepted:

* `createIfMissing` *(boolean)*: If `true`, will initialise an empty database at the specified location if one doesn't already exit. If `false` and a database doesn't exist you will receive an error in your `open()` callback and your database won't open. Defaults to `false`.

* `errorIfExists` *(boolean)*: If `true`, you will receive an error in your `open()` callback if the database exists at the specified location. Defaults to `false`.

* `encoding` *(string)*: The encoding of the keys and values passed through Node.js' `Buffer` implementation (see [Buffer#toString()](http://nodejs.org/docs/latest/api/buffer.html#buffer_buf_tostring_encoding_start_end))
  <p><code>'utf8'</code> is the default encoding for both keys and values so you can simply pass in strings and expect strings from your <code>get()</code> operations. You can also pass <code>Buffer</code> objects as keys and/or values and converstion will be performed.</p>
  <p>Supported encodings are: hex, utf8, ascii, binary, base64, ucs2, utf16le.</p>
  <p><code>'json'</code> encoding is also supported, see below.</p>

* `keyEncoding` and `valueEncoding` *(string)*: use instead of `encoding` to specify the exact encoding of both the keys and the values in this database.

Additionally, each of the main interface methods accept an optional options object that can be used to override `encoding` (or `keyEncoding` & `valueEncoding`).

### Batch operations

For faster write operations, the `batch()` method can be used to submit an array of operations to be executed sequentially. Each operation is contained in an object having the following properties: `type`, `key`, `value`, where the *type* is either `'put'` or `'del'`. In the case of `'del'` the `'value'` property is ignored.

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

Streams
-------

### ReadStream

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

* `'end'`: the key you wish to end the read on. By default it will continue until the end of the store. Again, the *end* doesn't have to be an actual key as a `<`-type operation is performed to detect the end. You can also use the `destroy()` method instead of supplying an `'end'` parameter to achieve the same effect.

### WriteStream

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

### Pipes and compatibility

A ReadStream can be piped directly to a WriteStream, allowing for easy copying of an entire database. A simple `copy()` operation is included in LevelUP that performs exactly this on two open databases:

```js
function copy (srcdb, dstdb, callback) {
  srcdb.readStream().pipe(dstdb.writeStream().on('close', callback))
}
```

The ReadStream is also [fstream](https://github.com/isaacs/fstream)-compatible which means you should be able to pipe to and from fstreams. So you can serialize and deserialize an entire database to a directory where keys are filenames and values are their contents, or even into a *tar* file using [node-tar](https://github.com/isaacs/node-tar). See the [fstream functional test](https://github.com/rvagg/node-levelup/blob/master/test/functional/fstream-test.js) for an example. *(Note: I'm not really sure there's a great use-case for this but it's a fun example and it helps to harden the stream implementations.)*

JSON
----

You specify `'json'` encoding for both keys and/or values, you can then supply JavaScript objects to LevelUP and receive them from all fetch operations, including ReadStreams. LevelUP will automatically *stringify* your objects and store them as *utf8* and parse the strings back into objects before passing them back to you.

Important considerations
------------------------

* LevelDB is thread-safe but is **not** suitable for accessing with multiple processes. You should only ever have a LevelDB database open from a single Node.js process.

TODO
----

* ReadStream reverse read
* Filter streams, e.g.: KeyReadStream, ValueReadStream
* *Windows support, maybe*
* Benchmarks

Licence & copyright
-------------------

LevelUP is Copyright (c) 2012 Rod Vagg <@rvagg> and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.

LevelUP builds on the excellent work of the LevelDB and Snappy teams from Google and additional contributors. LevelDB and Snappy are both issued under the [New BSD Licence](http://opensource.org/licenses/BSD-3-Clause).
