/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#ifndef LU_LEVELUP_H
#define LU_LEVELUP_H

#define LU_STR(key) \
  static v8::Persistent<v8::String> str_ ## key = \
    v8::Persistent<v8::String>::New(v8::String::New(#key));

#define LU_OPTION(key) \
  static v8::Persistent<v8::String> option_ ## key = \
    v8::Persistent<v8::String>::New(v8::String::New(#key));

#define LU_V8_METHOD(name) \
  static v8::Handle<v8::Value> name (const v8::Arguments& args);

#define THROW_RETURN(msg) \
  v8::ThrowException(v8::Exception::Error(v8::String::New(#msg))); \
  return v8::Undefined();

#define RUN_CALLBACK(callback, argv, length) \
  v8::TryCatch try_catch; \
  callback->Call(v8::Context::GetCurrent()->Global(), length, argv); \
  if (try_catch.HasCaught()) { \
    node::FatalException(try_catch); \
  }

#define CB_ERR_IF_NULL_OR_UNDEFINED(index, name) \
  if (args[index]->IsNull() || args[index]->IsUndefined()) { \
    v8::Local<v8::Value> argv[] = { \
      v8::Local<v8::Value>::New(v8::Exception::Error( \
        v8::String::New("#name cannot be `null` or `undefined`"))) \
    }; \
    RUN_CALLBACK(callback, argv, 1); \
    return v8::Undefined(); \
  }

#define STRING_OR_BUFFER_TO_SLICE(to, from) \
  size_t to ## Sz_; \
  char* to ## Ch_; \
  if (node::Buffer::HasInstance(from->ToObject())) { \
    to ## Sz_ = node::Buffer::Length(from->ToObject()); \
    to ## Ch_ = node::Buffer::Data(from->ToObject()); \
  } else { \
    v8::Local<v8::String> to ## Str = from->ToString(); \
    to ## Sz_ = to ## Str->Utf8Length(); \
    to ## Ch_ = new char[to ## Sz_]; \
    to ## Str->WriteUtf8(to ## Ch_, -1, NULL, v8::String::NO_NULL_TERMINATION); \
  } \
  leveldb::Slice to(to ## Ch_, to ## Sz_);

#define BOOLEAN_OPTION_VALUE(optionsObj, opt) \
  bool opt = optionsObj->Has(option_ ## opt) && \
    optionsObj->Get(option_ ## opt)->BooleanValue();
#define BOOLEAN_OPTION_VALUE_DEFTRUE(optionsObj, opt) \
  bool opt = !optionsObj->Has(option_ ## opt) || \
    optionsObj->Get(option_ ## opt)->BooleanValue();
#define UINT32_OPTION_VALUE(optionsObj, opt, default) \
  uint32_t opt = optionsObj->Has(option_ ## opt) \
    && optionsObj->Get(option_ ## opt)->IsUint32() \
      ? optionsObj->Get(option_ ## opt)->Uint32Value() \
      : default;

#endif
