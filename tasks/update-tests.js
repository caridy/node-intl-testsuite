/* jshint node:true */

/* copying and updating tests from tmp/test262-master */

var libfs       = require('fs');
var libpath     = require('path');
var SRC_262     = __dirname + '/../tmp/test262-master';
var SRC_DIR     = SRC_262 + '/test/intl402';
var DEST_DIR    = __dirname + '/../tests';
var INCLUDE_DIR = SRC_262 + '/harness';

var WRAPPER_START = [
        // stuff defined in harness/*.js yet not pulled in via $INCLUDE()
        'function fnGlobalObject() {',
        '    return global;',
        '}'
    ].join('\n');

var WRAPPER_END = [
        'function runner() {',
        '    var passed = false;',
        '    runTheTest();',
        '    passed = true;',
        '    return passed;',
        '}',
    ].join('\n');

function processTest(content) {
    var includes = [];
    content = content.replace(/includes\: \[(.*)]/g, function(all, path) {
        path = libpath.resolve(INCLUDE_DIR, path);
        includes.push(libfs.readFileSync(path).toString());
        return path;
    });

    // injecting includes at the top
    content = includes.join('\n') + '\n' + content;

    // fixup constructor lists
    content = content.replace(/(\[)("Collator",)/, '$1/*$2*/');

    content = content.replace(/\$ERROR\(/g, 'throw new Error(');

    // The test suite tries to parse an ISO 8601 date, which fails in <=IE8
    content = content.replace(/Date\.parse\("1989-11-09T17:57:00Z"\)/g, '$& || Date.parse("1989/11/09 17:57:00 UTC")');

    // Another IE 8 issue: [undefined].hasOwnProperty(0) is false, so we need
    // to work around this in at least one test
    content = content.replace(/^(\s*)(var.*)\[value\](.*)$/m, '$1var arr = [];\n$1arr[0] = value;\n$1$2arr$3');

    var explainV8OptOut = '// This test is disabled to avoid the v8 bug outlined at https://code.google.com/p/v8/issues/detail?id=2694';
    var explainES6OptOut = '// This test is disabled because it relies on ES 2015 behaviour, which is not implemented in environments that need this polyfill';

    // Due to a bug in v8, we need to disable parts of the _L15 tests that
    // check the function property `length` is not writable
    content = content.replace(/^(\s*)(?=.*throw.*The length property.*function must not be writable)/gm, '$1' + explainV8OptOut + '\n$&//');
    content = content.replace(/^(\s*)(?=.*throw.*The length property.*function must be configurable)/gm, '$1' + explainES6OptOut + '\n$&//');

    // There's also part of the _L15 test that a JavaScript implementation
    // cannot possibly pass, so we need to disable these parts too
    var idxStart = content.search(/^(\s*)\/\/ The remaining sections have been moved to the end/m),
        idxEnd   = content.search(/^\s+\/\/ passed the complete test/m);

    if (idxStart > -1) {
        content = [
            content.slice(0, idxStart),
            '\n// Intl.js cannot pass the following sections of this test:\n',
            content.slice(idxStart + 1, idxEnd).replace(/^(?!$)/gm, '//$&'),
            idxEnd > -1 ? content.slice(idxEnd) : ''
        ].join('');
    }

    return content;
}


// Turns test into an HTML page.
function wrapTest(content) {
    // The weird "//" makes these html files also valid node.js scripts :)
    return [
        WRAPPER_START,
        content,
        WRAPPER_END
    ].join('\n');
}


function listTests() {
    var tests = [],
        todo = [ '.' ],
        doing,
        path;

    while (todo.length) {
        /*jshint loopfunc:true*/
        doing = todo.shift();
        path = libpath.resolve(SRC_DIR, doing);
        stat = libfs.statSync(path);
        if (stat.isFile()) {
            tests.push(doing);
            continue;
        }
        if (stat.isDirectory()) {
            todo = todo.concat(libfs.readdirSync(path).map(function(a) {
                return libpath.join(doing, a);
            }));
        }
    }
    return tests;
}

function isValidTest(testPath) {
    if (testPath === '11.1.2.js' || testPath === '12.1.2.js' || testPath === '10.1.2_a.js') {
      // ignoring subclasing of Intl.Collator, Intl.NumberFormat and Intl.DateTimeFormat
      // until V8 adds support for ES2015 Class declaration
      return false;
    }

    return true;
}

module.exports = function(grunt) {

    grunt.registerTask('update-tests', 'refreshes the tests found in tests/', function() {
        var tests = listTests();
        tests.sort();
        tests.forEach(function(testPath) {
            if (!isValidTest(testPath)) {
                return;
            }
            var srcPath  = libpath.resolve(SRC_DIR, testPath),
                destPath = libpath.resolve(DEST_DIR, testPath),
                content;
            content = 'function runTheTest () {'+ grunt.file.read(srcPath) +' }';
            content = processTest(content);
            content = wrapTest(content);
            grunt.file.write(destPath, content);
        });
    });

};
