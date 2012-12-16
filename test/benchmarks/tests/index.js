/*
 * Prefix a test name with '=>' to have only that test run
 */

module.exports = {
    'put(int, string) x 1000': {
        'LevelUP'             : require('./put_int_string_x1000_levelup')
      , 'LevelUP (release)'   : require('./put_int_string_x1000_levelup')
      , 'LevelUP (no Snappy)' : require('./put_int_string_x1000_levelup')
      , 'Leveled'             : require('./put_int_string_x1000_leveled')
    }

  , 'put(int, string) x 100,000': {
        'LevelUP'             : require('./put_int_string_x100000_levelup')
      , 'LevelUP (release)'   : require('./put_int_string_x100000_levelup')
      , 'LevelUP (no Snappy)' : require('./put_int_string_x100000_levelup')
      , 'Leveled'             : require('./put_int_string_x100000_leveled')
    }

  , 'get(int):string x 1000': {
        'LevelUP'             : require('./get_int_string_x1000_levelup')
      , 'LevelUP (release)'   : require('./get_int_string_x1000_levelup')
      , 'LevelUP (no Snappy)' : require('./get_int_string_x1000_levelup')
      , 'Leveled'             : require('./get_int_string_x1000_leveled')
    }

  , 'batch(int, string) x 1000': {
        'LevelUP'             : require('./batch_int_string_x1000_levelup')
      , 'LevelUP (release)'   : require('./batch_int_string_x1000_levelup')
      , 'LevelUP (no Snappy)' : require('./batch_int_string_x1000_levelup')
// Leveled is currently killing the process for these batch ops
//      , 'Leveled'             : require('./batch_int_string_x1000_leveled')
    }

  , 'batch(int, string) x 100,000': {
        'LevelUP'             : require('./batch_int_string_x100000_levelup')
      , 'LevelUP (release)'   : require('./batch_int_string_x100000_levelup')
      , 'LevelUP (no Snappy)' : require('./batch_int_string_x100000_levelup')
//      , 'Leveled'             : require('./batch_int_string_x100000_leveled')
    }
}