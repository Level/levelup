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
    , string* keyPtr
  ) : key(key)
    , keyPtr(keyPtr)
  {};
  ~BatchDelete ();
  virtual void Execute (WriteBatch* batch);

protected:
  Slice key;
  string* keyPtr;
};

class BatchWrite : public BatchDelete {
public:
  BatchWrite (
      Slice key
    , string* keyPtr
    , Slice value
    , string* valuePtr
  ) : BatchDelete(key, keyPtr)
    , value(value)
    , valuePtr(valuePtr)
  {};
  ~BatchWrite ();
  virtual void Execute (WriteBatch* batch);

private:
  Slice value;
  string* valuePtr;
};

#endif