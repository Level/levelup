/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#ifndef LU_BATCH_H
#define LU_BATCH_H

#include "leveldb/write_batch.h"

#include "database.h"

namespace levelup {

class BatchOp {
public:
  BatchOp () {};
  virtual ~BatchOp ();
  virtual void Execute (leveldb::WriteBatch* batch) =0;
};

class BatchDelete : public BatchOp {
public:
  BatchDelete (
      leveldb::Slice key
    , v8::Persistent<v8::Value> keyPtr
  ) : key(key)
    , keyPtr(keyPtr)
  {};
  ~BatchDelete ();
  void Execute (leveldb::WriteBatch* batch);

private:
  leveldb::Slice key;
  v8::Persistent<v8::Value> keyPtr;
};

class BatchWrite : public BatchOp {
public:
  BatchWrite (
      leveldb::Slice key
    , leveldb::Slice value
    , v8::Persistent<v8::Value> keyPtr
    , v8::Persistent<v8::Value> valuePtr
  ) : key(key)
    , keyPtr(keyPtr)
    , value(value)
    , valuePtr(valuePtr)
  {};
  ~BatchWrite ();
  void Execute (leveldb::WriteBatch* batch);

private:
  leveldb::Slice key;
  v8::Persistent<v8::Value> keyPtr;
  leveldb::Slice value;
  v8::Persistent<v8::Value> valuePtr;
};

} // namespace levelup

#endif
