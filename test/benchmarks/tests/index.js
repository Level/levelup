/* Copyright (c) 2012-2014 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT License <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
 */

/*
 * Prefix a test name with '=>' to have only that test run
 */

module.exports = {
    'put(int, string) x 10': {
        'LevelUP'             : require('./put_int_string_x10_levelup')
      , 'LevelUP (release)'   : require('./put_int_string_x10_levelup')
      , 'LevelUP (no Snappy)' : require('./put_int_string_x10_levelup')
      , 'Leveled'             : require('./put_int_string_x10_leveled')
      //, 'SQLite3'             : require('./put_int_string_x10_sqlite3')
    }

  , 'put(int, string) x 1000': {
        'LevelUP'             : require('./put_int_string_x1000_levelup')
      , 'LevelUP (release)'   : require('./put_int_string_x1000_levelup')
      , 'LevelUP (no Snappy)' : require('./put_int_string_x1000_levelup')
      , 'Leveled'             : require('./put_int_string_x1000_leveled')
      //, 'SQLite3'             : require('./put_int_string_x1000_sqlite3')
    }

  , 'put(int, string) x 100,000': {
        'LevelUP'             : require('./put_int_string_x100000_levelup')
      , 'LevelUP (release)'   : require('./put_int_string_x100000_levelup')
      , 'LevelUP (no Snappy)' : require('./put_int_string_x100000_levelup')
      , 'Leveled'             : require('./put_int_string_x100000_leveled')
      // too slow , 'SQLite3'             : require('./put_int_string_x100000_sqlite3')
    }

  , 'get(int):string x 10': {
        'LevelUP'             : require('./get_int_string_x10_levelup')
      , 'LevelUP (release)'   : require('./get_int_string_x10_levelup')
      , 'LevelUP (no Snappy)' : require('./get_int_string_x10_levelup')
      , 'Leveled'             : require('./get_int_string_x10_leveled')
      //, 'SQLite3'             : require('./get_int_string_x10_sqlite3')
    }

  , 'get(int):string x 1000': {
        'LevelUP'             : require('./get_int_string_x1000_levelup')
      , 'LevelUP (release)'   : require('./get_int_string_x1000_levelup')
      , 'LevelUP (no Snappy)' : require('./get_int_string_x1000_levelup')
      , 'Leveled'             : require('./get_int_string_x1000_leveled')
      //, 'SQLite3'             : require('./get_int_string_x1000_sqlite3')
    }

  , 'batch(int, string) x 1000': {
        'LevelUP'             : require('./batch_int_string_x1000_levelup')
      , 'LevelUP (release)'   : require('./batch_int_string_x1000_levelup')
      , 'LevelUP (no Snappy)' : require('./batch_int_string_x1000_levelup')
      , 'Leveled'             : require('./batch_int_string_x1000_leveled')
    }

  , 'batch(int, string) x 100,000': {
        'LevelUP'             : require('./batch_int_string_x100000_levelup')
      , 'LevelUP (release)'   : require('./batch_int_string_x100000_levelup')
      , 'LevelUP (no Snappy)' : require('./batch_int_string_x100000_levelup')
      , 'Leveled'             : require('./batch_int_string_x100000_leveled')
    }

  , 'readStream x 10': {
        'LevelUP'             : require('./readStream_x10_levelup')
      , 'LevelUP (release)'   : require('./readStream_x10_levelup')
      , 'LevelUP (no Snappy)' : require('./readStream_x10_levelup')
    }

  , 'readStream x 100': {
        'LevelUP'             : require('./readStream_x100_levelup')
      , 'LevelUP (release)'   : require('./readStream_x100_levelup')
      , 'LevelUP (no Snappy)' : require('./readStream_x100_levelup')
    }

  , 'readStream x 1,000': {
        'LevelUP'             : require('./readStream_x1000_levelup')
      , 'LevelUP (release)'   : require('./readStream_x1000_levelup')
      , 'LevelUP (no Snappy)' : require('./readStream_x1000_levelup')
    }

  , 'readStream x 10,000': {
        'LevelUP'             : require('./readStream_x10000_levelup')
      , 'LevelUP (release)'   : require('./readStream_x10000_levelup')
      , 'LevelUP (no Snappy)' : require('./readStream_x10000_levelup')
    }

  , 'readStream x 100,000': {
        'LevelUP'             : require('./readStream_x100000_levelup')
      , 'LevelUP (release)'   : require('./readStream_x100000_levelup')
      , 'LevelUP (no Snappy)' : require('./readStream_x100000_levelup')
    }
}
