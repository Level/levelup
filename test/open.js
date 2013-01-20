var db = require('../')('/tmp/foo.db')
db.on('ready', function () {
    db.close()
      db.put('foo', 'bar')
})

