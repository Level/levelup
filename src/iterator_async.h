/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#ifndef LU_ITERATOR_ASYNC_H
#define LU_ITERATOR_ASYNC_H

#include <node.h>

#include "async.h"
#include "iterator.h"

namespace levelup {

class NextWorker : public AsyncWorker {
public:
  NextWorker (
      levelup::Iterator* iterator
    , v8::Persistent<v8::Function> dataCallback
    , v8::Persistent<v8::Function> endCallback
    , void (*localCallback)(levelup::Iterator*)
  );

  virtual ~NextWorker ();
  virtual void Execute ();
  virtual void HandleOKCallback ();

private:
  levelup::Iterator* iterator;
  v8::Persistent<v8::Function> endCallback;
  void (*localCallback)(levelup::Iterator*);
  std::string key;
  std::string value;
  bool ok;
};

class EndWorker : public AsyncWorker {
public:
  EndWorker (
      levelup::Iterator* iterator
    , v8::Persistent<v8::Function> endCallback
  );

  virtual ~EndWorker ();
  virtual void Execute ();

private:
  levelup::Iterator* iterator;
};

} // namespace levelup

#endif
