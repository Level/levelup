#include <cstdlib>
#include <node.h>
#include <iostream>
#include <pthread.h>

#include "leveldb/db.h"

#include "levelup.h"
#include "database.h"
#include "async.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace leveldb;

LU_OPTION ( createIfMissing ); // for open()
LU_OPTION ( errorIfExists   ); // for open()
LU_OPTION ( sync            ); // for write()

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

void Database::CloseDatabase () {
  delete db;
  db = NULL;
}

Persistent<Function> Database::constructor;

void Database::Init () {
  Local<FunctionTemplate> tpl = FunctionTemplate::New(New);
  tpl->SetClassName(String::NewSymbol("Database"));
  tpl->InstanceTemplate()->SetInternalFieldCount(4);
  tpl->PrototypeTemplate()->Set(String::NewSymbol("open"), FunctionTemplate::New(Open)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("close"), FunctionTemplate::New(Close)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("write"), FunctionTemplate::New(Write)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("read"), FunctionTemplate::New(Read)->GetFunction());
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
  if (args.Length() > 3) { // an options object
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

Handle<Value> CreateDatabase (const Arguments& args) {
  HandleScope scope;
  return scope.Close(Database::NewInstance(args));
}