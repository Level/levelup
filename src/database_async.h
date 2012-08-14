/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#ifndef LU_DATABASE_ASYNC_H
#define LU_DATABASE_ASYNC_H

#include <cstdlib>
#include <vector>
#include <node.h>
#include "async.h"
#include "batch.h"

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
  ) : AsyncWorker(database, callback)
    , location(location)
  {
    options                    = new Options();
    options->create_if_missing = createIfMissing;
    options->error_if_exists   = errorIfExists;
  };

  ~OpenWorker () {
    delete options;
  }

  string               location;
  Options*             options;
  virtual void         Execute ();
};

class CloseWorker : public AsyncWorker {
public:
  CloseWorker (
      Database* database
    , Persistent<Function> callback
  ) : AsyncWorker(database, callback)
  {};

  virtual void         Execute ();

private:
  virtual void         WorkComplete ();
};

class IOWorker    : public AsyncWorker {
public:
  IOWorker (
      Database* database
    , Persistent<Function> callback
    , Slice key
    , Persistent<Object> keyPtr
  ) : AsyncWorker(database, callback)
    , key(key)
    , keyPtr(keyPtr)
  {};

  virtual void         WorkComplete ();

protected:
  Slice                key;
  Persistent<Object>   keyPtr;
};

class ReadWorker : public IOWorker {
public:
  ReadWorker (
      Database* database
    , Persistent<Function> callback
    , Slice key
    , Persistent<Object> keyPtr
  ) : IOWorker(database, callback, key, keyPtr)
  {
    options = new ReadOptions();
  };

  ~ReadWorker ();

  ReadOptions*         options;
  virtual void         Execute ();

protected:
  virtual void         HandleOKCallback ();

private:
  string               value;
};

class DeleteWorker : public IOWorker {
public:
  DeleteWorker (
      Database* database
    , Persistent<Function> callback
    , Slice key
    , bool sync
    , Persistent<Object> keyPtr
  ) : IOWorker(database, callback, key, keyPtr)
  {
    options        = new WriteOptions();
    options->sync  = sync;
  };

  ~DeleteWorker ();

  virtual void         Execute ();

protected:
  WriteOptions*        options;
};

class WriteWorker : public DeleteWorker {
public:
  WriteWorker (
      Database* database
    , Persistent<Function> callback
    , Slice key
    , Slice value
    , bool sync
    , Persistent<Object> keyPtr
    , Persistent<Object> valuePtr
  ) : DeleteWorker(database, callback, key, sync, keyPtr)
    , value(value)
    , valuePtr(valuePtr)
  {};

  ~WriteWorker ();

  virtual void         Execute ();
  virtual void         WorkComplete ();

private:
  Slice                value;
  Persistent<Object>   valuePtr;
};

class BatchWorker : public AsyncWorker {
public:
  BatchWorker (
      Database* database
    , Persistent<Function> callback
    , vector<BatchOp*> operations
    , bool sync
  ) : AsyncWorker(database, callback)
    , operations(operations)
  {
    options        = new WriteOptions();
    options->sync  = sync;
  };

  ~BatchWorker ();

  virtual void         Execute ();

private:
  WriteOptions*        options;
  vector<BatchOp*>     operations;
};

#endif
