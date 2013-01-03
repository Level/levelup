/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#ifndef LU_DATABASE_ASYNC_H
#define LU_DATABASE_ASYNC_H

#include <cstdlib>
#include <vector>
#include <node.h>
#include "async.h"
#include "batch.h"
#include "leveldb/cache.h"

using namespace std;
using namespace v8;
using namespace leveldb;

class OpenWorker  : public AsyncWorker {
public:
  OpenWorker (
      Database* database
    , Persistent<Function> callback
    , string location
    , bool createIfMissing
    , bool errorIfExists
    , bool compression
    , uint32_t cacheSize
  ) : AsyncWorker(database, callback)
    , location(location)
  {
    options = new Options();
    options->create_if_missing = createIfMissing;
    options->error_if_exists = errorIfExists;
    options->compression = compression ? kSnappyCompression : kNoCompression;
    options->block_cache = NewLRUCache(cacheSize);
  };

  virtual ~OpenWorker ();
  virtual void Execute ();

private:
  string location;
  Options* options;
};

class CloseWorker : public AsyncWorker {
public:
  CloseWorker (
      Database* database
    , Persistent<Function> callback
  ) : AsyncWorker(database, callback)
  {};

  virtual ~CloseWorker ();
  virtual void Execute ();
  virtual void WorkComplete ();
};

class IOWorker    : public AsyncWorker {
public:
  IOWorker (
      Database* database
    , Persistent<Function> callback
    , Slice key
    , Persistent<Value> keyPtr
  ) : AsyncWorker(database, callback)
    , key(key)
    , keyPtr(keyPtr)
  {};

  virtual ~IOWorker ();
  virtual void WorkComplete ();

protected:
  Slice key;
  Persistent<Value> keyPtr;
};

class ReadWorker : public IOWorker {
public:
  ReadWorker (
      Database* database
    , Persistent<Function> callback
    , Slice key
    , bool asBuffer
    , bool fillCache
    , Persistent<Value> keyPtr
  ) : IOWorker(database, callback, key, keyPtr)
    , asBuffer(asBuffer)
  {
    options = new ReadOptions();
    options->fill_cache = fillCache;
  };

  virtual ~ReadWorker ();
  virtual void Execute ();
  virtual void HandleOKCallback ();

private:
  bool asBuffer;
  ReadOptions* options;
  string value;
};

class DeleteWorker : public IOWorker {
public:
  DeleteWorker (
      Database* database
    , Persistent<Function> callback
    , Slice key
    , bool sync
    , Persistent<Value> keyPtr
  ) : IOWorker(database, callback, key, keyPtr)
  {
    options = new WriteOptions();
    options->sync = sync;
  };

  virtual ~DeleteWorker ();
  virtual void Execute ();

protected:
  WriteOptions* options;
};

class WriteWorker : public DeleteWorker {
public:
  WriteWorker (
      Database* database
    , Persistent<Function> callback
    , Slice key
    , Slice value
    , bool sync
    , Persistent<Value> keyPtr
    , Persistent<Value> valuePtr
  ) : DeleteWorker(database, callback, key, sync, keyPtr)
    , value(value)
    , valuePtr(valuePtr)
  {};

  virtual void Execute ();
  virtual void WorkComplete ();

private:
  Slice value;
  Persistent<Value> valuePtr;
};

class BatchWorker : public AsyncWorker {
public:
  BatchWorker (
      Database* database
    , Persistent<Function> callback
    , vector<BatchOp*>* operations
    , bool sync
  ) : AsyncWorker(database, callback)
    , operations(operations)
  {
    options = new WriteOptions();
    options->sync = sync;
  };

  virtual ~BatchWorker ();
  virtual void Execute ();

private:
  WriteOptions* options;
  vector<BatchOp*>* operations;
};

class ApproximateSizeWorker : public AsyncWorker {
public:
  ApproximateSizeWorker (
      Database* database
    , Persistent<Function> callback
    , Slice start
    , Slice end
    , Persistent<Value> startPtr
    , Persistent<Value> endPtr
  ) : AsyncWorker(database, callback)
    , range(start, end)
    , startPtr(startPtr)
    , endPtr(endPtr)
  {};

  virtual void Execute ();
  virtual void HandleOKCallback ();
  virtual void WorkComplete ();

  private:
    Range range;
    Persistent<Value> startPtr;
    Persistent<Value> endPtr;
    uint64_t size;
};

#endif
