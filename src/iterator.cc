/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#include <node.h>
#include <node_buffer.h>

#include "database.h"
#include "iterator.h"
#include "iterator_async.h"

namespace levelup {

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

bool levelup::Iterator::IteratorNext (std::string& key, std::string& value) {
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

leveldb::Status levelup::Iterator::IteratorStatus () {
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
v8::Handle<v8::Value> levelup::Iterator::Next (const v8::Arguments& args) {
  v8::HandleScope scope;
  Iterator* iterator = node::ObjectWrap::Unwrap<Iterator>(args.This());

  if (iterator->ended) {
    THROW_RETURN("Cannot call next() after end()")
  }

  if (iterator->nexting) {
    THROW_RETURN("Cannot call next() before previous next() has completed")
  }

  v8::Persistent<v8::Function> endCallback =
      v8::Persistent<v8::Function>::New(Local<v8::Function>::Cast(args[0]));
  v8::Persistent<v8::Function> dataCallback =
      v8::Persistent<v8::Function>::New(Local<v8::Function>::Cast(args[1]));

  NextWorker* worker = new NextWorker(
      iterator
    , dataCallback
    , endCallback
    , checkEndCallback
  );
  iterator->nexting = true;
  AsyncQueueWorker(worker);
  return v8::Undefined();
}

v8::Handle<v8::Value> levelup::Iterator::End (const v8::Arguments& args) {
  v8::HandleScope scope;
  Iterator* iterator = node::ObjectWrap::Unwrap<Iterator>(args.This());

  if (iterator->ended) {
    THROW_RETURN("end() already called on iterator")
  }

  v8::Persistent<v8::Function> callback =
      v8::Persistent<v8::Function>::New(Local<v8::Function>::Cast(args[0]));
  EndWorker* worker = new EndWorker(
      iterator
    , callback
  );
  iterator->ended = true;
  if (iterator->nexting) {
    // waiting for a next() to return, queue the end
    iterator->endWorker = worker;
  } else {
    AsyncQueueWorker(worker);
  }
  return v8::Undefined();
}

v8::Persistent<v8::Function> levelup::Iterator::constructor;

void levelup::Iterator::Init () {
  Local<v8::FunctionTemplate> tpl = v8::FunctionTemplate::New(New);
  tpl->SetClassName(String::NewSymbol("Iterator"));
  tpl->InstanceTemplate()->SetInternalFieldCount(2);
  tpl->PrototypeTemplate()->Set(
      String::NewSymbol("next")
    , v8::FunctionTemplate::New(Next)->GetFunction()
  );
  tpl->PrototypeTemplate()->Set(
      String::NewSymbol("end")
    , v8::FunctionTemplate::New(End)->GetFunction()
  );
  constructor = v8::Persistent<v8::Function>::New(tpl->GetFunction());
}

v8::Handle<v8::Value> levelup::Iterator::NewInstance (const v8::Arguments& args) {
  v8::HandleScope scope;

  v8::Handle<v8::Value> argv[2] = {
      args[0]->ToObject()
    , args[1]->ToObject()
  };
  Local<Object> instance = constructor->NewInstance(2, argv);

  return scope.Close(instance);
}

v8::Handle<v8::Value> levelup::Iterator::New (const v8::Arguments& args) {
  v8::HandleScope scope;

  Database* database = node::ObjectWrap::Unwrap<Database>(args[0]->ToObject());
  Slice* start = NULL;
  if (args[1]->ToObject()->Has(option_start)
      && (node::Buffer::HasInstance(args[1]->ToObject()->Get(option_start))
        || args[1]->ToObject()->Get(option_start)->IsString())) {
    Local<Value> startBuffer =
      Local<Value>::New(args[1]->ToObject()->Get(option_start));
    STRING_OR_BUFFER_TO_SLICE(_start, startBuffer)
    start = new Slice(_start.data(), _start.size());
  }
  std::string* end = NULL;
  if (args[1]->ToObject()->Has(option_end)
      && (node::Buffer::HasInstance(args[1]->ToObject()->Get(option_end))
        || args[1]->ToObject()->Get(option_end)->IsString())) {
    Local<Value> endBuffer =
      Local<Value>::New(args[1]->ToObject()->Get(option_end));
    STRING_OR_BUFFER_TO_SLICE(_end, endBuffer)
    end = new std::string(_end.data(), _end.size());
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
  Iterator* iterator = new Iterator(
      database
    , start
    , end
    , reverse
    , keys
    , values
    , limit
    , fillCache
    , keyAsBuffer
    , valueAsBuffer
  );
  iterator->Wrap(args.This());

  return args.This();
}

v8::Handle<v8::Value> CreateIterator (const v8::Arguments& args) {
  v8::HandleScope scope;
  return scope.Close(levelup::Iterator::NewInstance(args));
}

} // namespace LevelUP
