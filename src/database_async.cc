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

namespace levelup {

/** OPEN WORKER **/

OpenWorker::OpenWorker (
    Database* database
  , v8::Persistent<v8::Function> callback
  , std::string location
  , bool createIfMissing
  , bool errorIfExists
  , bool compression
  , uint32_t cacheSize
) : AsyncWorker(database, callback)
  , location(location)
{
  options = new leveldb::Options();
  options->create_if_missing = createIfMissing;
  options->error_if_exists = errorIfExists;
  options->compression = compression
    ? leveldb::kSnappyCompression
    : leveldb::kNoCompression;
  options->block_cache = leveldb::NewLRUCache(cacheSize);
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
  , v8::Persistent<v8::Function> callback
) : AsyncWorker(database, callback)
{};

CloseWorker::~CloseWorker () {}

void CloseWorker::Execute () {
  database->CloseDatabase();
}

void CloseWorker::WorkComplete () {
  v8::HandleScope scope;
  HandleOKCallback();
  callback.Dispose();
}

/** IO WORKER (abstract) **/

IOWorker::IOWorker (
    Database* database
  , v8::Persistent<v8::Function> callback
  , leveldb::Slice key
  , v8::Persistent<v8::Value> keyPtr
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
  , v8::Persistent<v8::Function> callback
  , leveldb::Slice key
  , bool asBuffer
  , bool fillCache
  , v8::Persistent<v8::Value> keyPtr
) : IOWorker(database, callback, key, keyPtr)
  , asBuffer(asBuffer)
{
  options = new leveldb::ReadOptions();
  options->fill_cache = fillCache;
};

ReadWorker::~ReadWorker () {
  delete options;
}

void ReadWorker::Execute () {
  status = database->GetFromDatabase(options, key, value);
}

void ReadWorker::HandleOKCallback () {
  v8::Local<v8::Value> returnValue;
  if (asBuffer)
    returnValue = v8::Local<v8::Value>::New(
      node::Buffer::New((char*)value.data(), value.size())->handle_
    );
  else
    returnValue = v8::String::New((char*)value.data(), value.size());
  v8::Local<v8::Value> argv[] = {
      v8::Local<v8::Value>::New(v8::Null())
    , returnValue
  };
  RUN_CALLBACK(callback, argv, 2);
}

/** DELETE WORKER **/

DeleteWorker::DeleteWorker (
    Database* database
  , v8::Persistent<v8::Function> callback
  , leveldb::Slice key
  , bool sync
  , v8::Persistent<v8::Value> keyPtr
) : IOWorker(database, callback, key, keyPtr)
{
  options = new leveldb::WriteOptions();
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
  , v8::Persistent<v8::Function> callback
  , leveldb::Slice key
  , leveldb::Slice value
  , bool sync
  , v8::Persistent<v8::Value> keyPtr
  , v8::Persistent<v8::Value> valuePtr
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
  , v8::Persistent<v8::Function> callback
  , std::vector<BatchOp*>* operations
  , bool sync
) : AsyncWorker(database, callback)
  , operations(operations)
{
  options = new leveldb::WriteOptions();
  options->sync = sync;
};

BatchWorker::~BatchWorker () {
  for (std::vector<BatchOp*>::iterator it = operations->begin(); it != operations->end();) {
    delete *it;
    it = operations->erase(it);
  }
  delete operations;
  delete options;
}

void BatchWorker::Execute () {
  leveldb::WriteBatch batch;
  for (std::vector<BatchOp*>::iterator it = operations->begin(); it != operations->end();) {
    (*it++)->Execute(&batch);
  }
  status = database->WriteBatchToDatabase(options, &batch);
}

/** APPROXIMATE SIZE WORKER **/

ApproximateSizeWorker::ApproximateSizeWorker (
    Database* database
  , v8::Persistent<v8::Function> callback
  , leveldb::Slice start
  , leveldb::Slice end
  , v8::Persistent<v8::Value> startPtr
  , v8::Persistent<v8::Value> endPtr
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
  v8::Local<v8::Value> returnValue = v8::Number::New((double) size);
  v8::Local<v8::Value> argv[] = {
      v8::Local<v8::Value>::New(v8::Null())
    , returnValue
  };
  RUN_CALLBACK(callback, argv, 2);
}

} // namespleveldb::ace LevelUP
