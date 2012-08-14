/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#ifndef LU_BATCH_H
#define LU_BATCH_H

#include <cstdlib>

#include "database.h"
#include "leveldb/write_batch.h"

class BatchOp {
public:
  BatchOp () {};
  virtual void Execute (WriteBatch* batch);
};

class BatchDelete : public BatchOp {
public:
  BatchDelete (
      Slice key
    , Persistent<Object> keyPtr
  ) : key(key)
    , keyPtr(keyPtr)
  {};
  ~BatchDelete ();

  virtual void Execute (WriteBatch* batch);

protected:
  Slice key;
  Persistent<Object> keyPtr;
};

class BatchWrite : public BatchDelete {
public:
  BatchWrite (
      Slice key
    , Slice value
    , Persistent<Object> keyPtr
    , Persistent<Object> valuePtr
  ) : BatchDelete(key, keyPtr)
    , value(value)
    , valuePtr(valuePtr)
  {};
  ~BatchWrite ();

  virtual void Execute (WriteBatch* batch);

private:
  Slice value;
  Persistent<Object> valuePtr;
};

#endif