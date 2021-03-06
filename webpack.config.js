
const path = require('path');
const fs = require('fs');

const webpack = require("webpack");
const autoprefixer = require('autoprefixer');

const HtmlWebpackPlugin = require('html-webpack-plugin');
// apparently not great with webpack 2
const ExtractTextPlugin = require('extract-text-webpack-plugin');

//const nodeExternals = require('webpack-node-externals');

const helpers = require('./config/helpers');

// some hints for windows...
// http://www.digitalcitizen.life/command-prompt-how-use-basic-commands
// http://stackoverflow.com/questions/15126050/running-python-on-windows-for-node-js-dependencies

// configuring electron apps for debug in webstorm is a bit tricky
// https://blog.jetbrains.com/webstorm/2016/05/getting-started-with-electron-in-webstorm/

// look into backend apps with webpack
// http://jlongster.com/Backend-Apps-with-Webpack--Part-I#Getting-Started

// doesnt work: 'Unexpected value 'NgPipesModule' imported by the module 'ApplicationModule'
// the problem is that i have a combination of front end and backend
const nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function(x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function(mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });


module.exports = {
    entry: {
        "vendor": "./src/vendor.ts",
        "app": "./src/main.ts"
    },
    output: {
        path: __dirname + "/dist/electron",
        filename: "js/[name].bundle.js"
    },
    resolve: {
        extensions: ['*', '.ts', '.js', '.sass', 'scss', 'css']
    },
    //exclude: [/node_modules/],
    module: {
        loaders: [

            /*
             * Typescript loader support for .ts and Angular 2 async routes via .async.ts
             * Replace templateUrl and stylesUrl with require()
             *
             * See: https://github.com/s-panferov/awesome-typescript-loader
             * See: https://github.com/TheLarkInn/angular2-template-loader
             *
             * https://github.com/jkuri/ng2-datepicker/issues/136
             */
            {
                test: /\.ts$/,
                exclude: [/node_modules\/(?!(ng2-.+|ngx-.+))/],
                loaders: [
                    'awesome-typescript-loader',
                    'angular2-template-loader',
                    'angular2-router-loader'
                ]
            },

            /* Raw loader support for *.html
             * Returns file content as string
             *
             * See: https://github.com/webpack/raw-loader
             */
            {
                test: /\.html$/,
                loaders: ['raw-loader'],
                exclude: ['index.html']
            },

            /*
             * https://www.jonathan-petitcolas.com/2015/05/15/howto-setup-webpack-on-es6-react-application-with-sass.html
             * using ExtractTextPlugin would be better practise but it causes problems
             * https://github.com/webpack/webpack/issues/2764 and the problems it solves are irrelevant to electron apps anyway.
             *
             * Added -loaders at the end to fix:
             *      Module not found: Error: Can't resolve 'style' in 'F:\Sonosthesia\sonosthesia-hub'
             *      BREAKING CHANGE: It's no longer allowed to omit the '-loader' suffix when using loaders.
             *      You need to specify 'style-loader' instead of 'style'.
             */
            {
                test: /\.scss$/,
                //loader: ExtractTextPlugin.extract('css!sass')
                loaders: ['style-loader', 'css-loader', 'sass-loader']
            },

            {
                test: /\.css$/,
                //loader: ExtractTextPlugin.extract('css!sass')
                loaders: ['style-loader', 'css-loader']
            },

            {
                "test": /\.json$/,
                "loader": "json-loader"
            },

            // files used by photonkit
            // not actually using photon kit as it looks really shitty on windows...
            // https://github.com/abduld/electron-react-cerebral-photonkit-babel6-webpack/blob/master/webpack.config.js
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "url-loader?limit=1000000&mimetype=application/font-woff"
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"
            }
        ],
        //noParse: [/(ws|socket\.io)/]
    },
    devServer: {
        port: 80,
        hot: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html',
            hash: false,
            cache: false,
            title: 'Sonosthesia Hub'
        }),
        // https://www.jonathan-petitcolas.com/2015/05/15/howto-setup-webpack-on-es6-react-application-with-sass.html
        // https://github.com/webpack/webpack/issues/2764
        // new ExtractTextPlugin('public/style.css', { allChunks: true })
    ],

    // ways around the 'cannot resolve 'net', or all the other node modules
    // https://github.com/request/request/issues/1529
    target: 'electron-renderer',
    //node: {console: true, fs: 'empty', net: 'empty', tls: 'empty'}
    devtool: 'source-map',
    //externals: [nodeExternals()]
    //externals: ["ws", "socket.io"]
    //externals: nodeModules
};
