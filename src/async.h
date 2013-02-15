/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#ifndef LU_ASYNC_H
#define LU_ASYNC_H

#include <node.h>

namespace levelup {

/* abstract */ class AsyncWorker {
public:
  AsyncWorker (
      Database* database
    , v8::Persistent<v8::Function> callback
  );

  virtual ~AsyncWorker ();
  uv_work_t request;
  virtual void WorkComplete ();
  virtual void Execute () =0;

protected:
  Database* database;
  v8::Persistent<v8::Function> callback;
  leveldb::Status status;
  virtual void HandleOKCallback ();
  virtual void HandleErrorCallback ();
};

void AsyncExecute (uv_work_t* req);
void AsyncExecuteComplete (uv_work_t* req);
void AsyncQueueWorker (AsyncWorker* worker);

} // namespace levelup

#endif
