#include <cstdlib>
#include <node.h>
#include <iostream>
#include <pthread.h>

#include "database.h"

#include "async.h"
#include "batch.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace leveldb;

void runCallback (Persistent<Function> callback, Local<Value> argv[], int length);

/** ASYNC BASE **/

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
  runCallback(callback, argv, 0);  
}

void AsyncWorker::HandleErrorCallback () {
  Local<Value> argv[] = {
      Local<Value>::New(Exception::Error(String::New(status.ToString().c_str())))
  };
  runCallback(callback, argv, 1);
}

/** OPEN WORKER **/

OpenWorker::OpenWorker (Database* database, Persistent<Function> callback, string location, bool createIfMissing, bool errorIfExists) {
  request.data               = this;
  this->database             = database;
  this->location             = location;
  this->callback             = callback;
  options                    = new Options();
  options->create_if_missing = createIfMissing;
  options->error_if_exists   = errorIfExists;
}

OpenWorker::~OpenWorker () {
  delete options;
}

void OpenWorker::Execute() {
  status = database->OpenDatabase(options, location);
}

/** CLOSE WORKER **/

CloseWorker::CloseWorker (Database* database, Persistent<Function> callback) {
  request.data               = this;
  this->database             = database;
  this->callback             = callback;
}

void CloseWorker::Execute() {
  database->CloseDatabase();
}

void CloseWorker::WorkComplete () {
  HandleScope scope;
  HandleOKCallback();
  callback.Dispose();
}

/** WRITE WORKER **/

WriteWorker::WriteWorker (Database* database, Persistent<Function> callback, string key, string value, bool sync) {
  request.data   = this;
  this->database = database;
  this->callback = callback;
  this->key      = key;
  this->value    = value;
  options        = new WriteOptions();
  options->sync  = sync;
}

WriteWorker::~WriteWorker () {
  delete options;
}

void WriteWorker::Execute() {
  status = database->WriteToDatabase(options, key, value);
}

/** READ WORKER **/

ReadWorker::ReadWorker (Database* database, Persistent<Function> callback, string key) {
  request.data   = this;
  this->database = database;
  this->callback = callback;
  this->key      = key;
  options        = new ReadOptions();
}

ReadWorker::~ReadWorker () {
  delete options;
}

void ReadWorker::Execute () {
  status = database->ReadFromDatabase(options, key, value);
}

void ReadWorker::HandleOKCallback () {
  Local<Value> argv[] = {
      Local<Value>::New(Null())
    , Local<Value>::New(String::New(value.c_str()))
  };
  runCallback(callback, argv, 2);
}

/** DELETE WORKER **/

DeleteWorker::DeleteWorker (Database* database, Persistent<Function> callback, string key, bool sync) {
  request.data   = this;
  this->database = database;
  this->callback = callback;
  this->key      = key;
  options        = new WriteOptions();
  options->sync  = sync;
}

DeleteWorker::~DeleteWorker () {
  delete options;
}

void DeleteWorker::Execute() {
  status = database->DeleteFromDatabase(options, key);
}

/** BATCH WORKER **/

BatchWorker::BatchWorker  (Database* database, Persistent<Function> callback, vector<BatchOp*> operations, bool sync) {
  request.data     = this;
  this->database   = database;
  this->callback   = callback;
  this->operations = operations;
  options          = new WriteOptions();
  options->sync    = sync;
}

BatchWorker::~BatchWorker () {
  for (unsigned int i = 0; i < operations.size(); i++)
    delete operations[i];
  operations.clear();
}


void BatchWorker::Execute() {
  WriteBatch batch;
  for (unsigned int i = 0; i < operations.size(); i++)
    operations[i]->Execute(&batch);
  status = database->WriteBatchToDatabase(options, &batch);
}

/** UTIL **/

void runCallback (Persistent<Function> callback, Local<Value> argv[], int length) {
  TryCatch try_catch;
  callback->Call(Context::GetCurrent()->Global(), length, argv);
  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }
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
  uv_queue_work(uv_default_loop(), &worker->request, AsyncExecute, AsyncExecuteComplete);
}