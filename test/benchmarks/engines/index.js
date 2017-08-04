/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

module.exports.LevelUP = require('./levelup')
module.exports.LevelUP.color = 'green'

module.exports['LevelUP (release)'] = require('./levelup-release')
module.exports['LevelUP (release)'].color = 'yellow'

module.exports.SQLite3 = require('./sqlite3')
module.exports.SQLite3.color = 'blue'
