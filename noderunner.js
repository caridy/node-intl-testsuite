var libfs = require('fs');
var libpath = require('path');
var libvm = require('vm');
var TEST_DIR = __dirname + '/tests';

// returns Error if test threw one
function runTest(testPath) {
    var content,
        context = libvm.createContext({});

    content = libfs.readFileSync(libpath.resolve(TEST_DIR, testPath)).toString();

    try {
        libvm.runInContext(content, context, testPath);
        return libvm.runInContext('runner()', context);
    } catch (err) {
        return err;
    }
}

function listTests() {
    var tests = [],
        todo = [ '.' ],
        doing,
        path;
    while (todo.length) {
        doing = todo.shift();
        path = libpath.resolve(TEST_DIR, doing);
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

function main() {
    var tests,
        passCount = 0,
        failCount = 0;
    tests = listTests();
    tests.sort();
    tests.forEach(function(testPath) {
        var name,
            err;
        name = libpath.basename(testPath, libpath.extname(testPath));
        err = runTest(testPath);

        if (err !== true) {
            console.log(name, '-- FAILED', err.message);
            failCount++;
        } else {
            console.log(name);
            passCount++;
        }
    });
    console.log('total ' + (tests.length) + ' -- passed ' + passCount + ' -- failed ' + failCount);
    process.exit(failCount ? 1 : 0);
}

main();
