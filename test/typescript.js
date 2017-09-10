/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */
const execSync = require('child_process').execSync

const testFolder = './test/'
const testCase = /-test.js/
const fs = require('fs')

fs.readdirSync(testFolder)
  .filter(x => testCase.test(x))
  .forEach(file => {
    execSync('ts-node ' + testFolder + file, { stdio: 'inherit' })
  })
