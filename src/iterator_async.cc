/* Copyright (c) 2012 Rod Vagg <@rvagg> */

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

void NextWorker::Execute () {
  ok = iterator->IteratorNext(key, value);
  if (!ok)
    status = iterator->IteratorStatus();
}

void NextWorker::HandleOKCallback () {
  if (ok) {
    Local<Value> argv[] = {
        Local<Value>::New(Null())
      , Local<Value>::New(Buffer::New((char*)key.data(), key.size())->handle_)
      , Local<Value>::New(Buffer::New((char*)value.data(), value.size())->handle_)
    };
    RunCallback(callback, argv, 3);
  } else {
    Local<Value> argv[0];
    RunCallback(endCallback, argv, 0);
  }
}

void EndWorker::Execute () {
  iterator->IteratorEnd();
}
