/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */
const common = require('./common')
const buster = require('bustermove')
const execSync = require('child_process').execSync

const thisFile = 'ts-test.js'
const testFolder = './test/'
const testCase = /-test.js/
const fs = require('fs')

buster.testCase('TypeScript', {
  'tearDown': common.commonTearDown,
  'test all through typescript': function (done) {
    fs.readdirSync(testFolder)
      .filter(x => testCase.test(x) && x.endsWith(thisFile) === false)
      .forEach(file => {
        execSync('ts-node ' + testFolder + file, { stdio: 'inherit' })
      })
    done()
  }
})
