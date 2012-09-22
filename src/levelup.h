/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#ifndef LU_LEVELUP_H
#define LU_LEVELUP_H

#define LU_STR(key) \
  static Persistent<String> str_ ## key = Persistent<String>::New(String::New(#key));

#define LU_OPTION(key) \
  static Persistent<String> option_ ## key = Persistent<String>::New(String::New(#key));

#define LU_V8_METHOD(name) \
  static v8::Handle<v8::Value> name (const v8::Arguments& args);

const char* ToCString(const v8::String::Utf8Value& value);
const char* ToCString(const v8::String::AsciiValue& value);

void RunCallback (v8::Persistent<v8::Function> callback, v8::Local<v8::Value> argv[], int length);

#endif
