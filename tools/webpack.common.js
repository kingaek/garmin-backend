const { merge } = require("webpack-merge");
const path = require("path");
const nodeExternals = require("webpack-node-externals");

const parts = require("./webpack.parts");

const CURRENT_WORKING_DIR = process.cwd();

const res = (p) => path.resolve(CURRENT_WORKING_DIR, p);
const entry = res("src/index.js");
const output = res("dest");

module.exports = merge([
  { name: "server" },
  { target: "node" },
  { externals: [nodeExternals()] },
  { entry: [entry] },
  {
    output: {
      path: path.resolve(CURRENT_WORKING_DIR, "dest"),
      path: output,
      publicPath: "/",
    },
  },
  parts.clean(),
  parts.copyFiles(CURRENT_WORKING_DIR),
]);
