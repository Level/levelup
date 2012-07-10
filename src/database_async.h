#ifndef LU_DATABASE_ASYNC_H
#define LU_DATABASE_ASYNC_H

#include <cstdlib>
#include <node.h>
#include <v8.h>

#include "leveldb/db.h"

#include "database.h"

using namespace node;
using namespace v8;
using namespace std;
using namespace leveldb;

struct AsyncBatonOpen {
    uv_work_t            request;
    Database*            database;
    // in
    string               location;
    Options              options;
    Persistent<Function> callback;
    // out
    Status               status;
};

void AsyncOpen (uv_work_t* req);

struct AsyncBatonWrite {
    uv_work_t            request;
    Database*            database;
    // in
    string               key;
    string               value;
    Options              options;
    Persistent<Function> callback;
    // out
    Status               status;
};

void AsyncWrite (uv_work_t* req);

struct AsyncBatonRead {
    uv_work_t            request;
    Database*            database;
    // in
    string               key;
    Options              options;
    Persistent<Function> callback;
    // out
    Status               status;
    string               value;
};

void AsyncRead (uv_work_t* req);

#endif