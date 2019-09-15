var browserify = require('browserify')
var path = require('path')
var after = require('after')
var concat = require('simple-concat')
var spawn = require('child_process').spawn
var PACKAGE_JSON = path.join(__dirname, '..', 'package.json')

module.exports = function (test) {
  test('does not contain package.json', function (t) {
    var b = browserify(path.join(__dirname, '..'), { browserField: true })
      .once('error', t.end.bind(t))
    b.pipeline
      .on('file', function (file, id, parent) {
        t.isNot(file, PACKAGE_JSON)
      })
    b.bundle(t.end.bind(t))
  })

  test('throws error if missing db factory', function (t) {
    var b = browserify(path.join(__dirname, 'data/browser-throws.js'), { browserField: true })
    var node = spawn('node')
    var next = after(2, t.end.bind(t))

    concat(node.stderr, function (err, buf) {
      t.ifError(err)
      t.ok(/InitializationError: First argument must be an abstract-leveldown compliant store/.test(buf))
      next()
    })

    node.on('exit', function (code) {
      t.is(code, 1)
      next()
    })

    b.bundle().pipe(node.stdin)
  })

  test('works with valid db factory (memdown)', function (t) {
    var b = browserify(path.join(__dirname, 'data/browser-works.js'), { browserField: true })
    var node = spawn('node')
    node.on('exit', function (code) {
      t.is(code, 0)
      t.end()
    })
    b.bundle().pipe(node.stdin)
  })
}
