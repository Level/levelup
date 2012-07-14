#include <cstdlib>
#include <iostream>

#include "leveldb/write_batch.h"

#include "batch.h"

using namespace std;

BatchDelete::~BatchDelete () {
  if (keyPtr != NULL)
    delete keyPtr;
}

void BatchDelete::Execute (WriteBatch* batch) {
  batch->Delete(key);
}

BatchWrite::~BatchWrite () {
  if (keyPtr != NULL)
    delete keyPtr;
  if (valuePtr != NULL)
    delete valuePtr;
}

void BatchWrite::Execute (WriteBatch* batch) {
  batch->Put(key, value);
}