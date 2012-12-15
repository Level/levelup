/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#ifndef LU_LEVELUP_H
#define LU_LEVELUP_H

#define LU_STR(key) \
  static Persistent<String> str_ ## key = Persistent<String>::New(String::New(#key));

#define LU_OPTION(key) \
  static Persistent<String> option_ ## key = Persistent<String>::New(String::New(#key));

#define LU_V8_METHOD(name) \
  static v8::Handle<v8::Value> name (const v8::Arguments& args);

#define CB_ERR_IF_NULL_OR_UNDEFINED(index, name) \
  if (args[index]->IsNull() || args[index]->IsUndefined()) { \
    Local<Value> argv[] = { \
      Local<Value>::New(Exception::Error(String::New("#name cannot be `null` or `undefined`"))) \
    }; \
    RunCallback(callback, argv, 1); \
    return Undefined(); \
  }

#define CB_ERR_IF_NOT_BUFFER_OR_STRING(index, name) \
  if (!args[index]->IsString() && !Buffer::HasInstance(args[index])) { \
    Local<Value> argv[] = { \
      Local<Value>::New(Exception::Error(String::New("name must be a Buffer or a String"))) \
    }; \
    RunCallback(callback, argv, 1); \
    return Undefined(); \
  }

#define STRING_OR_BUFFER_TO_SLICE(to, from) \
  size_t to ## Sz_; \
  char* to ## Ch_; \
  if (from->IsString()) { \
    to ## Sz_ = from->ToString()->Utf8Length(); \
    to ## Ch_ = new char[to ## Sz_]; \
    from->ToString()->WriteUtf8(to ## Ch_, -1, NULL, String::NO_NULL_TERMINATION); \
  } else { \
    assert(Buffer::HasInstance(from->ToObject())); \
    to ## Sz_ = Buffer::Length(from->ToObject()); \
    to ## Ch_ = Buffer::Data(from->ToObject()); \
  } \
  Slice to(to ## Ch_, to ## Sz_);

const char* ToCString(const v8::String::Utf8Value& value);
const char* ToCString(const v8::String::AsciiValue& value);

void RunCallback (v8::Persistent<v8::Function> callback, v8::Local<v8::Value> argv[], int length);

#endif
