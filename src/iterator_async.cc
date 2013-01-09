/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#include <cstdlib>
#include <node.h>
#include <node_buffer.h>
#include <iostream>
#include <pthread.h>

#include "database.h"

#include "levelup.h"
#include "async.h"
#include "iterator_async.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace leveldb;

NextWorker::~NextWorker () {}

void NextWorker::Execute () {
  ok = iterator->IteratorNext(key, value);
  if (!ok)
    status = iterator->IteratorStatus();
}

void NextWorker::HandleOKCallback () {
  Local<Value> returnKey;
  if (iterator->keyAsBuffer)
    returnKey = Local<Value>::New(Buffer::New((char*)key.data(), key.size())->handle_);
  else
    returnKey = String::New((char*)key.data(), key.size());
  Local<Value> returnValue;
  if (iterator->valueAsBuffer)
    returnValue = Local<Value>::New(Buffer::New((char*)value.data(), value.size())->handle_);
  else
    returnValue = String::New((char*)value.data(), value.size());
  if (ok) {
    Local<Value> argv[] = {
        Local<Value>::New(Null())
      , returnKey
      , returnValue
    };
    RunCallback(callback, argv, 3);
  } else {
    Local<Value> argv[0];
    RunCallback(endCallback, argv, 0);
  }
}

EndWorker::~EndWorker () {}

void EndWorker::Execute () {
  iterator->IteratorEnd();
}
