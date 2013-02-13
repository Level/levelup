/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#include <node.h>

#include "database.h"
#include "levelup.h"
#include "async.h"
#include "batch.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace leveldb;

/** ASYNC BASE **/

AsyncWorker::AsyncWorker (Database* database, Persistent<Function> callback)
    : database(database), callback(callback) {
  request.data = this;
};

AsyncWorker::~AsyncWorker () {}

void AsyncWorker::WorkComplete () {
  HandleScope scope;
  if (status.ok())
    HandleOKCallback();
  else
    HandleErrorCallback();
  callback.Dispose();
}

void AsyncWorker::HandleOKCallback () {
  Local<Value> argv[0];
  RunCallback(callback, argv, 0);  
}

void AsyncWorker::HandleErrorCallback () {
  Local<Value> argv[] = {
      Local<Value>::New(Exception::Error(String::New(status.ToString().c_str())))
  };
  RunCallback(callback, argv, 1);
}

void AsyncExecute (uv_work_t* req) {
  static_cast<AsyncWorker*>(req->data)->Execute();
}

void AsyncExecuteComplete (uv_work_t* req) {
  AsyncWorker* worker = static_cast<AsyncWorker*>(req->data);
  worker->WorkComplete();
  delete worker;
}

void AsyncQueueWorker (AsyncWorker* worker) {
  uv_queue_work(uv_default_loop(), &worker->request, AsyncExecute, (uv_after_work_cb)AsyncExecuteComplete);
}
