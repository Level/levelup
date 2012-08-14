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
LU_OPTION ( sync            ); // for write() and delete()
LU_STR    ( key );
LU_STR    ( value );
LU_STR    ( type );
LU_STR    ( del );
LU_STR    ( put );

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

void Database::CloseDatabase () {
  delete db;
  db = NULL;
}

Persistent<Function> Database::constructor;

void Database::Init () {
  Local<FunctionTemplate> tpl = FunctionTemplate::New(New);
  tpl->SetClassName(String::NewSymbol("Database"));
  tpl->InstanceTemplate()->SetInternalFieldCount(7);
  tpl->PrototypeTemplate()->Set(String::NewSymbol("open")     , FunctionTemplate::New(Open)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("close")    , FunctionTemplate::New(Close)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("put")      , FunctionTemplate::New(Put)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("get")      , FunctionTemplate::New(Get)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("del")      , FunctionTemplate::New(Delete)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("batch")    , FunctionTemplate::New(Batch)->GetFunction());
//  tpl->PrototypeTemplate()->Set(String::NewSymbol("iterator") , FunctionTemplate::New(Iterator)->GetFunction());
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
  Persistent<Function> callback = Persistent<Function>::New(Local<Function>::Cast(args[2]));

  OpenWorker* worker = new OpenWorker(
      database
    , callback
    , *location
    , optionsObj->Has(option_createIfMissing) && optionsObj->Get(option_createIfMissing)->BooleanValue()
    , optionsObj->Has(option_errorIfExists)   && optionsObj->Get(option_errorIfExists)->BooleanValue()
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

  Persistent<Object> keyBuffer = Persistent<Object>::New(args[0]->ToObject());
  Slice key(Buffer::Data(keyBuffer), Buffer::Length(keyBuffer));
  Persistent<Object> valueBuffer = Persistent<Object>::New(args[1]->ToObject());
  Slice value(Buffer::Data(valueBuffer), Buffer::Length(valueBuffer));
  Local<Object> optionsObj = Local<Object>::Cast(args[2]);
  bool sync = optionsObj->Has(option_sync) && optionsObj->Get(option_sync)->BooleanValue();
  Persistent<Function> callback = Persistent<Function>::New(Local<Function>::Cast(args[3]));

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
  Persistent<Object> keyBuffer = Persistent<Object>::New(args[0]->ToObject());
  Slice key(Buffer::Data(keyBuffer), Buffer::Length(keyBuffer));
  //Local<Object> optionsObj = Local<Object>::Cast(args[1]);
  Persistent<Function> callback = Persistent<Function>::New(Local<Function>::Cast(args[2]));

  ReadWorker* worker = new ReadWorker(
      database
    , callback
    , key
    , keyBuffer
  );
  AsyncQueueWorker(worker);

  return Undefined();
}

Handle<Value> Database::Delete (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  Persistent<Object> keyBuffer = Persistent<Object>::New(args[0]->ToObject());
  Slice key(Buffer::Data(keyBuffer), Buffer::Length(keyBuffer));
  Local<Object> optionsObj = Local<Object>::Cast(args[1]);
  bool sync = optionsObj->Has(option_sync) && optionsObj->Get(option_sync)->BooleanValue();
  Persistent<Function> callback = Persistent<Function>::New(Local<Function>::Cast(args[2]));

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
  bool sync = optionsObj->Has(option_sync) && optionsObj->Get(option_sync)->BooleanValue();
  Persistent<Function> callback = Persistent<Function>::New(Local<Function>::Cast(args[2]));

  vector<BatchOp*> operations;
  for (unsigned int i = 0; i < array->Length(); i++) {
    Local<Object> obj = Local<Object>::Cast(array->Get(i));
    if (!obj->Has(str_type) || !obj->Has(str_key))
      continue;

    Local<Object> keyBuffer = obj->Get(str_key)->ToObject();
    if (!keyBuffer->IsObject() || !Buffer::HasInstance(keyBuffer))
      continue;
    Slice key(Buffer::Data(keyBuffer), Buffer::Length(keyBuffer));

    if (obj->Get(str_type)->StrictEquals(str_del)) {
      operations.push_back(new BatchDelete(key, Persistent<Object>::New(keyBuffer)));
    } else if (obj->Get(str_type)->StrictEquals(str_put) && obj->Has(str_value)) {
      Local<Object> valueBuffer = obj->Get(str_value)->ToObject();
      if (!valueBuffer->IsObject() || !Buffer::HasInstance(valueBuffer))
        continue;
      Slice value(Buffer::Data(valueBuffer), Buffer::Length(valueBuffer));
      operations.push_back(new BatchWrite(key, value, Persistent<Object>::New(keyBuffer), Persistent<Object>::New(valueBuffer)));
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

/*
Handle<Value> Database::Iterator (const Arguments& args) {
  HandleScope scope;

  cout << "Database::Iterator" << endl;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  Persistent<Function> dataCallback = Persistent<Function>::New(Local<Function>::Cast(args[0]));
  Persistent<Function> callback = Persistent<Function>::New(Local<Function>::Cast(args[1]));

  cout << "Database::Iterator making worker" << endl;

  levelup::Iterator iterator = new Iterator(
      this
    , callback
    , dataCallback
    , NULL
    , NULL
  );
*/
/*
  IteratorWorker* worker = new IteratorWorker(
      database
    , callback
    , dataCallback
    , NULL
    , NULL
  );

  cout << "Queueing iterator worker..." << endl;

  AsyncQueueWorker(worker);
*/
/*  
  return Undefined();
}
*/

Handle<Value> CreateDatabase (const Arguments& args) {
  HandleScope scope;
  return scope.Close(Database::NewInstance(args));
}
