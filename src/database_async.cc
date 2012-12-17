/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#include <cstdlib>
#include <node.h>
#include <node_buffer.h>
#include <iostream>
#include <pthread.h>

#include "database.h"

#include "levelup.h"
#include "async.h"
#include "database_async.h"
#include "batch.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace leveldb;

/** OPEN WORKER **/

OpenWorker::~OpenWorker () {
  delete options;
}

void OpenWorker::Execute () {
  status = database->OpenDatabase(options, location);
}

/** CLOSE WORKER **/

CloseWorker::~CloseWorker () {}

void CloseWorker::Execute () {
  database->CloseDatabase();
}

void CloseWorker::WorkComplete () {
  HandleScope scope;
  HandleOKCallback();
  callback.Dispose();
}

/** IO WORKER (abstract) **/

IOWorker::~IOWorker () {}

void IOWorker::WorkComplete () {
  AsyncWorker::WorkComplete();
  keyPtr.Dispose();
}

/** READ WORKER **/

ReadWorker::~ReadWorker () {
  delete options;
}

void ReadWorker::Execute () {
  status = database->GetFromDatabase(options, key, value);
}

void ReadWorker::HandleOKCallback () {
  Local<Value> returnValue;
  if (asBuffer)
    returnValue = Local<Value>::New(Buffer::New((char*)value.data(), value.size())->handle_);
  else
    returnValue = String::New((char*)value.data(), value.size());
  Local<Value> argv[] = {
      Local<Value>::New(Null())
    , returnValue
  };
  RunCallback(callback, argv, 2);
}

/** DELETE WORKER **/

DeleteWorker::~DeleteWorker () {
  delete options;
}

void DeleteWorker::Execute () {
  status = database->DeleteFromDatabase(options, key);
}

/** WRITE WORKER **/

void WriteWorker::Execute () {
  status = database->PutToDatabase(options, key, value);
}

void WriteWorker::WorkComplete () {
  IOWorker::WorkComplete();
  valuePtr.Dispose();
}

/** BATCH WORKER **/

BatchWorker::~BatchWorker () {
  for (vector<BatchOp*>::iterator it = operations->begin(); it != operations->end();) {
    delete *it;
    it = operations->erase(it);
  }
  delete operations;
  delete options;
}

void BatchWorker::Execute () {
  WriteBatch batch;
  for (vector<BatchOp*>::iterator it = operations->begin(); it != operations->end();) {
    (*it++)->Execute(&batch);
  }
  status = database->WriteBatchToDatabase(options, &batch);
}
