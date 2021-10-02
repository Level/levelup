# levelup

[![level badge][level-badge]](https://github.com/Level/awesome)
[![npm](https://img.shields.io/npm/v/levelup.svg)](https://www.npmjs.com/package/levelup)
[![Node version](https://img.shields.io/node/v/levelup.svg)](https://www.npmjs.com/package/levelup)
[![Test](https://img.shields.io/github/workflow/status/Level/levelup/Test?label=test)](https://github.com/Level/levelup/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/codecov/c/github/Level/levelup?label=&logo=codecov&logoColor=fff)](https://codecov.io/gh/Level/levelup)
[![Standard](https://img.shields.io/badge/standard-informational?logo=javascript&logoColor=fff)](https://standardjs.com)
[![Common Changelog](https://common-changelog.org/badge.svg)](https://common-changelog.org)
[![Donate](https://img.shields.io/badge/donate-orange?logo=open-collective&logoColor=fff)](https://opencollective.com/level)

## Table of Contents

<details><summary>Click to expand</summary>

- [Introduction](#introduction)
- [Supported Platforms](#supported-platforms)
- [Usage](#usage)
- [API](#api)
  - [`levelup(db[, options[, callback]])`](#levelupdb-options-callback)
  - [`db.supports`](#dbsupports)
  - [`db.open([options][, callback])`](#dbopenoptions-callback)
  - [`db.close([callback])`](#dbclosecallback)
  - [`db.put(key, value[, options][, callback])`](#dbputkey-value-options-callback)
  - [`db.get(key[, options][, callback])`](#dbgetkey-options-callback)
  - [`db.getMany(keys[, options][, callback])`](#dbgetmanykeys-options-callback)
  - [`db.del(key[, options][, callback])`](#dbdelkey-options-callback)
  - [`db.batch(array[, options][, callback])` _(array form)_](#dbbatcharray-options-callback-array-form)
  - [`db.batch()` _(chained form)_](#dbbatch-chained-form)
  - [`db.status`](#dbstatus)
  - [`db.isOperational()`](#dbisoperational)
  - [`db.createReadStream([options])`](#dbcreatereadstreamoptions)
  - [`db.createKeyStream([options])`](#dbcreatekeystreamoptions)
  - [`db.createValueStream([options])`](#dbcreatevaluestreamoptions)
  - [`db.iterator([options])`](#dbiteratoroptions)
  - [`db.clear([options][, callback])`](#dbclearoptions-callback)
- [What happened to `db.createWriteStream`?](#what-happened-to-dbcreatewritestream)
- [Promise Support](#promise-support)
- [Events](#events)
- [Multi-process Access](#multi-process-access)
- [Contributing](#contributing)
- [Big Thanks](#big-thanks)
- [Donate](#donate)
- [License](#license)

</details>

## Introduction

**Fast and simple storage. A Node.js wrapper for `abstract-leveldown` compliant stores, which follow the characteristics of [LevelDB](https://github.com/google/leveldb).**

LevelDB is a simple key-value store built by Google. It's used in Google Chrome and many other products. LevelDB supports arbitrary byte arrays as both keys and values, singular _get_, _put_ and _delete_ operations, _batched put and delete_, bi-directional iterators and simple compression using the very fast [Snappy](http://google.github.io/snappy/) algorithm.

LevelDB stores entries sorted lexicographically by keys. This makes the streaming interface of `levelup` - which exposes LevelDB iterators as [Readable Streams](https://nodejs.org/docs/latest/api/stream.html#stream_readable_streams) - a very powerful query mechanism.

The most common store is [`leveldown`](https://github.com/Level/leveldown/) which provides a pure C++ binding to LevelDB. [Many alternative stores are available](https://github.com/Level/awesome/#stores) such as [`level.js`](https://github.com/Level/level.js) in the browser or [`memdown`](https://github.com/Level/memdown) for an in-memory store. They typically support strings and Buffers for both keys and values. For a richer set of data types you can wrap the store with [`encoding-down`](https://github.com/Level/encoding-down).

**The [`level`](https://github.com/Level/level) package is the recommended way to get started.** It conveniently bundles `levelup`, [`leveldown`](https://github.com/Level/leveldown/) and [`encoding-down`](https://github.com/Level/encoding-down). Its main export is `levelup` - i.e. you can do `var db = require('level')`.

## Supported Platforms

We aim to support Active LTS and Current Node.js releases as well as browsers. For support of the underlying store, please see the respective documentation.

[![Sauce Test Status](https://app.saucelabs.com/browser-matrix/levelup.svg)](https://app.saucelabs.com/u/levelup)

## Usage

_If you are upgrading: please see [`UPGRADING.md`](UPGRADING.md)._

First you need to install `levelup`! No stores are included so you must also install `leveldown` (for example).

```sh
$ npm install levelup leveldown
```

All operations are asynchronous. If you do not provide a callback, [a Promise is returned](#promise-support).

```js
var levelup = require('levelup')
var leveldown = require('leveldown')

// 1) Create our store
var db = levelup(leveldown('./mydb'))

// 2) Put a key & value
db.put('name', 'levelup', function (err) {
  if (err) return console.log('Ooops!', err) // some kind of I/O error

  // 3) Fetch by key
  db.get('name', function (err, value) {
    if (err) return console.log('Ooops!', err) // likely the key was not found

    // Ta da!
    console.log('name=' + value)
  })
})
```

## API

### `levelup(db[, options[, callback]])`

The main entry point for creating a new `levelup` instance.

- `db` must be an [`abstract-leveldown`](https://github.com/Level/abstract-leveldown) compliant store.
- `options` is passed on to the underlying store when opened and is specific to the type of store being used

Calling `levelup(db)` will also open the underlying store. This is an asynchronous operation which will trigger your callback if you provide one. The callback should take the form `function (err, db) {}` where `db` is the `levelup` instance. If you don't provide a callback, any read & write operations are simply queued internally until the store is fully opened, unless it fails to open, in which case an `error` event will be emitted.

This leads to two alternative ways of managing a `levelup` instance:

```js
levelup(leveldown(location), options, function (err, db) {
  if (err) throw err

  db.get('foo', function (err, value) {
    if (err) return console.log('foo does not exist')
    console.log('got foo =', value)
  })
})
```

Versus the equivalent:

```js
// Will throw if an error occurs
var db = levelup(leveldown(location), options)

db.get('foo', function (err, value) {
  if (err) return console.log('foo does not exist')
  console.log('got foo =', value)
})
```

### `db.supports`

A read-only [manifest](https://github.com/Level/supports). Might be used like so:

```js
if (!db.supports.permanence) {
  throw new Error('Persistent storage is required')
}

if (db.supports.bufferKeys && db.supports.promises) {
  await db.put(Buffer.from('key'), 'value')
}
```

### `db.open([options][, callback])`

Opens the underlying store. In general you shouldn't need to call this method directly as it's automatically called by [`levelup()`](#levelupdb-options-callback). However, it is possible to reopen the store after it has been closed with [`close()`](#dbclosecallback).

If no callback is passed, a promise is returned.

### `db.close([callback])`

`close()` closes the underlying store. The callback will receive any error encountered during closing as the first argument.

You should always clean up your `levelup` instance by calling `close()` when you no longer need it to free up resources. A store cannot be opened by multiple instances of `levelup` simultaneously.

If no callback is passed, a promise is returned.

### `db.put(key, value[, options][, callback])`

`put()` is the primary method for inserting data into the store. Both `key` and `value` can be of any type as far as `levelup` is concerned.

`options` is passed on to the underlying store.

If no callback is passed, a promise is returned.

### `db.get(key[, options][, callback])`

Get a value from the store by `key`. The `key` can be of any type. If it doesn't exist in the store then the callback or promise will receive an error. A not-found err object will be of type `'NotFoundError'` so you can `err.type == 'NotFoundError'` or you can perform a truthy test on the property `err.notFound`.

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

The optional `options` object is passed on to the underlying store.

If no callback is passed, a promise is returned.

### `db.getMany(keys[, options][, callback])`

Get multiple values from the store by an array of `keys`. The optional `options` object is passed on to the underlying store.

The `callback` function will be called with an `Error` if the operation failed for any reason. If successful the first argument will be `null` and the second argument will be an array of values with the same order as `keys`. If a key was not found, the relevant value will be `undefined`.

If no callback is provided, a promise is returned.

### `db.del(key[, options][, callback])`

`del()` is the primary method for removing data from the store.

```js
db.del('foo', function (err) {
  if (err)
    // handle I/O or other error
});
```

`options` is passed on to the underlying store.

If no callback is passed, a promise is returned.

### `db.batch(array[, options][, callback])` _(array form)_

`batch()` can be used for very fast bulk-write operations (both _put_ and _delete_). The `array` argument should contain a list of operations to be executed sequentially, although as a whole they are performed as an atomic operation inside the underlying store.

Each operation is contained in an object having the following properties: `type`, `key`, `value`, where the _type_ is either `'put'` or `'del'`. In the case of `'del'` the `value` property is ignored. Any entries with a `key` of `null` or `undefined` will cause an error to be returned on the `callback` and any `type: 'put'` entry with a `value` of `null` or `undefined` will return an error.

```js
const ops = [
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

### `db.batch()` _(chained form)_

`batch()`, when called with no arguments will return a `Batch` object which can be used to build, and eventually commit, an atomic batch operation. Depending on how it's used, it is possible to obtain greater performance when using the chained form of `batch()` over the array form.

```js
db.batch()
  .del('father')
  .put('name', 'Yuri Irsenovich Kim')
  .put('dob', '16 February 1941')
  .put('spouse', 'Kim Young-sook')
  .put('occupation', 'Clown')
  .write(function () { console.log('Done!') })
```

**`batch.put(key, value[, options])`**

Queue a _put_ operation on the current batch, not committed until a `write()` is called on the batch. The `options` argument, if provided, must be an object and is passed on to the underlying store.

This method may `throw` a `WriteError` if there is a problem with your put (such as the `value` being `null` or `undefined`).

**`batch.del(key[, options])`**

Queue a _del_ operation on the current batch, not committed until a `write()` is called on the batch. The `options` argument, if provided, must be an object and is passed on to the underlying store.

This method may `throw` a `WriteError` if there is a problem with your delete.

**`batch.clear()`**

Clear all queued operations on the current batch, any previous operations will be discarded.

**`batch.length`**

The number of queued operations on the current batch.

**`batch.write([options][, callback])`**

Commit the queued operations for this batch. All operations not _cleared_ will be written to the underlying store atomically, that is, they will either all succeed or fail with no partial commits.

The optional `options` object is passed to the `.write()` operation of the underlying batch object.

If no callback is passed, a promise is returned.

### `db.status`

A readonly string that is one of:

- `new`     - newly created, not opened or closed
- `opening` - waiting for the underlying store to be opened
- `open`    - successfully opened the store, available for use
- `closing` - waiting for the store to be closed
- `closed`  - store has been successfully closed.

### `db.isOperational()`

Returns `true` if the store accepts operations, which in the case of `levelup` means that `status` is either `opening` or `open`, because it opens itself and queues up operations until opened.

### `db.createReadStream([options])`

Returns a [Readable Stream](https://nodejs.org/docs/latest/api/stream.html#stream_readable_streams) of key-value pairs. A pair is an object with `key` and `value` properties. By default it will stream all entries in the underlying store from start to end. Use the options described below to control the range, direction and results.

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

You can supply an options object as the first parameter to `createReadStream()` with the following properties:

- `gt` (greater than), `gte` (greater than or equal) define the lower bound of the range to be streamed. Only entries where the key is greater than (or equal to) this option will be included in the range. When `reverse=true` the order will be reversed, but the entries streamed will be the same.

- `lt` (less than), `lte` (less than or equal) define the higher bound of the range to be streamed. Only entries where the key is less than (or equal to) this option will be included in the range. When `reverse=true` the order will be reversed, but the entries streamed will be the same.

- `reverse` _(boolean, default: `false`)_: stream entries in reverse order. Beware that due to the way that stores like LevelDB work, a reverse seek can be slower than a forward seek.

- `limit` _(number, default: `-1`)_: limit the number of entries collected by this stream. This number represents a _maximum_ number of entries and may not be reached if you get to the end of the range first. A value of `-1` means there is no limit. When `reverse=true` the entries with the highest keys will be returned instead of the lowest keys.

- `keys` _(boolean, default: `true`)_: whether the results should contain keys. If set to `true` and `values` set to `false` then results will simply be keys, rather than objects with a `key` property. Used internally by the `createKeyStream()` method.

- `values` _(boolean, default: `true`)_: whether the results should contain values. If set to `true` and `keys` set to `false` then results will simply be values, rather than objects with a `value` property. Used internally by the `createValueStream()` method.

### `db.createKeyStream([options])`

Returns a [Readable Stream](https://nodejs.org/docs/latest/api/stream.html#stream_readable_streams) of keys rather than key-value pairs. Use the same options as described for [`createReadStream()`](#dbcreatereadstreamoptions) to control the range and direction.

You can also obtain this stream by passing an options object to `createReadStream()` with `keys` set to `true` and `values` set to `false`. The result is equivalent; both streams operate in [object mode](https://nodejs.org/docs/latest/api/stream.html#stream_object_mode).

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

### `db.createValueStream([options])`

Returns a [Readable Stream](https://nodejs.org/docs/latest/api/stream.html#stream_readable_streams) of values rather than key-value pairs. Use the same options as described for [`createReadStream()`](#dbcreatereadstreamoptions) to control the range and direction.

You can also obtain this stream by passing an options object to `createReadStream()` with `values` set to `true` and `keys` set to `false`. The result is equivalent; both streams operate in [object mode](https://nodejs.org/docs/latest/api/stream.html#stream_object_mode).

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

### `db.iterator([options])`

Returns an [`abstract-leveldown` iterator](https://github.com/Level/abstract-leveldown/#abstractleveldown_iteratoroptions), which is what powers the readable streams above. Options are the same as the range options of [`createReadStream()`](#dbcreatereadstreamoptions) and are passed to the underlying store.

These iterators support [`for await...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of):

```js
for await (const [key, value] of db.iterator()) {
  console.log(value)
}
```

### `db.clear([options][, callback])`

Delete all entries or a range. Not guaranteed to be atomic. Accepts the following range options (with the same rules as on iterators):

- `gt` (greater than), `gte` (greater than or equal) define the lower bound of the range to be deleted. Only entries where the key is greater than (or equal to) this option will be included in the range. When `reverse=true` the order will be reversed, but the entries deleted will be the same.
- `lt` (less than), `lte` (less than or equal) define the higher bound of the range to be deleted. Only entries where the key is less than (or equal to) this option will be included in the range. When `reverse=true` the order will be reversed, but the entries deleted will be the same.
- `reverse` _(boolean, default: `false`)_: delete entries in reverse order. Only effective in combination with `limit`, to remove the last N records.
- `limit` _(number, default: `-1`)_: limit the number of entries to be deleted. This number represents a _maximum_ number of entries and may not be reached if you get to the end of the range first. A value of `-1` means there is no limit. When `reverse=true` the entries with the highest keys will be deleted instead of the lowest keys.

If no options are provided, all entries will be deleted. The `callback` function will be called with no arguments if the operation was successful or with an `WriteError` if it failed for any reason.

If no callback is passed, a promise is returned.

## What happened to `db.createWriteStream`?

`db.createWriteStream()` has been removed in order to provide a smaller and more maintainable core. It primarily existed to create symmetry with `db.createReadStream()` but through much [discussion](https://github.com/Level/levelup/issues/199), removing it was the best course of action.

The main driver for this was performance. While `db.createReadStream()` performs well under most use cases, `db.createWriteStream()` was highly dependent on the application keys and values. Thus we can't provide a standard implementation and encourage more `write-stream` implementations to be created to solve the broad spectrum of use cases.

Check out the implementations that the community has produced [here](https://github.com/Level/awesome#streams).

## Promise Support

Each function accepting a callback returns a promise if the callback is omitted. The only exception is the `levelup` constructor itself, which if no callback is passed will lazily open the underlying store in the background.

Example:

```js
const db = levelup(leveldown('./my-db'))
await db.put('foo', 'bar')
console.log(await db.get('foo'))
```

## Events

`levelup` is an [`EventEmitter`](https://nodejs.org/api/events.html) and emits the following events.

| Event     | Description                 | Arguments            |
| :-------- | :-------------------------- | :------------------- |
| `put`     | Key has been updated        | `key, value` (any)   |
| `del`     | Key has been deleted        | `key` (any)          |
| `batch`   | Batch has executed          | `operations` (array) |
| `clear`   | Entries were deleted        | `options` (object)   |
| `opening` | Underlying store is opening | -                    |
| `open`    | Store has opened            | -                    |
| `ready`   | Alias of `open`             | -                    |
| `closing` | Store is closing            | -                    |
| `closed`  | Store has closed.           | -                    |
| `error`   | An error occurred           | `error` (Error)      |

For example you can do:

```js
db.on('put', function (key, value) {
  console.log('inserted', { key, value })
})
```

## Multi-process Access

Stores like LevelDB are thread-safe but they are **not** suitable for accessing with multiple processes. You should only ever have a store open from a single Node.js process. Node.js clusters are made up of multiple processes so a `levelup` instance cannot be shared between them either.

See [`Level/awesome`](https://github.com/Level/awesome#shared-access) for modules like [`multileveldown`](https://github.com/mafintosh/multileveldown) that may help if you require a single store to be shared across processes.

## Contributing

[`Level/levelup`](https://github.com/Level/levelup) is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [Contribution Guide](https://github.com/Level/community/blob/master/CONTRIBUTING.md) for more details.

## Big Thanks

Cross-browser Testing Platform and Open Source ♥ Provided by [Sauce Labs](https://saucelabs.com).

[![Sauce Labs logo](./sauce-labs.svg)](https://saucelabs.com)

## Donate

Support us with a monthly donation on [Open Collective](https://opencollective.com/level) and help us continue our work.

## License

[MIT](LICENSE)

[level-badge]: https://leveljs.org/img/badge.svg
