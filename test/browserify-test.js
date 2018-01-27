/* Copyright (c) 2012-2017 LevelUP contributors
 * See list at <https://github.com/level/levelup#contributing>
 * MIT License <https://github.com/level/levelup/blob/master/LICENSE.md>
 */

const { assert, refute } = require('referee')
const buster = require('bustermove')
const browserify = require('browserify')
const path = require('path')
const after = require('after')
const bl = require('bl')
const { spawn } = require('child_process')
const PACKAGE_JSON = path.join(__dirname, '..', 'package.json')

buster.testCase('Browserify Bundle', {
  'does not contain package.json': function (done) {
    var b = browserify(path.join(__dirname, '..'), { browserField: true })
      .once('error', error => {
        assert.fail(error)
        done()
      })
    b.pipeline
      .on('file', (file, id, parent) => {
        refute.equals(file, PACKAGE_JSON)
      })
    b.bundle(done)
  },
  'throws error if missing db factory': function (done) {
    var b = browserify(path.join(__dirname, 'data/browser-throws.js'), { browserField: true })
    var node = spawn('node')
    var fin = after(2, done)
    node.stderr.pipe(bl((err, buf) => {
      refute(err)
      assert.match(buf.toString(), /InitializationError: Must provide db/)
      fin()
    }))
    node.on('exit', code => {
      assert.equals(code, 1)
      fin()
    })
    b.bundle().pipe(node.stdin)
  },
  'works with valid db factory (memdown)': function (done) {
    var b = browserify(path.join(__dirname, 'data/browser-works.js'), { browserField: true })
    var node = spawn('node')
    node.on('exit', code => {
      assert.equals(code, 0)
      done()
    })
    b.bundle().pipe(node.stdin)
  }
})
