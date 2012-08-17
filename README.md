LevelUP
=======

Fast & simple storage; a Node.js-style LevelDB wrapper
------------------------------------------------------

**[LevelDB](http://code.google.com/p/leveldb/)** is a simple key/value data store built by Google, inspired by BigTable. It's used in Google Chrome and many other products. LevelDB supports arbitrary byte arrays as both keys and values, singular *get*, *put* and *delete* operations, *batched put and delete*, forward and reverse iteration and simple compression using the [Snappy](http://code.google.com/p/snappy/) algorithm which is optimised for speed over compression.


**LevelUP** aims to expose the features of LevelDB in a Node.js-friendly way. Both keys and values are treated as `Buffer` objects and are automatically converted using a specified `'encoding'`. LevelDB's iterators are exposed as a Node.js style object-`ReadStream` and writing can be peformed via an object-`WriteStream`.

Basic usage
-----------

All operations are asynchronous although they don't necessarily require a callback if you don't need to know when the operation was performed.

```js
var levelup = require('levelup')

// 1) create our database object, supply location and options
var db = levelup.createDatabase('./mydb', { createIfMissing: true , errorIfExists: false })

// 2) open the database, this will create or open the underlying LevelDB store
db.open(function (err) {

  // 3) put a key & value
  db.put('name', 'LevelUP', function (err) {
    if (err) throw err

    // 4) fetch by key
    db.get('name', function (err, value) {
      if (err) throw err // likely the key was not found

      console.log('name=' + value)
    })

  })

})

```

### Options

`createDatabase()` takes an optional options object as its second argument; the following properties are accepted:

* `createIfMissing` *(boolean)*: If `true`, will initialise an empty database at the specified location if one doesn't already exit. If `false` and a database doesn't exist you will receive an error in your `open()` callback and your database won't open. Defaults to `false`.

* `errorIfExists` *(boolean)*: If `true`, you will receive an error in your `open()` callback if the database exists at the specified location. Defaults to `false`.

* `encoding` *(string)*: The encoding of the keys and values passed through Node.js' `Buffer` implementation (see `[Buffer#toString()](http://nodejs.org/docs/latest/api/buffer.html#buffer_buf_tostring_encoding_start_end)`)
  <p>`'utf8'` is the default encoding for both keys and values so you can simply pass in strings and expect strings from your `get()` operations. You can also pass `Buffer` objects as keys and/or values and converstion will be performed.</p>
  <p>Supported encodings are: hex, utf8, ascii, binary, base64, ucs2, utf16le.</p>
  <p>**json** encoding will be supported in a future release, likely stored as utf8 strings.</p>

* `keyEncoding` and `valueEncoding` *(string)*: use instead of `encoding` to specify the exact encoding of both the keys and the values in this database.

Additionally, each of the main interface methods accept an optional options object that can be used to override `encoding` (or `keyEncoding` & `valueEncoding`).

### Batch operations

For faster write operations, the `batch()` method can be used to submit an array of operations to be executed sequentially. Each operation is contained in an object having the following properties: `type`, `key`, `value`, where the *type* is either `'put'` or `'del'`. In the case of `'del'` the `'value'` property is ignored.

```js
var ops = [
    { type: 'del', key: 'father' }
  , { type: 'put', key: 'name'  , value: 'Yuri Irsenovich Kim' }
  , { type: 'put', key: 'dob'   , value: '16 February 1941'    }
  , { type: 'put', key: 'spouse', value: 'Kim Young-sook'      }
]

db.batch(ops, function (err) {
  if (err) throw err
  console.log('Great success dear leader!')
})
```

Streams
-------

*See `db.readStream()` and `db.writeStream()`. More documentation coming soon.

TODO
----

* JSON encoding/decoding
* ReadStream reverse read
* ReadStream optional 'start' key
* ReadStream optional 'end' key
* Filter streams, e.g.: KeyReadStream, ValueReadStream
* *Windows support, maybe*

Licence & Copyright
-------------------

LevelUP is Copyright (c) 2012 Rod Vagg <@rvagg> and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.

LevelUP builds on the excellent work of the LevelDB and Snappy teams from Google and additional contributors. LevelDB and Snappy are both issued under the [New BSD Licence](http://opensource.org/licenses/BSD-3-Clause).
