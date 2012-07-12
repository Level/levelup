#ifndef LU_DATABASE_H
#define LU_DATABASE_H

#include <cstdlib>
#include <node.h>

#include "leveldb/db.h"

#define LU_V8_METHOD(name) \
  static v8::Handle<v8::Value> name (const v8::Arguments& args);

using namespace std;
using namespace v8;
using namespace leveldb;

struct AsyncDescriptor;

Handle<Value> CreateDatabase (const Arguments& args);

class Database : public node::ObjectWrap {
 public:
  static void Init ();
  static v8::Handle<v8::Value> NewInstance (const v8::Arguments& args);

  Status OpenDatabase         (Options* options, string location);
  Status WriteToDatabase      (WriteOptions* options, string key, string value);
  Status ReadFromDatabase     (ReadOptions* options, string key, string& value);
  Status DeleteFromDatabase   (WriteOptions* options, string key);
  Status WriteBatchToDatabase (WriteOptions* options, WriteBatch* batch);
  void   CloseDatabase      ();

 private:
  Database ();
  ~Database ();

  DB* db;

  static v8::Persistent<v8::Function> constructor;

  LU_V8_METHOD( New    )
  LU_V8_METHOD( Open   )
  LU_V8_METHOD( Close  )
  LU_V8_METHOD( Write  )
  LU_V8_METHOD( Delete )
  LU_V8_METHOD( Read   )
  LU_V8_METHOD( Batch  )
};

#endif