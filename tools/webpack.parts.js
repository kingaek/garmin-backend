const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const NodemonPlugin = require("nodemon-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const CopyPlugin = require("copy-webpack-plugin");

const APP_SOURCE = path.join(__dirname, "src");

exports.loadJavaScript = () => ({
  module: {
    rules: [
      {
        test: /\.js$/,
        include: APP_SOURCE, // Consider extracting as a parameter
        exclude: /node_modules/,
        use: "babel-loader",
      },
    ],
  },
});

exports.clean = () => ({
  plugins: [new CleanWebpackPlugin()],
});

exports.generateSourceMaps = ({ type }) => ({
  devtool: type,
});

exports.NodemonPlugin = (options) => ({
  plugins: [new NodemonPlugin(options)],
});

exports.environmentVariables = (options) => ({
  plugins: [new Dotenv(options)],
});

exports.copyFiles = (currentDir) => ({
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(currentDir, "src", "schema.graphql"),
          to: path.resolve(currentDir, "dest"),
        },
      ],
    }),
  ],
});
