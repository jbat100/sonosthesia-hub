'use strict';
var GulpConfig = (function () {
    function gulpConfig() {
        this.tsOutputPath = './dist';
        this.allJavaScript = ['./src/**/*.js'];
        this.allTypeScript = './src/**/*.ts';
        this.typings = './typings/';
        this.libraryTypeScriptDefinitions = './typings/generate/**/*.ts';
    }
    return gulpConfig;
})();
module.exports = GulpConfig;