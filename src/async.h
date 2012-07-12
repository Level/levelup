#ifndef LU_ASYNC_H
#define LU_ASYNC_H

#include <cstdlib>
#include <vector>
#include <node.h>

#include "batch.h"

using namespace std;
using namespace v8;
using namespace leveldb;

class AsyncWorker {
public:
  uv_work_t            request;
  Database*            database;
  Persistent<Function> callback;
  Status               status;
  void                 WorkComplete ();
  virtual void         Execute () {};

protected:
  virtual void         HandleOKCallback ();
  virtual void         HandleErrorCallback ();
};

class OpenWorker  : public AsyncWorker {
public:
  OpenWorker  (Database* database, Persistent<Function> callback, string location, bool createIfMissing, bool errorIfExists);
  ~OpenWorker ();

  string               location;
  Options*             options;
  virtual void         Execute ();
};

class CloseWorker : public AsyncWorker {
public:
  CloseWorker  (Database* database, Persistent<Function> callback);

  virtual void         Execute ();

private:
  virtual void         WorkComplete ();
};

class IOWorker    : public AsyncWorker {
public:
  string               key;
  string               value;
};

class WriteWorker : public IOWorker {
public:
  WriteWorker  (Database* database, Persistent<Function> callback, string key, string value, bool sync);
  WriteWorker  () {};
  ~WriteWorker ();

  WriteOptions*        options;
  virtual void         Execute ();
};

class ReadWorker : public IOWorker {
public:
  ReadWorker  (Database* database, Persistent<Function> callback, string key);
  ~ReadWorker ();

  ReadOptions*         options;
  virtual void         Execute ();

protected:
  virtual void         HandleOKCallback ();
};

class DeleteWorker : public WriteWorker {
public:
  DeleteWorker  (Database* database, Persistent<Function> callback, string key, bool sync);
  ~DeleteWorker ();

  virtual void         Execute ();
};

class BatchWorker : public AsyncWorker {
public:
  BatchWorker  (Database* database, Persistent<Function> callback, vector<BatchOp*> operations, bool sync);
  ~BatchWorker ();

  virtual void         Execute ();

private:
  WriteOptions*        options;
  vector<BatchOp*>     operations;
};

void AsyncExecute (uv_work_t* req);
void AsyncExecuteComplete (uv_work_t* req);
void AsyncQueueWorker (AsyncWorker* worker);

#endif