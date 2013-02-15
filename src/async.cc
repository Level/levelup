/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#include <node.h>

#include "database.h"
#include "levelup.h"
#include "async.h"
#include "batch.h"

namespace levelup {

/** ASYNC BASE **/

AsyncWorker::AsyncWorker (Database* database, v8::Persistent<v8::Function> callback)
    : database(database), callback(callback) {
  request.data = this;
};

AsyncWorker::~AsyncWorker () {}

void AsyncWorker::WorkComplete () {
  v8::HandleScope scope;
  if (status.ok())
    HandleOKCallback();
  else
    HandleErrorCallback();
  callback.Dispose();
}

void AsyncWorker::HandleOKCallback () {
  v8::Local<v8::Value> argv[0];
  RUN_CALLBACK(callback, argv, 0);  
}

void AsyncWorker::HandleErrorCallback () {
  v8::Local<v8::Value> argv[] = {
      v8::Local<v8::Value>::New(
        v8::Exception::Error(v8::String::New(status.ToString().c_str()))
      )
  };
  RUN_CALLBACK(callback, argv, 1);
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
  uv_queue_work(
      uv_default_loop()
    , &worker->request
    , AsyncExecute
    , (uv_after_work_cb)AsyncExecuteComplete
  );
}

} // namespace levelup
