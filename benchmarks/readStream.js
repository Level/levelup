
var levelup = require("..")
  , rimraf = require("rimraf")
  , dir = "./benches"
  , startCounts = 100000


rimraf(dir, function() {
  var db = levelup(dir)
    , counts = startCounts
    , startTime

    , doWrites = function() {
        if(--counts === 0) {
          startTime = new Date()
          counts = startCounts
          doReads()
          return
        }
        db.put("aa" + counts, "bb" + counts, doWrites)
      }

    , doReads = function() {

        var stream = db.createReadStream()

        stream.on("data", function() {
          counts--
        })
      
        stream.on("end", function() {
          var totalTime = new Date() - startTime

          console.log("total time", totalTime)
          console.log("total reads", startCounts)
          console.log("reads/s", startCounts / totalTime * 1000)

          db.close(function() {
            levelup.destroy(dir)
          })
        })
      }

  doWrites()
})
