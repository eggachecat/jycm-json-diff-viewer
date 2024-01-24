// production config
const { merge } = require("webpack-merge");
const { resolve } = require("path");

const commonConfig = require("./common");

module.exports = merge(commonConfig, {
  mode: "production",
  output: {
    filename: "js/bundle.[contenthash].min.js",
    path: resolve(__dirname, "../../docs"),
    publicPath: "/jycm-json-diff-viewer/",
  },
  devtool: "source-map",
  plugins: [],
});
