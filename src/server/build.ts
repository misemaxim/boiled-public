import webpack from 'webpack';
import path from 'path';
import nodeExternals from 'webpack-node-externals';
import system from '../../package.json';

const distPath = path.resolve('./build/src');
const config = {
  target: 'node',
  entry: {
    main: './src/server/index.ts'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      { test: /\.js$/, loader: 'babel-loader' },
      { test: /\.ts?$/, loader: 'ts-loader' }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(system.version)
    })
  ],
  output: {
    filename: 'index.js',
    path: distPath
  },
  externalsPresets: { node: true },
  externals: [nodeExternals()]
};

module.exports = config;
