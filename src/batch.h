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
      string* key
  ) : key(key)
  {};
  ~BatchDelete ();
  virtual void Execute (WriteBatch* batch);

protected:
  string* key;
};

class BatchWrite : public BatchDelete {
public:
  BatchWrite (
      string* key
    , string* value
  ) : BatchDelete(key)
    , value(value)
  {};
  ~BatchWrite ();
  virtual void Execute (WriteBatch* batch);

private:
  string* value;
};

#endif