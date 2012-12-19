/* Copyright (c) 2012 Rod Vagg <@rvagg> */

var Stream       = require('stream').Stream
  , concatStream = require('concat-stream')

  , extend       = require('./util').extend

  , defaultOptions = {}

function WriteStream (options, db) {
  this.__proto__.__proto__ = Stream.prototype
  Stream.call(this)
  this._options = extend(extend({}, defaultOptions), options)
  this._db      = db
  this._buffer  = []
  this._status  = 'init'
  this._end     = false
  this.writable = true
  this.readable = false

  var ready = function () {
    if (!this.writable)
      return
    this._status = 'ready'
    this.emit('ready')
    this._process()
  }.bind(this)

  if (db.isOpen())
    process.nextTick(ready)
  else
    db.once('ready', ready)
}

WriteStream.prototype = {
    write: function (data) {
      if (!this.writable)
        return false
      this._buffer.push(data)
      if (this._status != 'init')
        this._processDelayed()
      if (this._options.maxBufferLength && this._buffer.length > this._options.maxBufferLength) {
        this._writeBlock = true
        return false
      }
      return true
    }

  , end: function() {
      process.nextTick(function () {
        this._end = true
        this._process()
      }.bind(this))
    }

  , destroy: function() {
      this.writable = false
      this.end()
    }

  , destroySoon: function() {
      this.end()
    }

  , add: function(entry) {
      if (!entry.props)
        return
      if (entry.props.Directory)
        entry.pipe(this._db.writeStream(this._options))
      else if (entry.props.File || entry.File || entry.type == 'File')
        this._write(entry)
      return true
    }

  , _processDelayed: function() {
      process.nextTick(this._process.bind(this))
    }

  , _process: function() {
      var cb = function (err) {
            if (!this.writable)
              return
            if (this._status != 'closed')
              this._status = 'ready'
            if (err) {
              this.writable = false
              return this.emit('error', err)
            }
            this._process()
          }.bind(this)
        , buffer, entry

      if (this._status != 'ready' && this.writable) {
        if (this._buffer.length && this._status != 'closed')
          this._processDelayed()
        return
      }

      if (this._buffer.length && this.writable) {
        this._status = 'writing'
        buffer = this._buffer
        this._buffer = []
        if (this._buffer.length == 1) {
          entry = this._buffer.pop()
          if (entry.key !== undefined && entry.value !== undefined)
            this._db.put(entry.key, entry.value, cb)
        } else {
          this._db.batch(buffer.map(function (d) {
            return { type: 'put', key: d.key, value: d.value }
          }), cb)
        }
        if (this._writeBlock) {
          this._writeBlock = false
          this.emit('drain')
        }
      }

      if (this._end && this._status != 'closed') {
        this._status = 'closed'
        this.writable = false
        this.emit('close')
        return
      }
    }

  , _write: function (entry) {
      var key = entry.path || entry.props.path
      if (!key)
        return
      entry.pipe(concatStream(function (err, data) {
        if (err) {
          this.writable = false
          return this.emit('error', err)
        }
        if (this._options.fstreamRoot && key.indexOf(this._options.fstreamRoot) > -1)
          key = key.substr(this._options.fstreamRoot.length + 1)
        this.write({ key: key, value: data })
      }.bind(this)))
    }

  , toString: function () {
      return 'LevelUP.WriteStream'
    }
}

module.exports.create = function (options, db) {
  return new WriteStream(options, db)
}