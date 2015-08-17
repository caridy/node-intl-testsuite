module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            test262: ['tmp/', 'tests/']
        },

        curl: {
            test262: {
                src : 'https://github.com/tc39/test262/archive/master.zip',
                dest: 'tmp/test262.zip',
            }
        },

        unzip: {
            test262: {
                src : 'tmp/test262.zip',
                dest: 'tmp/',
            }
        }

    });

    grunt.loadTasks('./tasks');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-curl');
    grunt.loadNpmTasks('grunt-zip');

    grunt.registerTask('default', [
        'clean:test262',
        'curl:test262',
        'unzip:test262',
        'update-tests',
    ]);

};
