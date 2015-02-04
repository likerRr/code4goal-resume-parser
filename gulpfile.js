var gulp = require('gulp'),
  run = require('gulp-run'),
  gutil = require('gulp-util'),
  spawn = require('child_process').spawn,
  node;

/**
 * $ gulp server
 * description: launch the server. If there's a server already running, kill it.
 */
gulp.task('server', function () {
  // set DEBUG=*
  // set DEBUG=socket.io*
  if (node) node.kill();
  //console.log('-f "' + __dirname + '/resume/file.txt' + '"');
  node = spawn('node', ['app.js', '-f', '"'+__dirname+'/public/resume.txt"'], {stdio: 'inherit'});
  node.on('close', function (code) {
    if (code === 8) {
      gutil.log('Error detected, waiting for changes...');
    }
  });
});

gulp.task('default');

/**
 * $ gulp
 * description: start the development environment
 */
gulp.task('dev', ['server'], function () {
  gulp.watch(['app.js', './src/**/**'], ['server']);
});

// clean up if an error goes unhandled.
process.on('exit', function () {
  if (node) node.kill()
});