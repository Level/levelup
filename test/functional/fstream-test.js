var assert       = require('buster').assert
  , refute       = require('buster').refute
  , fstream      = require('fstream')
  , async        = require('async')
  , mkfiletree   = require('mkfiletree')
  , readfiletree = require('readfiletree')
  , rimraf       = require('rimraf')
  , levelup      = require('../../lib/levelup')

  , fixtureFiles = {
        'foo': 'FOO!\n'
      , 'a directory': {
            'bogantastic.txt':
                  'As busy as a bradman also stands out like a chrissie. Built like a stickybeak mate he hasn\'t got a rego. Mad as a prezzy no dramas grab us a butcher. As dry as a bush bash my stands out like a cranky. It\'ll be cleanskin how get a dog up ya kindie. Come a banana bender heaps as cunning as a dunny. It\'ll be slaps bloody grab us a reckon. As busy as a ace! flamin as busy as a chrissie.\n\n'
                + 'As busy as a back of bourke bloody as stands out like stoked. He\'s got a massive plonk my as cunning as a dunny. Mad as a fruit loop bloody she\'ll be right brickie. Lets throw a oldies bloody trent from punchy chuck a yewy. Flat out like a big smoke no dramas as cunning as a bradman. He\'s got a massive rubbish flamin he hasn\'t got a . Grab us a gutta grab us a ten clicks away. It\'ll be sheila no worries built like a bizzo. Lets throw a fremantle doctor no dramas shazza got us some sheila. Gutful of rip snorter with she\'ll be right rollie. Built like a dead horse no dramas lets throw a waratah.\n\n'
                + 'He hasn\'t got a truckie when lets throw a rack off. Gutful of bored sh*tless my as cross as a feral. Mad as a skite no dramas lets throw a trackie dacks. Stands out like a cockie no dramas he\'s got a massive ute. Mad as a milk bar also as dry as a wobbly.\n\n'
                + 'Shazza got us some op shop mate grab us a cockie. As stands out like ciggies my he\'s got a massive blow in the bag. We\'re going smoko where as dry as a op shop. Gutful of bail up when we\'re going fairy floss. He\'s got a massive snag lets get some boogie board. Come a skite with grab us a smokes. Mad as a dropkick bloody as dry as a back of bourke. She\'ll be right truckie no worries mad as a kero. Mad as a christmas as cunning as a counter meal. Come a postie also come a sanger. Trent from punchy rollie mate clucky.\n\n'
          , 'subdir': {
                'boganmeup.dat':
                    'Lets get some good onya she\'ll be right quid. You little ripper pig\'s arse how grab us a ute. As dry as a bizzo to lets get some cobber. It\'ll be bog standard lets get some cleanskin. As cross as a corker no dramas give it a burl. As cross as a dipstick flat out like a bushranger. As cross as a old fella also as cross as a brickie. He\'s got a massive ocker piece of piss as dry as a divvy van. We\'re going flick no worries shazza got us some reckon. He hasn\'t got a cane toad mate trent from punchy chokkie. banana bender heaps stands out like a quid.\n\n'
                  + 'Come a christmas to lets get some ciggies. As cross as a blow in the bag mate cab sav. As dry as a dead dingo\'s donger how it\'ll be dag. As cunning as a ace! bloody he hasn\'t got a relo. She\'ll be right whinge trent from punchy good onya. She\'ll be right whinge no dramas you little ripper dag. She\'ll be right pash where he hasn\'t got a bludger. As dry as a slab how as stands out like damper. She\'ll be right mullet to as stands out like mates. She\'ll be right big smoke she\'ll be right pokies.\n\n'
                  + 'Built like a rubbish flamin lets throw a freo. Come a blue to shazza got us some blow in the bag. You little ripper bloke flamin as busy as a bundy. Lets throw a old fella when we\'re going spag bol. Shazza got us some banana bender how gutful of chokkie. He hasn\'t got a brizzie my shazza got us some dunny rat. It\'ll be kindie to you little ripper too right!.\n\n'
                  + 'Lets get some bonza when he\'s got a massive brass razoo. Shazza got us some his blood\'s worth bottling to flat out like a dole bludger. He\'s got a massive schooner no worries shazza got us some galah. She\'ll be right chrissie no worries shazza got us some dill. Lets get some blow in the bag also trent from punchy jillaroo. Shazza got us some no-hoper when as dry as a booze bus. As dry as a milk bar no worries as cross as a mate\'s rate. We\'re going sickie heaps wuss.\n\n'
              , 'sub sub dir': {
                    'bar': 'BAR!\n'
                  , 'maaaaaaaate':
                        'As cross as a troppo with lets get some captain cook. You little ripper bundy bloody fossicker. Lets throw a bail out where he\'s got a massive blow in the bag. As dry as a no worries trent from punchy boogie board. He hasn\'t got a waratah to mad as a lippy. She\'ll be right barbie flamin as stands out like tucker.\n\n'
                      + 'She\'ll be right franger also as stands out like tinny. She\'ll be right amber fluid no dramas shazza got us some banana bender. Stands out like a ugg flamin built like a cane toad. Lets throw a thingo how he hasn\'t got a fair go. Mad as a bonzer piece of piss gutful of spewin\'.\n\n'
                      + 'He hasn\'t got a pash we\'re going skite. Gutful of rack off when get a dog up ya bludger. Built like a swag when it\'ll be flick. He hasn\'t got a cobber piece of piss as cunning as a chuck a sickie. It\'ll be arvo my get a dog up ya bail up. Lets get some brekkie with lets get some boogie board. It\'ll be lippy to you little ripper rack off. Built like a turps as cross as a hooroo. Come a grog bloody you little ripper kindie.\n\n'
                      + 'Lets get some bogged piece of piss you little ripper mullet. She\'ll be right blow in the bag my as dry as a ciggies. As dry as a bludger built like a shag on a rock. blow in the bag to lets get some mokkies. Trent from punchy trackies bloody as cunning as a middy. He\'s got a massive tinny gutful of buckley\'s chance. yobbo piece of piss lets get some mullet. She\'ll be right spit the dummy no worries she\'ll be right brick sh*t house. Flat out like a digger when it\'ll be mates. We\'re going mickey mouse mate when as cunning as a boil-over.\n\n'
                }
              , 'bang': 'POW'
            }
          , 'boo': 'W00t'
        }
    }
  , dblocation = 'levelup_test_fstream.db'

  , opendb = function (dir, callback) {
      var db = levelup.createDatabase(dblocation, { createIfMissing: true , errorIfExists: false })
      db.open(function (err) {
        refute(err)
        callback(null, dir, db)
      })
    }

  , fstreamWrite = function (dir, db, callback) {
      fstream.Reader(dir)
        .pipe(db.writeStream({ fstreamRoot: dir })
          .on('close', function () {
            db.close(function (err) {
              refute(err)
              callback(null, dir)
            })
          }))
    }

  , fstreamRead = function (dir, db, callback) {
      db.readStream({ type: 'fstream' })
        .pipe(new fstream.Writer({ path: dir + '.out', type: 'Directory' })
          .on('close', function () {
            db.close(function (err) {
              refute(err)
              callback(null, dir)
            })
          })
        )
    }

  , verify = function (dir, obj, callback) {
      assert.equals(obj, fixtureFiles)
      console.log('Guess what?? It worked!!')
      callback(null, dir)
    }

  , cleanUp = function (dir, callback) {
      async.parallel([
          rimraf.bind(null, dir + '.out')
        , rimraf.bind(null, dblocation)
        , mkfiletree.cleanUp
      ], callback)
    }

process.on('uncaughtException', function (err) {
  refute(err)
})

async.waterfall([
    rimraf.bind(null, dblocation)
  , mkfiletree.makeTemp.bind(null, 'levelup_test_fstream', fixtureFiles)
  , opendb
  , fstreamWrite
  , opendb
  , fstreamRead
  , function (dir, callback) {
      readfiletree(dir, function (err, obj) {
        refute(err)
        callback(err, dir, obj)
      })
    }
  , verify
  , cleanUp
])