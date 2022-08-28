const { merge } = require("webpack-merge");

const commonConfig = require("./webpack.common");

const productionConfig = merge([commonConfig, { mode: "production" }]);

module.exports = productionConfig;
