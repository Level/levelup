#include <cstdlib>
#include <iostream>

#include "leveldb/write_batch.h"

#include "batch.h"

using namespace std;

BatchDelete::BatchDelete (string key) {
  this->key   = key;
}

void BatchDelete::Execute (WriteBatch* batch) {
  batch->Delete(key);
}

BatchWrite::BatchWrite (string key, string value) : BatchDelete (key) {
  this->value = value;
}

void BatchWrite::Execute (WriteBatch* batch) {
  batch->Put(key, value);
}