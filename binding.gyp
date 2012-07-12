{
    "Xtargets": [
        {
            "target_name": "hello"
          , "sources": [ "src/examples/hello.cc" ]
        }
      , {
            "target_name": "argex"
          , "sources": [ "src/examples/argex.cc" ]
        }
      , {
            "target_name": "cb"
          , "sources": [ "src/examples/cb.cc" ]
        }
      , {
            "target_name": "obj"
          , "sources": [ "src/examples/obj.cc" ]
        }
      , {
            "target_name": "fn"
          , "sources": [ "src/examples/fn.cc" ]
        }
      , {
            "target_name": "wrap"
          , "sources": [ "src/examples/wrap.cc", "src/examples/myobject.cc" ]
        }
      , {
            "target_name": "wrapcreate"
          , "sources": [ "src/examples/wrapcreate.cc", "src/examples/myobjectcreate.cc" ]
        }
      , {
            "target_name": "unwrap"
          , "sources": [ "src/examples/unwrap.cc", "src/examples/myobjectunwrap.cc" ]
        }
    ]

  , "good resource": "https://github.com/rbranson/node-ffi/blob/master/binding.gyp"

  , "targets": [
        {
            "target_name": "levelup"
          , "sources": [
                "src/levelup.cc"
              , "src/database.cc"
              , "src/async.cc"
            ]
          , "include_dirs": [
                "<(module_root_dir)/deps/leveldb-1.5.0/include/"
            ]
          , "conditions": [
                ["OS=='linux'", {
                    "libraries": [
                        "<(module_root_dir)/deps/leveldb-1.5.0/libleveldb.a"
                    ]
          , "cflags": ["-g"]
                }]
            ]
        }
    ]
}