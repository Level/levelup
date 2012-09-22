/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#include <cstdlib>
#include <node.h>
#include <node_buffer.h>
#include <iostream>
#include <pthread.h>

#include "database.h"

#include "async.h"
#include "database_async.h"
#include "batch.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace leveldb;

/** OPEN WORKER **/

void OpenWorker::Execute () {
  status = database->OpenDatabase(options, location);
}

/** CLOSE WORKER **/

void CloseWorker::Execute () {
  database->CloseDatabase();
}

void CloseWorker::WorkComplete () {
  HandleScope scope;
  HandleOKCallback();
  callback.Dispose();
}

/** IO WORKER (abstract) **/

void IOWorker::WorkComplete () {
  AsyncWorker::WorkComplete();
  keyPtr.Dispose();
}

/** WRITE WORKER **/

WriteWorker::~WriteWorker () {
  delete options;
}

void WriteWorker::Execute () {
  status = database->PutToDatabase(options, key, value);
}

void WriteWorker::WorkComplete () {
  IOWorker::WorkComplete();
  valuePtr.Dispose();
}

/** READ WORKER **/

ReadWorker::~ReadWorker () {
  delete options;
}

void ReadWorker::Execute () {
  status = database->GetFromDatabase(options, key, value);
}

void ReadWorker::HandleOKCallback () {
  Local<Value> argv[] = {
      Local<Value>::New(Null())
    , Local<Value>::New(Buffer::New((char*)value.data(), value.size())->handle_)
  };
  runCallback(callback, argv, 2);
}

/** DELETE WORKER **/

DeleteWorker::~DeleteWorker () {
  delete options;
}

void DeleteWorker::Execute () {
  status = database->DeleteFromDatabase(options, key);
}

/** BATCH WORKER **/

BatchWorker::~BatchWorker () {
  for (unsigned int i = 0; i < operations.size(); i++)
    delete operations[i];
  operations.clear();
}

void BatchWorker::Execute () {
  WriteBatch batch;
  for (unsigned int i = 0; i < operations.size(); i++)
    operations[i]->Execute(&batch);
  status = database->WriteBatchToDatabase(options, &batch);
}
