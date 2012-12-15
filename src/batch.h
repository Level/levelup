/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#ifndef LU_BATCH_H
#define LU_BATCH_H

#include <cstdlib>

#include "database.h"
#include "leveldb/write_batch.h"

class BatchOp {
public:
  BatchOp () {};
  virtual ~BatchOp ();
  virtual void Execute (WriteBatch* batch) =0;
};

class BatchDelete : public BatchOp {
public:
  BatchDelete (
      Slice key
    , Persistent<Value> keyPtr
  ) : key(key)
    , keyPtr(keyPtr)
  {};
  ~BatchDelete ();
  void Execute (WriteBatch* batch);

private:
  Slice key;
  Persistent<Value> keyPtr;
};

class BatchWrite : public BatchOp {
public:
  BatchWrite (
      Slice key
    , Slice value
    , Persistent<Value> keyPtr
    , Persistent<Value> valuePtr
  ) : key(key)
    , keyPtr(keyPtr)
    , value(value)
    , valuePtr(valuePtr)
  {};
  ~BatchWrite ();
  void Execute (WriteBatch* batch);

private:
  Slice key;
  Persistent<Value> keyPtr;
  Slice value;
  Persistent<Value> valuePtr;
};

#endif
