/* Copyright (c) 2012-2013 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT +no-false-attribs License <https://github.com/rvagg/node-levelup/blob/master/LICENSE>
 */

#ifndef LU_ITERATOR_H
#define LU_ITERATOR_H

#include <node.h>

#include "levelup.h"
#include "database.h"
#include "async.h"

using namespace std;
using namespace v8;
using namespace leveldb;

namespace levelup {

LU_OPTION ( start         );
LU_OPTION ( end           );
LU_OPTION ( limit         );
LU_OPTION ( reverse       );
LU_OPTION ( keys          );
LU_OPTION ( values        );
LU_OPTION ( keyAsBuffer   );
LU_OPTION ( valueAsBuffer );
LU_OPTION ( fillCache     );

Handle<Value> CreateIterator (const Arguments& args);

class Iterator : public node::ObjectWrap {
public:
  static void Init ();
  static v8::Handle<v8::Value> NewInstance (const v8::Arguments& args);

  bool IteratorNext (string& key, string& value);
  Status IteratorStatus ();
  void IteratorEnd ();

  Iterator (
      Database* database
    , Slice* start
    , string* end
    , bool reverse
    , bool keys
    , bool values
    , int limit
    , bool fillCache
    , bool keyAsBuffer
    , bool valueAsBuffer
  ) : database(database)
    , start(start)
    , end(end)
    , reverse(reverse)
    , keys(keys)
    , values(values)
    , limit(limit)
    , keyAsBuffer(keyAsBuffer)
    , valueAsBuffer(valueAsBuffer)
  {
    options    = new ReadOptions();
    options->fill_cache = fillCache;
    dbIterator = NULL;
    count      = 0;
    nextCalls  = 0;
    ended      = false;
    endWorker  = NULL;
  };

  ~Iterator () {
    delete options;
    if (start != NULL)
      delete start;
    if (end != NULL)
      delete end;
  };

private:
  Database* database;
  leveldb::Iterator* dbIterator;
  ReadOptions* options;
  Slice* start;
  string* end;
  bool reverse;
  bool keys;
  bool values;
  int limit;
  int count;

public:
  bool keyAsBuffer;
  bool valueAsBuffer;
  int nextCalls;
  bool ended;
  AsyncWorker* endWorker;

private:
  bool GetIterator ();

  static v8::Persistent<v8::Function> constructor;

  LU_V8_METHOD( New  )
  LU_V8_METHOD( Next )
  LU_V8_METHOD( End  )
};

};

#endif
