#ifndef LU_ITERATOR_ASYNC_H
#define LU_ITERATOR_ASYNC_H

#include <cstdlib>
#include <vector>
#include <node.h>
#include "async.h"
#include "iterator.h"

using namespace std;
using namespace v8;
using namespace leveldb;

class NextWorker  : public AsyncWorker {
public:
  NextWorker (
      levelup::Iterator*   iterator
    , Persistent<Function> dataCallback
    , Persistent<Function> endCallback
  ) : AsyncWorker(database, dataCallback)
    , iterator(iterator)
    , endCallback(endCallback)
  { };

  ~NextWorker () {};

  virtual void         Execute ();

protected:
  virtual void         HandleOKCallback ();

private:
  levelup::Iterator*   iterator;
  Persistent<Function> endCallback;
  string               key;
  string               value;
  bool                 ok;
};

class EndWorker  : public AsyncWorker {
public:
  EndWorker (
      levelup::Iterator* iterator
    , Persistent<Function> endCallback
  ) : AsyncWorker(database, endCallback)
    , iterator(iterator)
  {};

  ~EndWorker () {};

  virtual void         Execute ();

private:
  levelup::Iterator*   iterator;
};

#endif