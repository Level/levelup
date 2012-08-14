/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#include <node.h>

#include "levelup.h"
#include "database.h"
#include "iterator.h"

using namespace v8;
using namespace levelup;

void Init (Handle<Object> target) {
  Database::Init();
  levelup::Iterator::Init();

  target->Set(String::NewSymbol("createDatabase"), FunctionTemplate::New(CreateDatabase)->GetFunction());
  target->Set(String::NewSymbol("createIterator"), FunctionTemplate::New(CreateIterator)->GetFunction());
}

NODE_MODULE(levelup, Init)

// util

// Extracts a C string from a V8 Utf8Value.
const char* ToCString(const v8::String::Utf8Value& value) {
  return *value ? *value : "<string conversion failed>";
}
const char* ToCString(const v8::String::AsciiValue& value) {
  return *value ? *value : "<string conversion failed>";
}
