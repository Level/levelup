#include <cstdlib>
#include <node.h>
#include <iostream>
#include <pthread.h>

#include "leveldb/db.h"

#include "levelup.h"
#include "database.h"
#include "database_async.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace leveldb;

LU_OPTION( createIfMissing );
LU_OPTION( errorIfExists   );

Handle<Value> CreateDatabase (const Arguments& args) {
  HandleScope scope;
  return scope.Close(Database::NewInstance(args));
}

void runCallback (Persistent<Function> callback, Local<Value> argv[], int length) {
  TryCatch try_catch;
  callback->Call(Context::GetCurrent()->Global(), length, argv);

  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }
}

// Database class

Database::Database () {};
Database::~Database () {};

Persistent<Function> Database::constructor;

void Database::Init () {
  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(New);
  tpl->SetClassName(String::NewSymbol("Database"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);
  // Prototype
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

  const unsigned argc = 0;
  Handle<Value> argv[0];
  Local<Object> instance = constructor->NewInstance(argc, argv);

  return scope.Close(instance);
}

/** OPEN (async) **/

Status Database::OpenDatabase(Options options, string location) {
  //cout << "open() in " << pthread_self() << endl;
  return DB::Open(options, location, &db);
}

Status Database::WriteToDatabase(Options options, string key, string value) {
  //cout << "write() in " << pthread_self() << endl;
  return db->Put(leveldb::WriteOptions(), key, value);
}

Status Database::ReadFromDatabase(Options options, string key, string* value) {
  //cout << "read() in " << pthread_self() << endl;
  return db->Get(leveldb::ReadOptions(), key, value);
}

void AsyncOpenComplete (uv_work_t* req) {
  HandleScope scope;
  AsyncBatonOpen* baton = static_cast<AsyncBatonOpen*>(req->data);

  if (baton->status.ok()) {
    Local<Value> argv[0];
    runCallback(baton->callback, argv, 0);
  } else {
    Local<Value> argv[] = {
        Local<Value>::New(Exception::Error(String::New(baton->status.ToString().c_str())))
    };
    runCallback(baton->callback, argv, 1);
  }

  baton->callback.Dispose();
  delete baton;
}

void AsyncWriteComplete (uv_work_t* req) {
  HandleScope scope;
  AsyncBatonWrite* baton = static_cast<AsyncBatonWrite*>(req->data);

  if (baton->status.ok()) {
    Local<Value> argv[0];
    runCallback(baton->callback, argv, 0);
  } else {
    Local<Value> argv[] = {
        Local<Value>::New(Exception::Error(String::New(baton->status.ToString().c_str())))
    };
    runCallback(baton->callback, argv, 1);
  }

  baton->callback.Dispose();
  delete baton;
}

void AsyncReadComplete (uv_work_t* req) {
  HandleScope scope;
  AsyncBatonRead* baton = static_cast<AsyncBatonRead*>(req->data);

  if (baton->status.ok()) {
    Local<Value> argv[] = {
        Local<Value>::New(Null())
      , Local<Value>::New(String::New(baton->value.c_str()))
    };
    runCallback(baton->callback, argv, 2);
  } else {
    Local<Value> argv[] = {
        Local<Value>::New(Exception::Error(String::New(baton->status.ToString().c_str())))
    };
    runCallback(baton->callback, argv, 1);
  }

  baton->callback.Dispose();
  delete baton;
}

Handle<Value> Database::Open (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  AsyncBatonOpen* baton = new AsyncBatonOpen();
  baton->request.data = baton;
  baton->database = database;

  String::Utf8Value location(args[0]->ToString());
  Local<Object> optionsObj = Local<Object>::Cast(args[1]);
  Local<Function> callback = Local<Function>::Cast(args[2]);

  baton->callback = Persistent<Function>::New(callback);

  baton->location = *location;

  if (optionsObj->Has(option_createIfMissing))
    baton->options.create_if_missing = optionsObj->Get(option_createIfMissing)->BooleanValue();

  if (optionsObj->Has(option_errorIfExists))
    baton->options.error_if_exists = optionsObj->Get(option_errorIfExists)->BooleanValue();

  uv_queue_work(uv_default_loop(), &baton->request, AsyncOpen, AsyncOpenComplete);

  return Undefined();
}

/** CLOSE **/

Handle<Value> Database::Close (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());

  delete database->db;
  database->db = NULL;

  return Undefined();
}

Handle<Value> Database::Write (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  AsyncBatonWrite* baton = new AsyncBatonWrite();
  baton->request.data = baton;
  baton->database = database;

  String::Utf8Value key(args[0]->ToString());
  String::Utf8Value value(args[1]->ToString());

  baton->key = *key;
  baton->value = *value;

/*  Local<Object> optionsObj = NULL;
  if (args.Length() > 3)
    optionsObj = Local<Object>::Cast(args[2]);
*/
  if (args.Length() > 2) {
    Local<Function> callback = Local<Function>::Cast(args[args.Length() > 3 ? 3 : 2]);
    baton->callback = Persistent<Function>::New(callback);
  }

  uv_queue_work(uv_default_loop(), &baton->request, AsyncWrite, AsyncWriteComplete);

  return Undefined();
}

Handle<Value> Database::Read (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args.This());
  AsyncBatonRead* baton = new AsyncBatonRead();
  baton->request.data = baton;
  baton->database = database;

  String::Utf8Value key(args[0]->ToString());

  baton->key = *key;

/*  Local<Object> optionsObj = NULL;
  if (args.Length() > 2)
    optionsObj = Local<Object>::Cast(args[1]);
*/
  if (args.Length() > 1) {
    Local<Function> callback = Local<Function>::Cast(args[args.Length() > 2 ? 2 : 1]);
    baton->callback = Persistent<Function>::New(callback);
  }

  uv_queue_work(uv_default_loop(), &baton->request, AsyncRead, AsyncReadComplete);

  return Undefined();
}