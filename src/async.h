#ifndef LU_ASYNC_H
#define LU_ASYNC_H

#include <cstdlib>
#include <vector>
#include <node.h>

using namespace std;
using namespace v8;
using namespace leveldb;

void runCallback (Persistent<Function> callback, Local<Value> argv[], int length);

class AsyncWorker {
public:
  AsyncWorker (
      Database* database
    , Persistent<Function> callback
  ) : database(database)
    , callback(callback) {
        request.data               = this;
      };

  uv_work_t            request;
  Database*            database;
  Persistent<Function> callback;
  Status               status;
  virtual void         WorkComplete ();
  virtual void         Execute () {};

protected:
  virtual void         HandleOKCallback ();
  virtual void         HandleErrorCallback ();
};

void AsyncExecute (uv_work_t* req);
void AsyncExecuteComplete (uv_work_t* req);
void AsyncQueueWorker (AsyncWorker* worker);

#endif