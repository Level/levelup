/* Copyright (c) 2012 Rod Vagg <@rvagg> */

#ifndef LU_ITERATOR_H
#define LU_ITERATOR_H

#include <cstdlib>
#include <node.h>

#include "levelup.h"
#include "database.h"

using namespace std;
using namespace v8;
using namespace leveldb;

namespace levelup {

Handle<Value> CreateIterator (const Arguments& args);

class Iterator : public node::ObjectWrap {
public:
  static void Init      ();
  static v8::Handle<v8::Value> NewInstance (const v8::Arguments& args);

  bool   IteratorNext   (string& key, string& value);
  Status IteratorStatus ();
  void   IteratorEnd    ();

private:
  Iterator (
      Database*            database
    , Slice*               start
    , string*              end
    , bool                 reverse
    , bool                 keys
    , bool                 values
    , int                  limit
  ) : database(database)
    , start(start)
    , end(end)
    , reverse(reverse)
    , keys(keys)
    , values(values)
    , limit(limit)
  {
    options = new ReadOptions();
    dbIterator = NULL;
    count = 0;
  };

  ~Iterator () {
    delete options;
    if (start != NULL)
      delete start;
    if (end != NULL)
      delete end;
  };

  Database*            database;
  leveldb::Iterator*   dbIterator;
  ReadOptions*         options;
  Slice*               start;
  string*              end;
  bool                 reverse;
  bool                 keys;
  bool                 values;
  int                  limit;
  int                  count;

  bool GetIterator ();

  static v8::Persistent<v8::Function> constructor;

  LU_V8_METHOD( New  )
  LU_V8_METHOD( Next )
  LU_V8_METHOD( End  )
};

};

#endif
