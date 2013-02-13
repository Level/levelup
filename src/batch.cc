/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#include "leveldb/write_batch.h"

#include "batch.h"

using namespace std;

BatchOp::~BatchOp () {}

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
