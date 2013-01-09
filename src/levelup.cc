/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#include <node.h>

#include "levelup.h"
#include "database.h"
#include "iterator.h"

using namespace v8;
using namespace node;
using namespace levelup;

void Init (Handle<Object> target) {
  Database::Init();
  levelup::Iterator::Init();

  target->Set(String::NewSymbol("createDatabase"), FunctionTemplate::New(CreateDatabase)->GetFunction());
  target->Set(String::NewSymbol("createIterator"), FunctionTemplate::New(CreateIterator)->GetFunction());
}

NODE_MODULE(levelup, Init)

// util

void RunCallback (Persistent<Function> callback, Local<Value> argv[], int length) {
  TryCatch try_catch;
 
  callback->Call(Context::GetCurrent()->Global(), length, argv);
  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }
}
