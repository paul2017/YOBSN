var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var del = require('del');
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require("gulp-uglify");
var imagemin = require('gulp-imagemin');
var htmlreplace = require('gulp-html-replace');
var templateCache = require('gulp-angular-templatecache');
var sh = require('shelljs');

var paths = {
  src: ['./src/'],
  sass: ['./scss/**/*.scss'],
  styles: [
    './src/css/ionicons.min.css.css',
    './src/css/ionic.app.css',
    './src/css/style.css',
    './src/css/grid.css',
    './src/lib/flowplayer/skin/minimalist.css'
  ],
  scripts: [
    './src/js/**/*.js'
  ],
  ionicfonts: ['./src/lib/ionic/fonts/*'],
  libs: [
    './src/lib/jquery/dist/jquery.min.js',
    './src/lib/ionic/js/ionic.bundle.js',
    './src/lib/moment/min/moment.min.js',
    './src/lib/angular-moment/angular-moment.js',
    './src/lib/angular-bindonce/bindonce.min.js',
    './src/lib/angular-linkify/angular-linkify.min.js',
    './src/lib/pdf/pdf.compat.js',
    './src/lib/pdf/pdf.js',
    './src/lib/pdf/pdf.worker.js',
    './src/lib/flowplayer/flowplayer.min.js',
    './src/lib/ngstorage/ngStorage.js',
    './src/lib/angular-local-storage/dist/angular-local-storage.min.js',
    './src/lib/ngCordova/dist/ng-cordova.js'
  ],
  images: ['./src/img/**/*'],
  templates: ['./src/templates/**/*.html'],
  html: ['./src/index.html'],
  dist: ['./www/']
};

var files = {
  jsbundle: 'app.bundle.min.js',
  libbundle: 'lib.bundle.min.js',
  cssbundle: 'app.bundle.min.css',
  appcss: 'app.css'
};

gulp.task('default', ['sass']);
gulp.task('dist', ['sass', 'scripts', 'libs', 'styles', 'imagemin', 'index', 'copy']);
gulp.task('test', ['sass', 'copy-src']);

gulp.task('del', function(cb) {
  return del(paths.dist + '*', cb);
});

gulp.task('sass', function() {
  return gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .pipe(gulp.dest(paths.src + 'css/'));
});

// templateCache - concat all html templates and load into templateCache
gulp.task('templateCache', ['del'], function() {
  return gulp.src(paths.templates)
    .pipe(templateCache({
      'filename': 'templates.js',
      'root': 'templates/',
      'module': 'YOBSN'
    }))
    .pipe(gulp.dest(paths.src + 'js'));
});

// scripts - del dist dir then annotate, minify, concat
gulp.task('scripts', ['del', 'templateCache'], function() {
  gulp.src(paths.scripts)
    // .pipe(jshint())
    // .pipe(jshint.reporter('default'))
    .pipe(ngAnnotate({
      remove: true,
      add: true,
      single_quotes: true
    }))
    .pipe(uglify())
    .pipe(concat(files.jsbundle))
    .pipe(gulp.dest(paths.dist + 'js'));
});

// libs - del dist dir then annotate, minify, concat
gulp.task('libs', ['del'], function() {
  gulp.src(paths.libs)
    .pipe(uglify())
    .pipe(concat(files.libbundle))
    .pipe(gulp.dest(paths.dist + 'js'));
});

// styles - concat and min app css then copy min css to dist
gulp.task('styles', ['del'], function() {
  gulp.src(paths.styles)
    .pipe(concat(files.cssbundle))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(gulp.dest(paths.dist + 'css'));
});

// Imagemin images and ouput them in dist
gulp.task('imagemin', ['del'], function() {
  gulp.src(paths.images)
    .pipe(imagemin())
    .pipe(gulp.dest(paths.dist + 'img'));
});

// Prepare Index.html for dist - ie. using min files
gulp.task('index', ['del'], function() {
  gulp.src(paths.html)
    .pipe(htmlreplace({
      'css': 'css/' + files.cssbundle,
      'js': 'js/' + files.jsbundle,
      'lib': 'js/' + files.libbundle
    }))
    .pipe(gulp.dest(paths.dist + '.'));
});

// Copy all other files to dist directly
gulp.task('copy', ['del'], function() {
  gulp.src(paths.ionicfonts)
    .pipe(gulp.dest(paths.dist + 'lib/ionic/fonts'));
});

// Copy all other files to dist directly
gulp.task('copy-src', ['del'], function() {
  gulp.src(paths.src + '**/*')
    .pipe(gulp.dest(paths.dist + '.'));
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});