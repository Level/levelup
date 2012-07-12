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
  BatchDelete (string key);
  virtual void Execute (WriteBatch* batch);

protected:
  string key;
};

class BatchWrite : public BatchDelete {
public:
  BatchWrite (string key, string value);
  virtual void Execute (WriteBatch* batch);

private:
  string value;
};

#endif