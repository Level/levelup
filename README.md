LevelUP &mdash; Fast & simple storage; a Node.js-style LevelDB wrapper
======================================================================

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

`createDatabase()` takes an optional options object as its second argument.

`createIfMissing` *(boolean)*: If `true`, will initialise an empty database at the specified location if one doesn't already exit. If `false` and a database doesn't exist you will receive an error in your `open()` callback and your database won't open.

`errorIfExists` *(boolean)*: If `true`, you will receive an error in your `open()` callback if the database exists at the specified location.

`encoding` *(string)*:

  The encoding of the keys and values passed through Node.js' `Buffer` implementation (see `[Buffer#toString()](http://nodejs.org/docs/latest/api/buffer.html#buffer_buf_tostring_encoding_start_end))

  `'utf8'` is the default encoding for both keys and values so you can simply pass in strings and expect strings from your `get()` operations. You can also pass `Buffer` objects as keys and/or values and converstion will be performed.

  Supported encodings are: hex, utf8, ascii, binary, base64, ucs2, utf16le

  **json** encoding will be supported in a future release, likely stored as utf8 strings.