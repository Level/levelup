/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#include <node.h>
#include <node_buffer.h>

#include "database.h"
#include "iterator.h"
#include "iterator_async.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace levelup;

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
      && (limit < 0 || ++count <= limit)
      && (end == NULL
          || (reverse && end->compare(dbIterator->key().ToString()) <= 0)
          || (!reverse && end->compare(dbIterator->key().ToString()) >= 0))) {

    if (keys)
      key.assign(dbIterator->key().data(), dbIterator->key().size());
    if (values)
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

void checkEndCallback (levelup::Iterator* iterator) {
  iterator->nexting = false;
  if (iterator->endWorker != NULL) {
    AsyncQueueWorker(iterator->endWorker);
    iterator->endWorker = NULL;
  }
}

//void *ctx, void (*callback)(void *ctx, Slice key, Slice value)
Handle<Value> levelup::Iterator::Next (const Arguments& args) {
  HandleScope scope;
  Iterator* iterator = ObjectWrap::Unwrap<Iterator>(args.This());

  if (iterator->ended) {
    THROW_RETURN("Cannot call next() after end()")
  }

  if (iterator->nexting) {
    THROW_RETURN("Cannot call next() before previous next() has completed")
  }

  Persistent<Function> endCallback = Persistent<Function>::New(Local<Function>::Cast(args[0]));
  Persistent<Function> dataCallback = Persistent<Function>::New(Local<Function>::Cast(args[1]));

  NextWorker* worker = new NextWorker(
      iterator
    , dataCallback
    , endCallback
    , checkEndCallback
  );
  iterator->nexting = true;
  AsyncQueueWorker(worker);
  return Undefined();
}

Handle<Value> levelup::Iterator::End (const Arguments& args) {
  HandleScope scope;
  Iterator* iterator = ObjectWrap::Unwrap<Iterator>(args.This());

  if (iterator->ended) {
    THROW_RETURN("end() already called on iterator")
  }

  Persistent<Function> endCallback = Persistent<Function>::New(Local<Function>::Cast(args[0]));
  EndWorker* worker = new EndWorker(
      iterator
    , endCallback
  );
  iterator->ended = true;
  if (iterator->nexting) {
    // waiting for a next() to return, queue the end
    iterator->endWorker = worker;
  } else {
    AsyncQueueWorker(worker);
  }
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
  if (args[1]->ToObject()->Has(option_start)
      && (Buffer::HasInstance(args[1]->ToObject()->Get(option_start)) || args[1]->ToObject()->Get(option_start)->IsString())) {
    Local<Value> startBuffer = Local<Value>::New(args[1]->ToObject()->Get(option_start));
    STRING_OR_BUFFER_TO_SLICE(_start, startBuffer)
    start = new Slice(_start.data(), _start.size());
  }
  string* end = NULL;
  if (args[1]->ToObject()->Has(option_end)
      && (Buffer::HasInstance(args[1]->ToObject()->Get(option_end)) || args[1]->ToObject()->Get(option_end)->IsString())) {
    Local<Value> endBuffer = Local<Value>::New(args[1]->ToObject()->Get(option_end));
    STRING_OR_BUFFER_TO_SLICE(_end, endBuffer)
    end = new string(_end.data(), _end.size());
  }
  Local<Object> optionsObj = Local<Object>::Cast(args[1]);
  BOOLEAN_OPTION_VALUE(optionsObj, reverse)
  BOOLEAN_OPTION_VALUE_DEFTRUE(optionsObj, keys)
  BOOLEAN_OPTION_VALUE_DEFTRUE(optionsObj, values)
  BOOLEAN_OPTION_VALUE_DEFTRUE(optionsObj, keyAsBuffer)
  BOOLEAN_OPTION_VALUE_DEFTRUE(optionsObj, valueAsBuffer)
  BOOLEAN_OPTION_VALUE(optionsObj, fillCache)
  int limit = -1;
  if (args[1]->ToObject()->Has(option_limit)) {
    limit = Local<Integer>::Cast(args[1]->ToObject()->Get(option_limit))->Value();
  }
  Iterator* iterator = new Iterator(database, start, end, reverse, keys, values, limit, fillCache, keyAsBuffer, valueAsBuffer);
  iterator->Wrap(args.This());

  return args.This();
}

Handle<Value> levelup::CreateIterator (const Arguments& args) {
  HandleScope scope;
  return scope.Close(levelup::Iterator::NewInstance(args));
}
