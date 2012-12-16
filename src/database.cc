/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#include <cstdlib>
#include <vector>
#include <node.h>
#include <node_buffer.h>
#include <iostream>
#include <pthread.h>

#include "leveldb/db.h"

#include "levelup.h"
#include "database.h"
#include "async.h"
#include "database_async.h"
#include "batch.h"
#include "iterator.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace leveldb;

LU_OPTION ( createIfMissing ); // for open()
LU_OPTION ( errorIfExists   ); // for open()
LU_OPTION ( compression     ); // for open()
LU_OPTION ( sync            ); // for put() and delete()
LU_OPTION ( asBuffer        ); // for get()
LU_STR    ( key   );
LU_STR    ( value );
LU_STR    ( type  );
LU_STR    ( del   );
LU_STR    ( put   );

Database::Database () {
  db = NULL;
};

Database::~Database () {
  if (db != NULL)
    delete db;
};

/* expect these to be called from worker threads, no v8 here */

Status Database::OpenDatabase (Options* options, string location) {
  return DB::Open(*options, location, &db);
}

Status Database::PutToDatabase (WriteOptions* options, Slice key, Slice value) {
  return db->Put(*options, key, value);
}

Status Database::GetFromDatabase (ReadOptions* options, Slice key, string& value) {
  return db->Get(*options, key, &value);
}

Status Database::DeleteFromDatabase (WriteOptions* options, Slice key) {
  return db->Delete(*options, key);
}

Status Database::WriteBatchToDatabase (WriteOptions* options, WriteBatch* batch) {
  return db->Write(*options, batch);
}

leveldb::Iterator* Database::NewIterator (ReadOptions* options) {
  return db->NewIterator(*options);
}

const leveldb::Snapshot* Database::NewSnapshot () {
  return db->GetSnapshot();
}

void Database::ReleaseSnapshot (const leveldb::Snapshot* snapshot) {
  return db->ReleaseSnapshot(snapshot);
}

void Database::CloseDatabase () {
  delete db;
  db = NULL;
}

Persistent<Function> Database::constructor;

void Database::Init () {
  Local<FunctionTemplate> tpl = FunctionTemplate::New(New);
  tpl->SetClassName(String::NewSymbol("Database"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);
  tpl->PrototypeTemplate()->Set(String::NewSymbol("open")     , FunctionTemplate::New(Open)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("close")    , FunctionTemplate::New(Close)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("put")      , FunctionTemplate::New(Put)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("get")      , FunctionTemplate::New(Get)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("del")      , FunctionTemplate::New(Delete)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("batch")    , FunctionTemplate::New(Batch)->GetFunction());
  constructor = Persistent<Function>::New(tpl->GetFunction());
}

Handle<Value> Database::New (const Arguments& args) {
  HandleScope scope;

  Database* obj = new Database();
  obj->Wrap(args.This());

  return args.This();
}

Handle<Value> Database::NewInstance (const Arguments& args) {
  HandleScope scope;

  Handle<Value> argv[0];
  Local<Object> instance = constructor->NewInstance(0, argv);

  return scope.Close(instance);
}

Handle<Value> Database::Open (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  String::Utf8Value location(args[0]->ToString());
  Local<Object> optionsObj = Local<Object>::Cast(args[1]);
  BOOLEAN_OPTION_VALUE(optionsObj, createIfMissing)
  BOOLEAN_OPTION_VALUE(optionsObj, errorIfExists)
  BOOLEAN_OPTION_VALUE(optionsObj, compression)
  Persistent<Function> callback = Persistent<Function>::New(Local<Function>::Cast(args[2]));

  OpenWorker* worker = new OpenWorker(
      database
    , callback
    , *location
    , createIfMissing
    , errorIfExists
    , compression
  );
  AsyncQueueWorker(worker);

  return Undefined();
}

Handle<Value> Database::Close (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  Persistent<Function> callback;
  if (args.Length() > 0)
    callback = Persistent<Function>::New(Local<Function>::Cast(args[0]));

  CloseWorker* worker = new CloseWorker(database, callback);
  AsyncQueueWorker(worker);

  return Undefined();
}

Handle<Value> Database::Put (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  Persistent<Function> callback = Persistent<Function>::New(Local<Function>::Cast(args[3]));

  CB_ERR_IF_NULL_OR_UNDEFINED(0, "Key")
  CB_ERR_IF_NOT_BUFFER_OR_STRING(0, "Key")
  CB_ERR_IF_NULL_OR_UNDEFINED(1, "Value")
  CB_ERR_IF_NOT_BUFFER_OR_STRING(1, "Value")

  Persistent<Value> keyBuffer = Persistent<Value>::New(args[0]);
  STRING_OR_BUFFER_TO_SLICE(key, keyBuffer)
  Persistent<Value> valueBuffer = Persistent<Value>::New(args[1]);
  STRING_OR_BUFFER_TO_SLICE(value, valueBuffer)
  Local<Object> optionsObj = Local<Object>::Cast(args[2]);
  BOOLEAN_OPTION_VALUE(optionsObj, sync)

  WriteWorker* worker  = new WriteWorker(
      database
    , callback
    , key
    , value
    , sync
    , keyBuffer
    , valueBuffer
  );
  AsyncQueueWorker(worker);

  return Undefined();
}

Handle<Value> Database::Get (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  Persistent<Function> callback = Persistent<Function>::New(Local<Function>::Cast(args[2]));

  CB_ERR_IF_NULL_OR_UNDEFINED(0, "Key")
  CB_ERR_IF_NOT_BUFFER_OR_STRING(0, "Key")

  Persistent<Value> keyBuffer = Persistent<Value>::New(args[0]);
  STRING_OR_BUFFER_TO_SLICE(key, keyBuffer)
  Local<Object> optionsObj = Local<Object>::Cast(args[1]);
  BOOLEAN_OPTION_VALUE_DEFTRUE(optionsObj, asBuffer)

  ReadWorker* worker = new ReadWorker(
      database
    , callback
    , key
    , asBuffer
    , keyBuffer
  );
  AsyncQueueWorker(worker);

  return Undefined();
}

Handle<Value> Database::Delete (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  Persistent<Function> callback = Persistent<Function>::New(Local<Function>::Cast(args[2]));

  CB_ERR_IF_NULL_OR_UNDEFINED(0, "Key")
  CB_ERR_IF_NOT_BUFFER_OR_STRING(0, "Key")

  Persistent<Value> keyBuffer = Persistent<Value>::New(args[0]);
  STRING_OR_BUFFER_TO_SLICE(key, keyBuffer)
  Local<Object> optionsObj = Local<Object>::Cast(args[1]);
  BOOLEAN_OPTION_VALUE(optionsObj, sync)

  DeleteWorker* worker = new DeleteWorker(
      database
    , callback
    , key
    , sync
    , keyBuffer
  );
  AsyncQueueWorker(worker);

  return Undefined();
}

Handle<Value> Database::Batch (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  Local<Array> array = Local<Array>::Cast(args[0]);
  Local<Object> optionsObj = Local<Object>::Cast(args[1]);
  BOOLEAN_OPTION_VALUE(optionsObj, sync)
  Persistent<Function> callback = Persistent<Function>::New(Local<Function>::Cast(args[2]));

  vector<BatchOp*>* operations = new vector<BatchOp*>;
  for (unsigned int i = 0; i < array->Length(); i++) {
    if (!array->Get(i)->IsObject())
      continue;

    Local<Object> obj = Local<Object>::Cast(array->Get(i));
    if (!obj->Has(str_type) && !obj->Has(str_key))
      continue;

    Local<Value> keyBuffer = obj->Get(str_key);
    if (!keyBuffer->IsString() && !Buffer::HasInstance(keyBuffer))
      continue;
    STRING_OR_BUFFER_TO_SLICE(key, keyBuffer)

    if (obj->Get(str_type)->StrictEquals(str_del)) {
      operations->push_back(new BatchDelete(key, Persistent<Value>::New(keyBuffer)));
    } else if (obj->Get(str_type)->StrictEquals(str_put) && obj->Has(str_value)) {
      if (!obj->Has(str_value))
        continue;
      Local<Value> valueBuffer = obj->Get(str_value);
      if (!valueBuffer->IsString() && !Buffer::HasInstance(valueBuffer))
        continue;
      STRING_OR_BUFFER_TO_SLICE(value, valueBuffer)
      operations->push_back(new BatchWrite(key, value, Persistent<Value>::New(keyBuffer), Persistent<Value>::New(valueBuffer)));
    }
  }

  AsyncQueueWorker(new BatchWorker(
      database
    , callback
    , operations
    , sync
  ));

  return Undefined();
}

Handle<Value> CreateDatabase (const Arguments& args) {
  HandleScope scope;
  return scope.Close(Database::NewInstance(args));
}
