/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#include <node.h>
#include <node_buffer.h>

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

OpenWorker::OpenWorker (
    Database* database
  , Persistent<Function> callback
  , string location
  , bool createIfMissing
  , bool errorIfExists
  , bool compression
  , uint32_t cacheSize
) : AsyncWorker(database, callback)
  , location(location)
{
  options = new Options();
  options->create_if_missing = createIfMissing;
  options->error_if_exists = errorIfExists;
  options->compression = compression ? kSnappyCompression : kNoCompression;
  options->block_cache = NewLRUCache(cacheSize);
};

OpenWorker::~OpenWorker () {
  delete options;
}

void OpenWorker::Execute () {
  status = database->OpenDatabase(options, location);
}

/** CLOSE WORKER **/

CloseWorker::CloseWorker (
    Database* database
  , Persistent<Function> callback
) : AsyncWorker(database, callback)
{};

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

IOWorker::IOWorker (
    Database* database
  , Persistent<Function> callback
  , Slice key
  , Persistent<Value> keyPtr
) : AsyncWorker(database, callback)
  , key(key)
  , keyPtr(keyPtr)
{};

IOWorker::~IOWorker () {}

void IOWorker::WorkComplete () {
  AsyncWorker::WorkComplete();
  keyPtr.Dispose();
}

/** READ WORKER **/

ReadWorker::ReadWorker (
    Database* database
  , Persistent<Function> callback
  , Slice key
  , bool asBuffer
  , bool fillCache
  , Persistent<Value> keyPtr
) : IOWorker(database, callback, key, keyPtr)
  , asBuffer(asBuffer)
{
  options = new ReadOptions();
  options->fill_cache = fillCache;
};

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

DeleteWorker::DeleteWorker (
    Database* database
  , Persistent<Function> callback
  , Slice key
  , bool sync
  , Persistent<Value> keyPtr
) : IOWorker(database, callback, key, keyPtr)
{
  options = new WriteOptions();
  options->sync = sync;
};

DeleteWorker::~DeleteWorker () {
  delete options;
}

void DeleteWorker::Execute () {
  status = database->DeleteFromDatabase(options, key);
}

/** WRITE WORKER **/

WriteWorker::WriteWorker (
    Database* database
  , Persistent<Function> callback
  , Slice key
  , Slice value
  , bool sync
  , Persistent<Value> keyPtr
  , Persistent<Value> valuePtr
) : DeleteWorker(database, callback, key, sync, keyPtr)
  , value(value)
  , valuePtr(valuePtr)
{};

WriteWorker::~WriteWorker () {}

void WriteWorker::Execute () {
  status = database->PutToDatabase(options, key, value);
}

void WriteWorker::WorkComplete () {
  IOWorker::WorkComplete();
  valuePtr.Dispose();
}

/** BATCH WORKER **/

BatchWorker::BatchWorker (
    Database* database
  , Persistent<Function> callback
  , vector<BatchOp*>* operations
  , bool sync
) : AsyncWorker(database, callback)
  , operations(operations)
{
  options = new WriteOptions();
  options->sync = sync;
};

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

/** APPROXIMATE SIZE WORKER **/

ApproximateSizeWorker::ApproximateSizeWorker (
    Database* database
  , Persistent<Function> callback
  , Slice start
  , Slice end
  , Persistent<Value> startPtr
  , Persistent<Value> endPtr
) : AsyncWorker(database, callback)
  , range(start, end)
  , startPtr(startPtr)
  , endPtr(endPtr)
{};

ApproximateSizeWorker::~ApproximateSizeWorker () {}

void ApproximateSizeWorker::Execute () {
  size = database->ApproximateSizeFromDatabase(&range);
}

void ApproximateSizeWorker::WorkComplete() {
  AsyncWorker::WorkComplete();
  startPtr.Dispose();
  endPtr.Dispose();
}

void ApproximateSizeWorker::HandleOKCallback () {
  Local<Value> returnValue = Number::New((double) size);
  Local<Value> argv[] = {
      Local<Value>::New(Null())
    , returnValue
  };
  RunCallback(callback, argv, 2);
}

