const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  devServer: {
    open: true,
    port: 5500
  },
  entry: {
    fourdRecPlayer: './src/index.ts',
    test: './src/test.ts'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all'
        },
        external: {
          name: 'external',
          test: /[\\/]src[\\/]external.*/,
          chunks: 'all'
        }
      }
    }
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: ['public']
    }),
    new HtmlWebpackPlugin({
      template: './public/test-template.html'
    })
  ],
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  }
};
