const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')
const Dotenv = require('dotenv-webpack')
const envFilePath = process.env.NODE_ENV == 'production' ? 'environment.production.js' : 'environment.staging.js'

module.exports = env => {
  return {
    mode: 'development',
    devtool: 'source-map',
    entry: {
      index: path.resolve(__dirname, './src/js/index.js'),
    },
    resolve: {
      alias: {
        react: path.resolve('./node_modules/react')
      }
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.[name].js',
      publicPath: '/',
      chunkFilename: 'bundle.[name].js',
    },
    plugins: [
      new Dotenv(),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, './src/index.html'),
        favicon: './src/images/favicon.png',
        socketio: 'http://localhost:3333/socket.io/socket.io.js',
      }),
      new webpack.NormalModuleReplacementPlugin(
          /src\/js\/environment\.js/,
          envFilePath
      ),
      /*
      Removed here - we don't want SW caching to interfere with dev
      This line will be in prod though

      new WorkboxPlugin.GenerateSW({
        clientsClaim: true,
        skipWaiting: true
      })
      */
    ],
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
          }
        }
      }
    },
    resolve: {
      symlinks: true,
      extensions: ['*', '.js', '.jsx', '.less', '.scss'],
      alias: {
        "styled-components": path.resolve("./node_modules", "styled-components"),
      }
    },
    devServer:{
      contentBase: path.resolve(__dirname, 'dist'),
      historyApiFallback: true
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: "eslint-loader",
          enforce: "pre",
          options: {}
        },
        {
          test: /.htaccess/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '.htaccess',
              },
            },
          ],
        },
        {
          test: /\.(png|jpe?g|gif)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'images'
              },
            },
          ],
        },
        {
          test: /\.(css)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                  name: "[name].[ext]",
              },
             },
             "extract-loader",
             {
               loader: "css-loader",
               options: {
                 sourceMap: true,
               }
             },
          ],
        },
        {
          test: /\.(woff|woff2|ttf|otf|eot)$/,
          loader: 'file-loader',
          include: [/fonts/],
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts',
          }
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        },
        {
          test: /\.less$/,
          loader: 'style-loader!css-loader!less-loader'
        },
        {
          test: /\.scss$/,
          loader: 'style-loader!css-loader!sass-loader'
        }
      ]
    },
  }
};
