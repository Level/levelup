/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#include <node.h>

#include "levelup.h"
#include "database.h"
#include "iterator.h"

void Init (v8::Handle<v8::Object> exports) {
  Database::Init();
  levelup::Iterator::Init();

  exports->Set(
      v8::String::NewSymbol("createDatabase")
    , v8::FunctionTemplate::New(CreateDatabase)->GetFunction()
  );
  exports->Set(
      v8::String::NewSymbol("createIterator")
    , v8::FunctionTemplate::New(levelup::CreateIterator)->GetFunction()
  );
}

NODE_MODULE(levelup, Init)

// util

void RunCallback (
      v8::Persistent<v8::Function> callback
    , v8::Local<v8::Value> argv[], int length
  ) {

  v8::TryCatch try_catch;
 
  callback->Call(v8::Context::GetCurrent()->Global(), length, argv);
  if (try_catch.HasCaught()) {
    node::FatalException(try_catch);
  }
}
