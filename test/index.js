/* Copyright (c) 2012-2018 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */
const fs = require('fs')
const path = require('path')

fs.readdirSync(__dirname)
  .filter(f => /-test.js/.test(f))
  .forEach(f => require(path.join(__dirname, f)))
