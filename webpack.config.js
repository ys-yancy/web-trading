var webpack = require('webpack');
//var underscore = require('underscore');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
require("babel-polyfill");

module.exports = {
    entry: {
        index: './src/p/pay/index/index',
        login: './src/p/pay/login/index',
        guide: './src/p/pay/guide/index',
        recharge: './src/p/pay/recharge/index',
        about: './src/p/pay/about/index',
        zhufeng: './src/p/zhufeng/index',
        'zhufeng/option': './src/p/zhufeng/option/index',
        'zhufeng/about': './src/p/zhufeng/about/index',
        'zhufeng/cooperation': './src/p/zhufeng/cooperation/index',
        'zhufeng/news-list': './src/p/zhufeng/news-list/index',
        'zhufeng/news-detail': './src/p/zhufeng/news-detail/index',
        'zhufeng/cooperation': './src/p/zhufeng/cooperation/index',
        'zhufeng/platform': './src/p/zhufeng/platform/index',
        'webtrade/first-login': './src/p/webtrade/first-login/index',
        'webtrade/login': './src/p/webtrade/login/index',
        'webtrade/trade': './src/p/webtrade/trade/index',
        'webtrade/truename': './src/p/webtrade/trueName/index',
        'webtrade/register': './src/p/webtrade/register/index',
        'webtrade/index': './src/p/webtrade/index/index',
        'webtrade/xinwaihui/register-embed': './src/p/webtrade/xinwaihui/register-embed/index',
        'webtrade/xinwaihui/register-pc': './src/p/webtrade/xinwaihui/register-pc/index',
    },
    output: {
        path: __dirname + '/build/',
        filename: '[name].js'
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel-loader",
            query: {
            presets: ['es2015', 'stage-0'],
            "plugins": [
              "add-module-exports",
              "transform-decorators-legacy",
              "transform-class-properties",
            ]
          }
        }, {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
        }, {
            test: /\.ejs\.html$/,
            loader: "ejs-loader"
        }, {
            test: /.*\.(gif|png|jpe?g|svg)$/i,
            loaders: [
                'file?hash=sha512&digest=hex&name=[hash].[ext]',
                'image-webpack?{progressive:true, optimizationLevel: 7, interlaced: false, pngquant:{quality: "65-90", speed: 4}}'
            ]
        }]
    },
    devtool: 'source-map',
    devServer: {
        disableHostCheck: true
    },
    plugins: [
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: {
        //         warnings: false
        //     }
        // })
    ]
};