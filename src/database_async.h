/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

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
  );

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
  );

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
  );

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
  );

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
  );

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
  );

  virtual ~WriteWorker ();
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
  );

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
  );

  virtual ~ApproximateSizeWorker ();
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
