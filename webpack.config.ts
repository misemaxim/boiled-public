import path from 'path';
import glob from 'glob';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { createServer } from './src/server/create-server';
import { noop } from 'lodash';
import { isDev } from './dev/is-dev';
import { registerDevApi } from './dev/register-dev-api';
import { Application } from 'express';
import TerserPlugin from 'terser-webpack-plugin';
import { getConfig } from './src/server/lib/get-config';

const distPath = path.join(__dirname, '/build/src');

const config = {
  entry: {
    main: './src/public/index.js'
  },
  output: {
    filename: 'bundle.js',
    path: distPath,
    publicPath: '/'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.js$/, loader: 'source-map-loader' },
      { test: /\.html$/, use: 'html-loader' },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{ loader: 'babel-loader' }]
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader, // isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [!isDev ? require('cssnano') : noop]
              }
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [{
          loader: 'file-loader',
          options: {
            name: 'images/[name][hash].[ext]'
          }
        }]
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[name][hash].[ext]'
          }
        }
      },
      {
        test: /\.md$/,
        use: [
          {
            loader: 'html-loader'
          },
          {
            loader: 'markdown-loader'
          }
        ]
      }

    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    }),
    ...glob.sync('./src/*.html')
      .map(htmlFile => {
        return new HtmlWebpackPlugin({
          filename: path.basename(htmlFile),
          template: htmlFile,
          favicon: './src/favicon.ico'
        });
      })
  ],
  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false
    })]
  },
  devServer: {
    contentBase: distPath,
    port: getConfig().server.port,
    compress: true,
    open: false,
    historyApiFallback: { index: '/', disableDotRule: true },
    clientLogLevel: 'silent',
    stats: 'errors-only',
    before: (app: Application) => {
      if (isDev) {
        registerDevApi(app);
      }

      createServer(app);
    }
  }
};

module.exports = config;
