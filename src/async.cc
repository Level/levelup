/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#include <cstdlib>
#include <node.h>
#include <node_buffer.h>
#include <iostream>
#include <pthread.h>

#include "database.h"

#include "levelup.h"
#include "async.h"
#include "batch.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace leveldb;

/** ASYNC BASE **/

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
