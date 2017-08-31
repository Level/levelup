LevelUP
=======

<img alt="LevelDB Logo" height="100" src="http://leveldb.org/img/logo.svg">

> Fast and simple storage. A node.js wrapper for `abstract-leveldown` compliant backends.

[![Build Status](https://secure.travis-ci.org/Level/levelup.svg?branch=master)](http://travis-ci.org/Level/levelup)
[![dependencies](https://david-dm.org/Level/levelup.svg)](https://david-dm.org/level/levelup)
[![Greenkeeper badge](https://badges.greenkeeper.io/Level/levelup.svg)](https://greenkeeper.io/)

[![NPM](https://nodei.co/npm/levelup.png?stars&downloads&downloadRank)](https://nodei.co/npm/levelup/)
[![NPM](https://nodei.co/npm-dl/levelup.png?months=6&height=3)](https://nodei.co/npm/levelup/)


  * <a href="#intro">Introduction</a>
  * <a href="#leveldown">Relationship to LevelDOWN</a>
  * <a href="#platforms">Tested &amp; supported platforms</a>
  * <a href="#basic">Basic usage</a>
  * <a href="#api">API</a>
  * <a href="#promises">Promise Support</a>
  * <a href="#events">Events</a>
  * <a href="#extending">Extending LevelUP</a>
  * <a href="#multiproc">Multi-process access</a>
  * <a href="#support">Getting support</a>
  * <a href="#contributing">Contributing</a>
  * <a href="#license">Licence &amp; copyright</a>

**If you are upgrading:** please see `CHANGELOG.md`.

<a name="intro"></a>
Introduction
------------

**[LevelDB](https://github.com/google/leveldb)** is a simple key/value data store built by Google, inspired by BigTable. It's used in Google Chrome and many other products. LevelDB supports arbitrary byte arrays as both keys and values, singular *get*, *put* and *delete* operations, *batched put and delete*, bi-directional iterators and simple compression using the very fast [Snappy](http://google.github.io/snappy/) algorithm.

**LevelUP** aims to expose the features of LevelDB in a **Node.js-friendly way**. LevelDB's iterators are exposed as a Node.js-style **readable stream**.

LevelDB stores entries **sorted lexicographically by keys**. This makes LevelUP's <a href="#createReadStream"><code>ReadStream</code></a> interface a very powerful query mechanism.

**LevelUP** is an **OPEN Open Source Project**, see the <a href="#contributing">Contributing</a> section to find out what this means.

<a name="leveldown"></a>
Relationship to LevelDOWN
-------------------------

LevelUP is designed to be backed by **[LevelDOWN](https://github.com/level/leveldown/)** which provides a pure C++ binding to LevelDB and can be used as a stand-alone package if required.

**As of version 0.9, LevelUP no longer requires LevelDOWN as a dependency so you must `npm install leveldown` when you install LevelUP.**

LevelDOWN is now optional because LevelUP can be used with alternative backends, such as **[level.js](https://github.com/maxogden/level.js)** in the browser or [MemDOWN](https://github.com/level/memdown) for a pure in-memory store.

LevelUP will look for LevelDOWN and throw an error if it can't find it in its Node `require()` path. It will also tell you if the installed version of LevelDOWN is incompatible.

**The [level](https://github.com/level/level) package is available as an alternative installation mechanism.** Install it instead to automatically get both LevelUP & LevelDOWN. It exposes LevelUP on its export (i.e. you can `var leveldb = require('level')`).


<a name="platforms"></a>
Tested & supported platforms
----------------------------

  * **Linux**: including ARM platforms such as Raspberry Pi *and Kindle!*
  * **Mac OS**
  * **Solaris**: including Joyent's SmartOS & Nodejitsu
  * **Windows**: Node 0.10 and above only. See installation instructions for *node-gyp's* dependencies [here](https://github.com/TooTallNate/node-gyp#installation), you'll need these (free) components from Microsoft to compile and run any native Node add-on in Windows.

<a name="basic"></a>
Basic usage
-----------

First you need to install LevelUP!

```sh
$ npm install levelup leveldown
```

Or

```sh
$ npm install level
```

*(this second option requires you to use LevelUP by calling `var levelup = require('level')`)*


All operations are asynchronous although they don't necessarily require a callback if you don't need to know when the operation was performed.

```js
var levelup = require('levelup')
var leveldown = require('leveldown')

// 1) Create our database
var db = levelup(leveldown('./mydb'))

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
  * <a href="#batch"><code>db.<b>batch()</b></code> *(array form)*</a>
  * <a href="#batch_chained"><code>db.<b>batch()</b></code> *(chained form)*</a>
  * <a href="#isOpen"><code>db.<b>isOpen()</b></code></a>
  * <a href="#isClosed"><code>db.<b>isClosed()</b></code></a>
  * <a href="#createReadStream"><code>db.<b>createReadStream()</b></code></a>
  * <a href="#createKeyStream"><code>db.<b>createKeyStream()</b></code></a>
  * <a href="#createValueStream"><code>db.<b>createValueStream()</b></code></a>

### Special Notes
  * <a href="#writeStreams">What happened to <code><b>db.createWriteStream()</b></code></a>


--------------------------------------------------------
<a name="ctor"></a>
### levelup(db[, options[, callback]])
<code>levelup()</code> is the main entry point for creating a new LevelUP instance and opening the underlying store with LevelDB.

`db` is an [`abstract-leveldown`](https://github.com/level/abstract-leveldown) compliant object.

This function returns a new instance of LevelUP and will also initiate an <a href="#open"><code>open()</code></a> operation. Opening the database is an asynchronous operation which will trigger your callback if you provide one. The callback should take the form: `function (err, db) {}` where the `db` is the LevelUP instance. If you don't provide a callback, any read & write operations are simply queued internally until the database is fully opened.

This leads to two alternative ways of managing a new LevelUP instance:

```js
levelup(leveldown(location), options, function (err, db) {
  if (err) throw err
  db.get('foo', function (err, value) {
    if (err) return console.log('foo does not exist')
    console.log('got foo =', value)
  })
})

// vs the equivalent:

var db = levelup(leveldown(location), options) // will throw if an error occurs
db.get('foo', function (err, value) {
  if (err) return console.log('foo does not exist')
  console.log('got foo =', value)
})
```

`options` is passed on to the underlying store when it's opened.

--------------------------------------------------------
<a name="open"></a>
### db.open([callback])
<code>open()</code> opens the underlying LevelDB store. In general **you should never need to call this method directly** as it's automatically called by <a href="#ctor"><code>levelup()</code></a>.

However, it is possible to *reopen* a database after it has been closed with <a href="#close"><code>close()</code></a>, although this is not generally advised.

If no callback is passed, a promise is returned.

--------------------------------------------------------
<a name="close"></a>
### db.close([callback])
<code>close()</code> closes the underlying LevelDB store. The callback will receive any error encountered during closing as the first argument.

You should always clean up your LevelUP instance by calling `close()` when you no longer need it to free up resources. A LevelDB store cannot be opened by multiple instances of LevelDB/LevelUP simultaneously.

If no callback is passed, a promise is returned.

--------------------------------------------------------
<a name="put"></a>
### db.put(key, value[, options][, callback])
<code>put()</code> is the primary method for inserting data into the store. Both the `key` and `value` can be arbitrary data objects.

`options` is passed on to the underlying store.

If no callback is passed, a promise is returned.

--------------------------------------------------------
<a name="get"></a>
### db.get(key[, options][, callback])
<code>get()</code> is the primary method for fetching data from the store. The `key` can be an arbitrary data object. If it doesn't exist in the store then the callback or promise will receive an error. A not-found err object will be of type `'NotFoundError'` so you can `err.type == 'NotFoundError'` or you can perform a truthy test on the property `err.notFound`.

```js
db.get('foo', function (err, value) {
  if (err) {
    if (err.notFound) {
      // handle a 'NotFoundError' here
      return
    }
    // I/O or other error, pass it up the callback chain
    return callback(err)
  }

  // .. handle `value` here
})
```

`options` is passed on to the underlying store.

If no callback is passed, a promise is returned.

--------------------------------------------------------
<a name="del"></a>
### db.del(key[, options][, callback])
<code>del()</code> is the primary method for removing data from the store.
```js
db.del('foo', function (err) {
  if (err)
    // handle I/O or other error
});
```

`options` is passed on to the underlying store.

If no callback is passed, a promise is returned.

--------------------------------------------------------
<a name="batch"></a>
### db.batch(array[, options][, callback]) *(array form)*
<code>batch()</code> can be used for very fast bulk-write operations (both *put* and *delete*). The `array` argument should contain a list of operations to be executed sequentially, although as a whole they are performed as an atomic operation inside LevelDB.

Each operation is contained in an object having the following properties: `type`, `key`, `value`, where the *type* is either `'put'` or `'del'`. In the case of `'del'` the `'value'` property is ignored. Any entries with a `'key'` of `null` or `undefined` will cause an error to be returned on the `callback` and any `'type': 'put'` entry with a `'value'` of `null` or `undefined` will return an error.

If `key` and `value` are defined but `type` is not, it will default to `'put'`.

```js
var ops = [
  { type: 'del', key: 'father' },
  { type: 'put', key: 'name', value: 'Yuri Irsenovich Kim' },
  { type: 'put', key: 'dob', value: '16 February 1941' },
  { type: 'put', key: 'spouse', value: 'Kim Young-sook' },
  { type: 'put', key: 'occupation', value: 'Clown' }
]

db.batch(ops, function (err) {
  if (err) return console.log('Ooops!', err)
  console.log('Great success dear leader!')
})
```

`options` is passed on to the underlying store.

If no callback is passed, a promise is returned.

--------------------------------------------------------
<a name="batch_chained"></a>
### db.batch() *(chained form)*
<code>batch()</code>, when called with no arguments will return a `Batch` object which can be used to build, and eventually commit, an atomic LevelDB batch operation. Depending on how it's used, it is possible to obtain greater performance when using the chained form of `batch()` over the array form.

```js
db.batch()
  .del('father')
  .put('name', 'Yuri Irsenovich Kim')
  .put('dob', '16 February 1941')
  .put('spouse', 'Kim Young-sook')
  .put('occupation', 'Clown')
  .write(function () { console.log('Done!') })
```

<b><code>batch.put(key, value)</code></b>

Queue a *put* operation on the current batch, not committed until a `write()` is called on the batch.

This method may `throw` a `WriteError` if there is a problem with your put (such as the `value` being `null` or `undefined`).

<b><code>batch.del(key)</code></b>

Queue a *del* operation on the current batch, not committed until a `write()` is called on the batch.

This method may `throw` a `WriteError` if there is a problem with your delete.

<b><code>batch.clear()</code></b>

Clear all queued operations on the current batch, any previous operations will be discarded.

<b><code>batch.length</code></b>

The number of queued operations on the current batch.

<b><code>batch.write([callback])</code></b>

Commit the queued operations for this batch. All operations not *cleared* will be written to the database atomically, that is, they will either all succeed or fail with no partial commits.

If no callback is passed, a promise is returned.

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

You can obtain a **ReadStream** of the full database by calling the `createReadStream()` method. The resulting stream is a complete Node.js-style [Readable Stream](http://nodejs.org/docs/latest/api/stream.html#stream_readable_stream) where `'data'` events emit objects with `'key'` and `'value'` pairs. You can also use the `gt`, `lt` and `limit` options to control the range of keys that are streamed.

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
    console.log('Stream ended')
  })
```

The standard `pause()`, `resume()` and `destroy()` methods are implemented on the ReadStream, as is `pipe()` (see below). `'data'`, '`error'`, `'end'` and `'close'` events are emitted.

Additionally, you can supply an options object as the first parameter to `createReadStream()` with the following options:

* `'gt'` (greater than), `'gte'` (greater than or equal) define the lower bound of the range to be streamed. Only records where the key is greater than (or equal to) this option will be included in the range. When `reverse=true` the order will be reversed, but the records streamed will be the same.

* `'lt'` (less than), `'lte'` (less than or equal) define the higher bound of the range to be streamed. Only key/value pairs where the key is less than (or equal to) this option will be included in the range. When `reverse=true` the order will be reversed, but the records streamed will be the same.

* `'start', 'end'` legacy ranges - instead use `'gte', 'lte'`

* `'reverse'` *(boolean, default: `false`)*: a boolean, set true and the stream output will be reversed. Beware that due to the way LevelDB works, a reverse seek will be slower than a forward seek.

* `'keys'` *(boolean, default: `true`)*: whether the `'data'` event should contain keys. If set to `true` and `'values'` set to `false` then `'data'` events will simply be keys, rather than objects with a `'key'` property. Used internally by the `createKeyStream()` method.

* `'values'` *(boolean, default: `true`)*: whether the `'data'` event should contain values. If set to `true` and `'keys'` set to `false` then `'data'` events will simply be values, rather than objects with a `'value'` property. Used internally by the `createValueStream()` method.

* `'limit'` *(number, default: `-1`)*: limit the number of results collected by this stream. This number represents a *maximum* number of results and may not be reached if you get to the end of the data first. A value of `-1` means there is no limit. When `reverse=true` the highest keys will be returned instead of the lowest keys.

--------------------------------------------------------
<a name="createKeyStream"></a>
### db.createKeyStream([options])

A **KeyStream** is a **ReadStream** where the `'data'` events are simply the keys from the database so it can be used like a traditional stream rather than an object stream.

You can obtain a KeyStream either by calling the `createKeyStream()` method on a LevelUP object or by passing an options object to `createReadStream()` with `keys` set to `true` and `values` set to `false`.

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

You can obtain a ValueStream either by calling the `createValueStream()` method on a LevelUP object or by passing an options object to `createReadStream()` with `values` set to `true` and `keys` set to `false`.

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
<a name="writeStreams"></a>
#### What happened to `db.createWriteStream`?

`db.createWriteStream()` has been removed in order to provide a smaller and more maintainable core. It primarily existed to create symmetry with `db.createReadStream()` but through much [discussion](https://github.com/level/levelup/issues/199), removing it was the best course of action.

The main driver for this was performance. While `db.createReadStream()` performs well under most use cases, `db.createWriteStream()` was highly dependent on the application keys and values. Thus we can't provide a standard implementation and encourage more `write-stream` implementations to be created to solve the broad spectrum of use cases.

Check out the implementations that the community has already produced [here](https://github.com/level/levelup/wiki/Modules#write-streams).

--------------------------------------------------------

<a name="promises"></a>
Promise Support
---------------

LevelUp ships with native `Promise` support out of the box.

Each function taking a callback also can be used as a promise, if the callback is omitted. This applies for:

- `db.get(key[, options])`
- `db.put(key, value[, options])`
- `db.del(key[, options])`
- `db.batch(ops[, options])`
- `db.batch().write()`

The only exception is the `levelup` constructor itself, which if no callback is passed will lazily open the database backend in the background.

Example:

```js
var db = levelup(leveldown('./my-db'))

db.put('foo', 'bar')
  .then(function () { return db.get('foo') })
  .then(function (value) { console.log(value) })
  .catch(function (err) { console.error(err) })
```

Or using `async/await`:

```js
const main = async () {
  const db = levelup(leveldown('./my-db'))

  await db.put('foo', 'bar')
  console.log(await db.get('foo'))
}
```

--------------------------------------------------------

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

<a name="extending"></a>
Extending LevelUP
-----------------

A list of <a href="https://github.com/level/levelup/wiki/Modules"><b>Node.js LevelDB modules and projects</b></a> can be found in the wiki.

When attempting to extend the functionality of LevelUP, it is recommended that you consider using [level-hooks](https://github.com/dominictarr/level-hooks) and/or [level-sublevel](https://github.com/dominictarr/level-sublevel). **level-sublevel** is particularly helpful for keeping additional, extension-specific, data in a LevelDB store. It allows you to partition a LevelUP instance into multiple sub-instances that each correspond to discrete namespaced key ranges.

<a name="multiproc"></a>
Multi-process access
--------------------

LevelDB is thread-safe but is **not** suitable for accessing with multiple processes. You should only ever have a LevelDB database open from a single Node.js process. Node.js clusters are made up of multiple processes so a LevelUP instance cannot be shared between them either.

See the <a href="https://github.com/level/levelup/wiki/Modules"><b>wiki</b></a> for some LevelUP extensions, including [multilevel](https://github.com/juliangruber/multilevel), that may help if you require a single data store to be shared across processes.

<a name="support"></a>
Getting support
---------------

There are multiple ways you can find help in using LevelDB in Node.js:

 * **IRC:** you'll find an active group of LevelUP users in the **##leveldb** channel on Freenode, including most of the contributors to this project.
 * **Mailing list:** there is an active [Node.js LevelDB](https://groups.google.com/forum/#!forum/node-levelup) Google Group.
 * **GitHub:** you're welcome to open an issue here on this GitHub repository if you have a question.

<a name="contributing"></a>
Contributing
------------

LevelUP is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [contribution guide](https://github.com/Level/community/blob/master/CONTRIBUTING.md) for more details.

### Windows

A large portion of the Windows support comes from code by [Krzysztof Kowalczyk](http://blog.kowalczyk.info/) [@kjk](https://twitter.com/kjk), see his Windows LevelDB port [here](http://code.google.com/r/kkowalczyk-leveldb/). If you're using LevelUP on Windows, you should give him your thanks!


<a name="license"></a>
License &amp; copyright
-------------------

Copyright &copy; 2012-2017 **LevelUP** [contributors](https://github.com/level/community#contributors).

**LevelUP** is licensed under the MIT license. All rights not explicitly granted in the MIT license are reserved. See the included `LICENSE.md` file for more details.

*LevelUP builds on the excellent work of the LevelDB and Snappy teams from Google and additional contributors. LevelDB and Snappy are both issued under the [New BSD Licence](http://opensource.org/licenses/BSD-3-Clause).*
