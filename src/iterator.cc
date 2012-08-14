/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#include <cstdlib>
#include <node.h>
#include <node_buffer.h>
#include <iostream>
#include <pthread.h>

#include "database.h"
#include "iterator.h"
#include "iterator_async.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace levelup;

/*
void dataCallbackProxy (void* ctx, Slice key, Slice value) {
  IteratorWorker* worker = static_cast<IteratorWorker*>(ctx);
  worker->DataCallback(key, value);
}
*/

bool levelup::Iterator::GetIterator () {
  if (dbIterator == NULL) {
    dbIterator = database->NewIterator(options);
    if (start != NULL)
      dbIterator->Seek(*start);
    else
      dbIterator->SeekToFirst();
    return true;
  }
  return false;
}

bool levelup::Iterator::IteratorNext (string& key, string& value) {
  if (!GetIterator()) dbIterator->Next();
  if (dbIterator->Valid()) { // && (end == NULL || dbIterator->key().data() < end->data())) {
    key.assign(dbIterator->key().data(), dbIterator->key().size());
    value.assign(dbIterator->value().data(), dbIterator->value().size());
    return true;
  } else {
    return false;
  }
}

Status levelup::Iterator::IteratorStatus () {
  return dbIterator->status();
}

void levelup::Iterator::IteratorEnd () {
  //TODO: could return it->status()
  delete dbIterator;
  dbIterator = NULL;
}

//void *ctx, void (*callback)(void *ctx, Slice key, Slice value)
Handle<Value> levelup::Iterator::Next (const Arguments& args) {
  HandleScope scope;
  Iterator* iterator = ObjectWrap::Unwrap<Iterator>(args.This());
  Persistent<Function> endCallback = Persistent<Function>::New(Local<Function>::Cast(args[0]));
  Persistent<Function> dataCallback = Persistent<Function>::New(Local<Function>::Cast(args[1]));
  NextWorker* worker = new NextWorker(
      iterator
    , dataCallback
    , endCallback
  );
  AsyncQueueWorker(worker);
  return Undefined();
}

Handle<Value> levelup::Iterator::End (const Arguments& args) {
  HandleScope scope;
  Iterator* iterator = ObjectWrap::Unwrap<Iterator>(args.This());
  Persistent<Function> endCallback = Persistent<Function>::New(Local<Function>::Cast(args[0]));
  EndWorker* worker = new EndWorker(
      iterator
    , endCallback
  );
  AsyncQueueWorker(worker);
  return Undefined();
}

Persistent<Function> levelup::Iterator::constructor;

void levelup::Iterator::Init () {
  Local<FunctionTemplate> tpl = FunctionTemplate::New(New);
  tpl->SetClassName(String::NewSymbol("Iterator"));
  tpl->InstanceTemplate()->SetInternalFieldCount(2);
  tpl->PrototypeTemplate()->Set(String::NewSymbol("next") , FunctionTemplate::New(Next)->GetFunction());
  tpl->PrototypeTemplate()->Set(String::NewSymbol("end")  , FunctionTemplate::New(End)->GetFunction());
  constructor = Persistent<Function>::New(tpl->GetFunction());
}

Handle<Value> levelup::Iterator::NewInstance (const Arguments& args) {
  HandleScope scope;

  Handle<Value> argv[1] = {
      args[0]->ToObject()
  };
  Local<Object> instance = constructor->NewInstance(1, argv);

  return scope.Close(instance);
}

Handle<Value> levelup::Iterator::New (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args[0]->ToObject());
  Iterator* iterator = new Iterator(database, NULL, NULL);
  iterator->Wrap(args.This());

  return args.This();
}

Handle<Value> levelup::CreateIterator (const Arguments& args) {
  HandleScope scope;
  return scope.Close(levelup::Iterator::NewInstance(args));
}
