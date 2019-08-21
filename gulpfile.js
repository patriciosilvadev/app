'use strict';

var gulp = require('gulp');
var less = require('gulp-less');

gulp.task('less', function () {
  return gulp.src('./src/theme/base.less')
    .pipe(less())
    .pipe(gulp.dest('./dist'));
});

// Watch our files
gulp.task('less:watch', function () {
  gulp.watch('./src/theme/*.less', ['less']);
});

gulp.task('default', [ 'less' ]);
