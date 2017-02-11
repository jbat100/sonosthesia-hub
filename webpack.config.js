
const webpack = require("webpack");

const HtmlWebpackPlugin = require('html-webpack-plugin');

const helpers = require('./config/helpers');

module.exports = {
    entry: {
        "app": "./src/main.ts",
        "vendor": "./src/vendor.ts"
    },
    output: {
        path: __dirname + "\\dist",
        filename: "js\\[name].bundle.js"
    },
    resolve: {
        extensions: ['*', '.ts', '.js']
    },
    module: {
        loaders: [

            /*
             * Typescript loader support for .ts and Angular 2 async routes via .async.ts
             * Replace templateUrl and stylesUrl with require()
             *
             * See: https://github.com/s-panferov/awesome-typescript-loader
             * See: https://github.com/TheLarkInn/angular2-template-loader
             */
            {
                test: /\.ts$/,
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
            }
        ]
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
            title: 'Angular 2 sample'
        })
    ]
};
