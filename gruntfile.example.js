module.exports = function(grunt) {

    // https://github.com/screeps/grunt-screeps
    grunt.loadNpmTasks('grunt-screeps');

    grunt.initConfig({
        screeps: {
            options: {
                email: 'YOUR_EMAIL',
                password: 'YOUR_PASSWORD',
                branch: 'default',
                ptr: false
            },
            dist: {
                src: ['src/*.js', 'lib/*.js']
            }
        }
    });

}