#ifndef LU_LEVELUP_H
#define LU_LEVELUP_H

#define LU_STR(key) \
  static Persistent<String> str_ ## key = Persistent<String>::New(String::New(#key));

#define LU_OPTION(key) \
  static Persistent<String> option_ ## key = Persistent<String>::New(String::New(#key));

const char* ToCString(const v8::String::Utf8Value& value);
const char* ToCString(const v8::String::AsciiValue& value);

#endif