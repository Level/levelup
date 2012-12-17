/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#ifndef LU_DATABASE_H
#define LU_DATABASE_H

#include <cstdlib>
#include <node.h>

#include "leveldb/db.h"

#include "levelup.h"

using namespace std;
using namespace v8;
using namespace leveldb;

LU_OPTION ( createIfMissing ); // for open()
LU_OPTION ( errorIfExists   ); // for open()
LU_OPTION ( compression     ); // for open()
LU_OPTION ( sync            ); // for put() and delete()
LU_OPTION ( asBuffer        ); // for get()
LU_STR    ( key   );
LU_STR    ( value );
LU_STR    ( type  );
LU_STR    ( del   );
LU_STR    ( put   );

struct AsyncDescriptor;

Handle<Value> CreateDatabase (const Arguments& args);

class Database : public node::ObjectWrap {
public:
  static void Init ();
  static v8::Handle<v8::Value> NewInstance (const v8::Arguments& args);

  Status OpenDatabase (Options* options, string location);
  Status PutToDatabase (WriteOptions* options, Slice key, Slice value);
  Status GetFromDatabase (ReadOptions* options, Slice key, string& value);
  Status DeleteFromDatabase (WriteOptions* options, Slice key);
  Status WriteBatchToDatabase (WriteOptions* options, WriteBatch* batch);
  leveldb::Iterator* NewIterator (ReadOptions* options);
  const leveldb::Snapshot* NewSnapshot ();
  void ReleaseSnapshot (const leveldb::Snapshot* snapshot);
  void CloseDatabase ();

private:
  Database ();
  ~Database ();

  DB* db;

  static v8::Persistent<v8::Function> constructor;

  LU_V8_METHOD( New      )
  LU_V8_METHOD( Open     )
  LU_V8_METHOD( Close    )
  LU_V8_METHOD( Put      )
  LU_V8_METHOD( Delete   )
  LU_V8_METHOD( Get      )
  LU_V8_METHOD( Batch    )
};

#endif
