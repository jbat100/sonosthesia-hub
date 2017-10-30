'use strict';

const gulp = require('gulp');
const tsc = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const tsProject = tsc.createProject('tsconfig.json');

// note: this gulp file is meant to compile the sonosthesia lib for ui-less node based usage

const config = {
    tsOutputPath: './dist-lib/sonosthesia',
    allJavaScript: ['./src/sonosthesia/**/*.js'],
    allTypeScript: './src/sonosthesia/**/*.ts',
    typings: './typings/',
    libraryTypeScriptDefinitions: './typings/generate/**/*.ts'
};

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-ts', function () {
    const sourceTsFiles = [config.allTypeScript, // path to typescript files
        config.libraryTypeScriptDefinitions]; // reference to library .d.ts files
    const tsResult = gulp.src(sourceTsFiles)
        .pipe(sourcemaps.init())
        .pipe(tsProject());
    tsResult.dts.pipe(gulp.dest(config.tsOutputPath));
    return tsResult.js
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.tsOutputPath));
});

/**
 * Remove all generated JavaScript files from TypeScript compilation.
 */
gulp.task('clean-ts', function (cb) {
    const typeScriptGenFiles = [
        config.tsOutputPath +'/**/*.js',    // path to all JS files auto gen'd by editor
        config.tsOutputPath +'/**/*.js.map', // path to all sourcemap files auto gen'd by editor
        '!' + config.tsOutputPath + '/lib'
    ];
    // delete the files
    del(typeScriptGenFiles, cb);
});

gulp.task('watch', function() {
    gulp.watch([config.allTypeScript], ['compile-ts']);
});

// dev compiles once anyway then waits for file changes
gulp.task('dev', ['compile-ts', 'watch']);

gulp.task('default', ['compile-ts']);