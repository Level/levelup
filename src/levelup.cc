/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#include <node.h>

#include "levelup.h"
#include "database.h"
#include "iterator.h"

namespace levelup {

void Init (v8::Handle<v8::Object> exports) {
  Database::Init();
  Iterator::Init();

  exports->Set(
      v8::String::NewSymbol("createDatabase")
    , v8::FunctionTemplate::New(CreateDatabase)->GetFunction()
  );
  exports->Set(
      v8::String::NewSymbol("createIterator")
    , v8::FunctionTemplate::New(CreateIterator)->GetFunction()
  );
}

NODE_MODULE(levelup, Init)

// util

} // namespace levelup
