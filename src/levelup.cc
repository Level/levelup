#include <node.h>

#include "levelup.h"
#include "database.h"

using namespace v8;

void Init (Handle<Object> target) {
  Database::Init();

  target->Set(String::NewSymbol("createDatabase"), FunctionTemplate::New(CreateDatabase)->GetFunction());
}

NODE_MODULE(levelup, Init)

// util

// Extracts a C string from a V8 Utf8Value.
const char* ToCString(const v8::String::Utf8Value& value) {
  return *value ? *value : "<string conversion failed>";
}