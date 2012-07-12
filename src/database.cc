#include <cstdlib>
#include <vector>
#include <node.h>
#include <iostream>
#include <pthread.h>

#include "leveldb/db.h"

#include "levelup.h"
#include "database.h"
#include "async.h"
#include "batch.h"

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

Status Database::WriteToDatabase (WriteOptions* options, string key, string value) {
  return db->Put(*options, key, value);
}

Status Database::ReadFromDatabase (ReadOptions* options, string key, string& value) {
  return db->Get(*options, key, &value);
}

Status Database::DeleteFromDatabase (WriteOptions* options, string key) {
  return db->Delete(*options, key);
}

Status Database::WriteBatchToDatabase (WriteOptions* options, WriteBatch* batch) {
  return db->Write(*options, batch);
}

void Database::CloseDatabase () {
  delete db;
  db = NULL;
}

Persistent<Function> Database::constructor;

void Database::Init () {
  Local<FunctionTemplate> tpl = FunctionTemplate::New(New);
  tpl->SetClassName(String::NewSymbol("Database"));
  tpl->InstanceTemplate()->SetInternalFieldCount(5);
  tpl->PrototypeTemplate()->Set(String::NewSymbol("open")  , FunctionTemplate::New(Open)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("close") , FunctionTemplate::New(Close)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("put")   , FunctionTemplate::New(Write)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("get")   , FunctionTemplate::New(Read)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("del")   , FunctionTemplate::New(Delete)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("batch") , FunctionTemplate::New(Batch)->GetFunction());
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
  Persistent<Function> callback;
  if (args.Length() > 1)
    callback = Persistent<Function>::New(Local<Function>::Cast(args[2]));

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

Handle<Value> Database::Write (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  String::Utf8Value key(args[0]->ToString());
  String::Utf8Value value(args[1]->ToString());
  Persistent<Function> callback;
  if (args.Length() > 2)
    callback = Persistent<Function>::New(Local<Function>::Cast(args[args.Length() > 3 ? 3 : 2]));
  bool sync = false;
  if (args.Length() > 3) {
    Local<Object> optionsObj = Local<Object>::Cast(args[2]);
    sync = optionsObj->Has(option_sync) && optionsObj->Get(option_sync)->BooleanValue();
  }

  WriteWorker* worker  = new WriteWorker(
      database
    , callback
    , *key
    , *value
    , sync
  );
  AsyncQueueWorker(worker);

  return Undefined();
}

Handle<Value> Database::Read (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  String::Utf8Value key(args[0]->ToString());
  Persistent<Function> callback;
  if (args.Length() > 1)
    callback = Persistent<Function>::New(Local<Function>::Cast(args[args.Length() > 2 ? 2 : 1]));

  ReadWorker* worker = new ReadWorker(
      database
    , callback
    , *key
  );
  AsyncQueueWorker(worker);

  return Undefined();
}

Handle<Value> Database::Delete (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  String::Utf8Value key(args[0]->ToString());
  Persistent<Function> callback;
  if (args.Length() > 1)
    callback = Persistent<Function>::New(Local<Function>::Cast(args[args.Length() > 2 ? 2 : 1]));
  bool sync = false;
  if (args.Length() > 2) {
    Local<Object> optionsObj = Local<Object>::Cast(args[1]);
    sync = optionsObj->Has(option_sync) && optionsObj->Get(option_sync)->BooleanValue();
  }

  DeleteWorker* worker = new DeleteWorker(
      database
    , callback
    , *key
    , sync
  );
  AsyncQueueWorker(worker);

  return Undefined();
}

Handle<Value> Database::Batch (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  Local<Array> array = Local<Array>::Cast(args[0]);
  Persistent<Function> callback;
  if (args.Length() > 1)
    callback = Persistent<Function>::New(Local<Function>::Cast(args[args.Length() > 2 ? 2 : 1]));
  bool sync = false;
  if (args.Length() > 2) {
    Local<Object> optionsObj = Local<Object>::Cast(args[1]);
    sync = optionsObj->Has(option_sync) && optionsObj->Get(option_sync)->BooleanValue();
  }

  vector<BatchOp*> operations;
  for (unsigned int i = 0; i < array->Length(); i++) {
    Local<Object> obj = Local<Object>::Cast(array->Get(i));
    if (!obj->Has(str_type) || !obj->Has(str_key))
      continue;
    String::Utf8Value key(obj->Get(str_key)->ToString());
    if (obj->Get(str_type)->StrictEquals(str_del)) {
      operations.push_back(new BatchDelete(*key));
    } else if (obj->Get(str_type)->StrictEquals(str_put)) {
      if (obj->Has(str_value)) {
        String::Utf8Value value(obj->Get(str_value)->ToString());
        operations.push_back(new BatchWrite(*key, *value));
      }
    }
  }

  BatchWorker* worker = new BatchWorker(
      database
    , callback
    , operations
    , sync
  );
  AsyncQueueWorker(worker);

  return Undefined();
}

Handle<Value> CreateDatabase (const Arguments& args) {
  HandleScope scope;
  return scope.Close(Database::NewInstance(args));
}