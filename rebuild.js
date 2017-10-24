
const fse = require('fs-extra');
const rebuild = require('electron-rebuild');

// could have some platform specific stuff here i guess

const config = {
    buildPath: __dirname,
    electronVersion: '1.7.6',
    force: true,
    extraModules: ['midi']
};

console.warn('rebuild.js running electron-rebuild in ' + __dirname + ' with config: ' + JSON.stringify(config) );

rebuild.rebuild(config).then(() => {
    console.log('electron-rebuild is done');
}).then(() => {
    console.log('removing old build files');
    return fse.remove('./node_modules/midi/build/');
}).then(() => {
    console.log('moving electron build files');
    return fse.move('./node_modules/midi/bin/win32-x64-54/', './node_modules/midi/build/Release/');
}).then(() => {
    console.log('rebuild.js done');
}).catch(err => {
    console.error('rebuild.js failed with error : ' + err.message);
});