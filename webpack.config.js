const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');


module.exports = {
  mode: 'development',
  devServer: {
    open: true,
    port: 3000,
    static: {
      directory: './resource',
      publicPath: '/resource'
    }
  },
  entry: {
    fourdPlayer: './src/react/index.ts'
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
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
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
      template: './src/react/index.html'
    })
  ],
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'build'),
    clean: true
  }
};
