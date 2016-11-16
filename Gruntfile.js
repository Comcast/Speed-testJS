module.exports = function (grunt) {

    // Grunt configuration goes into initConfig
    grunt.initConfig({
        //use the copy with source and destination
        copy: {
            html: {
                files: [
                    { src: 'public/**', dest: 'dist/' },
                    { src: 'modules/**', dest: 'dist/' },
                    { src: 'index.js', dest: 'dist/' },
                    { src: 'package.json', dest: 'dist/' },
                    { src: 'node_modules/**', dest: 'dist/' },
                    { src: 'config/**', dest: 'dist/' },
                    { src: 'controllers/**', dest: 'dist/' },
                ]
            }

        },
        docco: {
            debug: {
                src: [
                    'lib/**/*.js',
                ],
                options: {
                    output: 'public/docs/'
                }
            }
        }
    }
    );

    //load the copy module
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-tar.gz');
    grunt.loadNpmTasks('grunt-docco-multi');
    //register the build task
    grunt.registerTask('package', ['copy:html']);
    grunt.registerTask('docs', ['docco']);

};
