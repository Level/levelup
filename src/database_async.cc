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
/*
IteratorWorker::~IteratorWorker () {
  delete options;
}

struct IteratorCallbackChunk {
 Persistent<Function> callback;
 Buffer* key;
 Buffer* value;
 uv_async_t async;
};

void dataCallbackProxy (void* ctx, Slice key, Slice value) {
  IteratorWorker* worker = static_cast<IteratorWorker*>(ctx);
  worker->DataCallback(key, value);
}

void handleDataCallback(uv_async_t *handle, int status) {
cout<<"handleDataCallback..." << endl;
 IteratorCallbackChunk *chunk = static_cast<IteratorCallbackChunk*>(handle->data);
 uv_close((uv_handle_t*) &chunk->async, NULL); // necessary otherwise UV will block
 */
 /*
 baton->callback->Call(v8::Context::GetCurrent()->Global(), 1, argv); // call the JS callback method as usual
 baton->callback.Dispose(); // delete the baton
 baton->data.Dispose();
 */
/* delete chunk;
}

 */
/*
void IteratorWorker::DataCallback (Slice key, Slice value) {
  cout << "IT cb: " << key.ToString() << " = "  << value.ToString() << endl;

  IteratorCallbackChunk* work = new IteratorCallbackChunk();
  work->async.data = work;
  work->callback = dataCallback;
  work->key = Buffer::New((char*)key.data(), key.size());
  work->value = Buffer::New((char*)value.data(), value.size());
cout<<"uv_async_send..." << endl;
  uv_async_init(uv_default_loop(), &work->async, handleDataCallback); // tell UV to call After_cb() async
  uv_async_send(&work->async);
}

void IteratorWorker::Execute () {
//Status Database::Iterator (ReadOptions* options, Slice start, Slice end, void (*callback)(Slice key, Slice value)) {

cout<< "IT execute" << endl;
  status = database->Iterator(options, start, end, this, &dataCallbackProxy);
}
*/
