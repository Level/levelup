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

LU_OPTION ( start );
LU_OPTION ( end );
LU_OPTION ( reverse );

bool levelup::Iterator::GetIterator () {
  if (dbIterator == NULL) {
    dbIterator = database->NewIterator(options);
    if (start != NULL)
      dbIterator->Seek(*start);
    else if (reverse)
      dbIterator->SeekToLast();
    else
      dbIterator->SeekToFirst();
    return true;
  }
  return false;
}

bool levelup::Iterator::IteratorNext (string& key, string& value) {
  if (!GetIterator()) {
    if (reverse)
      dbIterator->Prev();
    else
      dbIterator->Next();
  }

  // 'end' here is an inclusive test
  if (dbIterator->Valid()
      && (end == NULL
          || (reverse && end->compare(dbIterator->key().ToString()) <= 0)
          || (!reverse && end->compare(dbIterator->key().ToString()) >= 0))) {
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

  Handle<Value> argv[2] = {
      args[0]->ToObject()
    , args[1]->ToObject()
  };
  Local<Object> instance = constructor->NewInstance(2, argv);

  return scope.Close(instance);
}

Handle<Value> levelup::Iterator::New (const Arguments& args) {
  HandleScope scope;

  Database* database = ObjectWrap::Unwrap<Database>(args[0]->ToObject());
  Slice* start = NULL;
  if (args[1]->ToObject()->Has(option_start)) {
    Local<Object> startBuffer = Local<Object>::New(args[1]->ToObject()->Get(option_start)->ToObject());
    start = new Slice(Buffer::Data(startBuffer), Buffer::Length(startBuffer));
  }
  string* end = NULL;
  if (args[1]->ToObject()->Has(option_end)) {
    Local<Object> endBuffer = Local<Object>::New(args[1]->ToObject()->Get(option_end)->ToObject());
    end = new string(Buffer::Data(endBuffer), Buffer::Length(endBuffer));
  }
  bool reverse = false;
  if (args[1]->ToObject()->Has(option_reverse)) {
    reverse = args[1]->ToObject()->Get(option_reverse)->BooleanValue();
  }
  Iterator* iterator = new Iterator(database, start, end, reverse);
  iterator->Wrap(args.This());

  return args.This();
}

Handle<Value> levelup::CreateIterator (const Arguments& args) {
  HandleScope scope;
  return scope.Close(levelup::Iterator::NewInstance(args));
}
