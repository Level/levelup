/* Copyright (c) 2012-2014 LevelUP contributors
 * See list at <https://github.com/rvagg/node-levelup#contributing>
 * MIT License <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
 */

module.exports.LevelUP = require('./levelup')
module.exports.LevelUP.color = 'green'

module.exports['LevelUP (release)'] = require('./levelup-release')
module.exports['LevelUP (release)'].color = 'yellow'

//module.exports['LevelUP (no Snappy)'] = require('./levelup-nosnappy')
//module.exports['LevelUP (no Snappy)'].color = 'magenta'

module.exports.Leveled = require('./leveled')
module.exports.Leveled.color = 'cyan'

module.exports.SQLite3 = require('./sqlite3')
module.exports.SQLite3.color = 'blue'
