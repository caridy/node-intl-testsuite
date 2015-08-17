# Intl Testsuite for Node

This repo groups all tests associated to Intl for Node, including test262.

## Getting started

    git clone https://github.com/caridy/node-intl-testsuite.git
    cd node-intl-testsuite
    npm install

## Build tests

Tests are going to be downloaded from https://github.com/tc39/test262/archive/master.zip
as part of the build step:

    npm run build

## Run tests

As today, we have two ways to run test262 for ecma402, the first one corresponds
to the testsuite used by Intl.JS polyfill, which implements its own way to provision
the harness per tests:

    npm run test

The second suite, uses [test262-harness](https://github.com/bterlson/test262-harness)
to run the same tests using the designated node-in-process (node-ip) runner:

    npm run test2


## Known issues

* Some tests are relying on some ES2015 syntax like class definitions, which are not
available in node yet.
* Some tests are checking internal states and reflections, which are not implemented
by V8 yet.
