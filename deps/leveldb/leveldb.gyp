{'targets': [{
    'target_name': 'leveldb'
  , 'variables': {
        'ldbversion': '1.7.0'
    }
  , 'type': 'static_library'
  , 'dependencies': [
        '../snappy/snappy.gyp:snappy'
    ]
  , 'direct_dependent_settings': {
        'include_dirs': [
            'leveldb-<(ldbversion)/include/'
          , 'leveldb-<(ldbversion)/'
        ]
    }
  , 'defines': [
        'SNAPPY=1'
    ]
  , 'include_dirs': [
        'leveldb-<(ldbversion)/'
      , 'leveldb-<(ldbversion)/include/'
    ]
  , 'conditions': [
        ['OS == "win"', {
            'include_dirs': [
                'leveldb-<(ldbversion)/port/win'
            ]
        }]
      , ['OS == "linux"', {
            'defines': [
                'OS_LINUX=1'
              , 'LEVELDB_PLATFORM_POSIX=1'
            ]
          , 'libraries': [
                '-lpthread'
            ]
          , 'ccflags': [
                '-fno-builtin-memcmp'
              , '-pthread'
              , '-fPIC'
            ]
          , 'cflags': [
                '-Wno-sign-compare'
              , '-Wno-unused-but-set-variable'
            ]
        }]
      , ['OS == "solaris"', {
            'defines': [
                'OS_SOLARIS=1'
              , 'LEVELDB_PLATFORM_POSIX=1'
            ]
          , 'libraries': [
                '-lrt'
              , '-lpthread'
            ]
          , 'ccflags': [
                '-fno-builtin-memcmp'
              , '-pthread'
              , '-fPIC'
            ]
        }]
      , ['OS == "mac"', {
            'defines': [
                'OS_MACOSX=1'
              , 'LEVELDB_PLATFORM_POSIX=1'
            ]
          , 'libraries': []
          , 'ccflags': [
                '-fno-builtin-memcmp'
              , '-fPIC'
            ]
        }]
    ]
  , 'sources': [
        'leveldb-<(ldbversion)/db/builder.cc'
      , 'leveldb-<(ldbversion)/db/builder.h'
      , 'leveldb-<(ldbversion)/db/db_impl.cc'
      , 'leveldb-<(ldbversion)/db/db_impl.h'
      , 'leveldb-<(ldbversion)/db/db_iter.cc'
      , 'leveldb-<(ldbversion)/db/db_iter.h'
      , 'leveldb-<(ldbversion)/db/filename.cc'
      , 'leveldb-<(ldbversion)/db/filename.h'
      , 'leveldb-<(ldbversion)/db/dbformat.cc'
      , 'leveldb-<(ldbversion)/db/dbformat.h'
      , 'leveldb-<(ldbversion)/db/log_format.h'
      , 'leveldb-<(ldbversion)/db/log_reader.cc'
      , 'leveldb-<(ldbversion)/db/log_reader.h'
      , 'leveldb-<(ldbversion)/db/log_writer.cc'
      , 'leveldb-<(ldbversion)/db/log_writer.h'
      , 'leveldb-<(ldbversion)/db/memtable.cc'
      , 'leveldb-<(ldbversion)/db/memtable.h'
      , 'leveldb-<(ldbversion)/db/repair.cc'
      , 'leveldb-<(ldbversion)/db/skiplist.h'
      , 'leveldb-<(ldbversion)/db/snapshot.h'
      , 'leveldb-<(ldbversion)/db/table_cache.cc'
      , 'leveldb-<(ldbversion)/db/table_cache.h'
      , 'leveldb-<(ldbversion)/db/version_edit.cc'
      , 'leveldb-<(ldbversion)/db/version_edit.h'
      , 'leveldb-<(ldbversion)/db/version_set.cc'
      , 'leveldb-<(ldbversion)/db/version_set.h'
      , 'leveldb-<(ldbversion)/db/write_batch.cc'
      , 'leveldb-<(ldbversion)/db/write_batch_internal.h'
      , 'leveldb-<(ldbversion)/helpers/memenv/memenv.cc'
      , 'leveldb-<(ldbversion)/helpers/memenv/memenv.h'
      , 'leveldb-<(ldbversion)/include/leveldb/cache.h'
      , 'leveldb-<(ldbversion)/include/leveldb/comparator.h'
      , 'leveldb-<(ldbversion)/include/leveldb/db.h'
      , 'leveldb-<(ldbversion)/include/leveldb/env.h'
      , 'leveldb-<(ldbversion)/include/leveldb/filter_policy.h'
      , 'leveldb-<(ldbversion)/include/leveldb/iterator.h'
      , 'leveldb-<(ldbversion)/include/leveldb/options.h'
      , 'leveldb-<(ldbversion)/include/leveldb/slice.h'
      , 'leveldb-<(ldbversion)/include/leveldb/status.h'
      , 'leveldb-<(ldbversion)/include/leveldb/table.h'
      , 'leveldb-<(ldbversion)/include/leveldb/table_builder.h'
      , 'leveldb-<(ldbversion)/include/leveldb/write_batch.h'
      , 'leveldb-<(ldbversion)/port/port.h'
      , 'leveldb-<(ldbversion)/port/port_example.h'
      , 'leveldb-<(ldbversion)/port/port_posix.cc'
      , 'leveldb-<(ldbversion)/port/port_posix.h'
      , 'leveldb-<(ldbversion)/table/block.cc'
      , 'leveldb-<(ldbversion)/table/block.h'
      , 'leveldb-<(ldbversion)/table/block_builder.cc'
      , 'leveldb-<(ldbversion)/table/block_builder.h'
      , 'leveldb-<(ldbversion)/table/filter_block.cc'
      , 'leveldb-<(ldbversion)/table/filter_block.h'
      , 'leveldb-<(ldbversion)/table/format.cc'
      , 'leveldb-<(ldbversion)/table/format.h'
      , 'leveldb-<(ldbversion)/table/iterator.cc'
      , 'leveldb-<(ldbversion)/table/iterator_wrapper.h'
      , 'leveldb-<(ldbversion)/table/merger.cc'
      , 'leveldb-<(ldbversion)/table/merger.h'
      , 'leveldb-<(ldbversion)/table/table.cc'
      , 'leveldb-<(ldbversion)/table/table_builder.cc'
      , 'leveldb-<(ldbversion)/table/two_level_iterator.cc'
      , 'leveldb-<(ldbversion)/table/two_level_iterator.h'
      , 'leveldb-<(ldbversion)/util/arena.cc'
      , 'leveldb-<(ldbversion)/util/arena.h'
      , 'leveldb-<(ldbversion)/util/bloom.cc'
      , 'leveldb-<(ldbversion)/util/cache.cc'
      , 'leveldb-<(ldbversion)/util/coding.cc'
      , 'leveldb-<(ldbversion)/util/coding.h'
      , 'leveldb-<(ldbversion)/util/comparator.cc'
      , 'leveldb-<(ldbversion)/util/crc32c.cc'
      , 'leveldb-<(ldbversion)/util/crc32c.h'
      , 'leveldb-<(ldbversion)/util/env.cc'
      , 'leveldb-<(ldbversion)/util/env_posix.cc'
      , 'leveldb-<(ldbversion)/util/filter_policy.cc'
      , 'leveldb-<(ldbversion)/util/hash.cc'
      , 'leveldb-<(ldbversion)/util/hash.h'
      , 'leveldb-<(ldbversion)/util/logging.cc'
      , 'leveldb-<(ldbversion)/util/logging.h'
      , 'leveldb-<(ldbversion)/util/mutexlock.h'
      , 'leveldb-<(ldbversion)/util/options.cc'
      , 'leveldb-<(ldbversion)/util/random.h'
      , 'leveldb-<(ldbversion)/util/status.cc'
    ]
}]}