/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#ifndef LU_DATABASE_H
#define LU_DATABASE_H

#include <node.h>

#include "leveldb/db.h"

#include "levelup.h"

namespace levelup {

LU_OPTION ( createIfMissing ); // for open()
LU_OPTION ( errorIfExists   ); // for open()
LU_OPTION ( compression     ); // for open()
LU_OPTION ( cacheSize       ); // for open() 
LU_OPTION ( sync            ); // for put() and delete()
LU_OPTION ( asBuffer        ); // for get()
LU_OPTION ( fillCache       ); // for get() and readStream()
LU_STR    ( key   );
LU_STR    ( value );
LU_STR    ( type  );
LU_STR    ( del   );
LU_STR    ( put   );

struct AsyncDescriptor;

v8::Handle<v8::Value> CreateDatabase (const v8::Arguments& args);

class Database : public node::ObjectWrap {
public:
  static void Init ();
  static v8::Handle<v8::Value> NewInstance (const v8::Arguments& args);

  leveldb::Status OpenDatabase (leveldb::Options* options, std::string location);
  leveldb::Status PutToDatabase (
      leveldb::WriteOptions* options
    , leveldb::Slice key
    , leveldb::Slice value
  );
  leveldb::Status GetFromDatabase (
      leveldb::ReadOptions* options
    , leveldb::Slice key
    , std::string& value
  );
  leveldb::Status DeleteFromDatabase (
      leveldb::WriteOptions* options
    , leveldb::Slice key
  );
  leveldb::Status WriteBatchToDatabase (
      leveldb::WriteOptions* options
    , leveldb::WriteBatch* batch
  );
  uint64_t ApproximateSizeFromDatabase (const leveldb::Range* range);
  leveldb::Iterator* NewIterator (leveldb::ReadOptions* options);
  const leveldb::Snapshot* NewSnapshot ();
  void ReleaseSnapshot (const leveldb::Snapshot* snapshot);
  void CloseDatabase ();

private:
  Database ();
  ~Database ();

  leveldb::DB* db;

  static v8::Persistent<v8::Function> constructor;

  LU_V8_METHOD( New      )
  LU_V8_METHOD( Open     )
  LU_V8_METHOD( Close    )
  LU_V8_METHOD( Put      )
  LU_V8_METHOD( Delete   )
  LU_V8_METHOD( Get      )
  LU_V8_METHOD( Batch    )
  LU_V8_METHOD( ApproximateSize)
};

} // namespace levelup

#endif
