const gulp = require('gulp');
const gulpScreeps = require('gulp-screeps');
const eslint = require('gulp-eslint');

const credentials = require('./credentials.js');
const SRC = 'src/**/*.js';
const BUILD = 'build/';
const LIB = 'lib/';

gulp.task('lint', _=>
    gulp.src(SRC)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
);

gulp.task('build', function() {
	gulp.src(SRC)
		.pipe(gulp.dest(BUILD))
});

gulp.task('test', function() {
	console.log('TODO: write tests in Mocha.')
});

gulp.task('commit', _=>
    gulp.src(BUILD)
        .pipe(gulpScreeps(credentials))
);

gulp.task('default', ['lint', 'build', 'test', 'commit']);
gulp.task('watch', _=> gulp.watch(SRC, ['default']));
