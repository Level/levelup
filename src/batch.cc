#include <cstdlib>
#include <iostream>

#include "leveldb/write_batch.h"

#include "batch.h"

using namespace std;

BatchDelete::~BatchDelete () {
  keyPtr.Dispose();
}

void BatchDelete::Execute (WriteBatch* batch) {
  batch->Delete(key);
}

BatchWrite::~BatchWrite () {
  keyPtr.Dispose();
  valuePtr.Dispose();
}

void BatchWrite::Execute (WriteBatch* batch) {
  batch->Put(key, value);
}