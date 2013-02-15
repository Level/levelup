/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#include "leveldb/write_batch.h"

#include "batch.h"

namespace levelup {

BatchOp::~BatchOp () {}

BatchDelete::~BatchDelete () {
  keyPtr.Dispose();
}

void BatchDelete::Execute (leveldb::WriteBatch* batch) {
  batch->Delete(key);
}

BatchWrite::~BatchWrite () {
  keyPtr.Dispose();
  valuePtr.Dispose();
}

void BatchWrite::Execute (leveldb::WriteBatch* batch) {
  batch->Put(key, value);
}

} // namespace LevelUP
