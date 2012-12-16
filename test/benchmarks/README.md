# LevelUP Benchmarks

## Using

In this directory:

```sh
$ npm install
$ node ./
```

## Philosophy

LevelUP's primary goal is to provide a ***safe***, ***useful*** and ***natural*** Node.js API on top of LevelDB. Performance is important but not at the expense of safety or the utility of the API.

The goal of this benchmark suite is to:

  * Pinpoint areas where performance can/should be improved
  * Prevent performance regressions between releases
  * Compare the suitability of LevelUP/LevelDB as a persistent storage mechanism for Node.js (e,g. what do you gain in terms of performance by sacrificing a more rich query interface available in something like SQLite?)

## About

Currently, we the benchmarks run for the current version of LevelUP (i.e. `require('../../')`), the version of LevelUP currently in npm, [Leveled](https://github.com/juliangruber/node-leveled) and [node-sqlite3](https://github.com/developmentseed/node-sqlite3/). Benchmarks for LevelUP with compression disabled can also be run by editing the *engins/index.js* file.

**Leveled** is a minimal binding that is mostly implemented in C++ with few options, only `String` data-types and minimal safety checks. Therefore it's an excellent baseline for performance that LevelUP can aspire to.

**SQLite3** is included to see how an alternative persistent k/v store can perform. The comparison is only fair when considering a simple k/v store and in this regard the main SQLite3 binding performs poorly.

## How does it work?

The main benchmark runner is *./index.js*, it uses [Benchmark.js](http://benchmarkjs.com/) to do the heavy lifting and measuring. "Engines" (i.e. databases) are specified in the *./engines/* directory, to add a new engine/database simply follow the pattern used for the existing ones. The benchmark tests themselves are stored in the *./tests/* directory. *./tests/index.js* lists them all and uses a simple `require()` to pull them in from the various files. The tests index maps the engine names to the test runners. Some tests have a `setup()` function and others simply have a main runner.

Tests without a mapping for a given engine are simply not invoked for that engine.

Individual tests can be singled out by prepending `'=>'` to the *name* of the test. The runner will then single that test out and only run it with the various engines.

## Contributing

Yes please! I'd love help making these more rigorous and meaningful. Please contribute if you see something you can add.

Bother *@rvagg* if you have trouble working any of this out.