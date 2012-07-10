#include <node.h>

#include "database_async.h"

using namespace node;

void AsyncOpen (uv_work_t* req) {
  AsyncBatonOpen* baton = static_cast<AsyncBatonOpen*>(req->data);
  baton->status = baton->database->OpenDatabase(baton->options, baton->location);
}

void AsyncWrite (uv_work_t* req) {
  AsyncBatonWrite* baton = static_cast<AsyncBatonWrite*>(req->data);
  baton->status = baton->database->WriteToDatabase(baton->options, baton->key, baton->value);
}

void AsyncRead (uv_work_t* req) {
  AsyncBatonRead* baton = static_cast<AsyncBatonRead*>(req->data);
  baton->status = baton->database->ReadFromDatabase(baton->options, baton->key, &baton->value);
}