#include <cstdlib>
#include <iostream>

#include "leveldb/write_batch.h"

#include "batch.h"

using namespace std;

BatchDelete::~BatchDelete () {
  delete key;
}

void BatchDelete::Execute (WriteBatch* batch) {
  batch->Delete(Slice(*key));
}

BatchWrite::~BatchWrite () {
  delete key;
  delete value;
}

void BatchWrite::Execute (WriteBatch* batch) {
  batch->Put(Slice(*key), Slice(*value));
}