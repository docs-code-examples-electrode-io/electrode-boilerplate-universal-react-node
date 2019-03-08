"use strict";

const Path = require("path");
const { babel } = require("electrode-archetype-react-app/config/archetype");
const inspectpack = process.env.INSPECTPACK_DEBUG === "true";
const { target } = babel;

module.exports = {
  output: {
    path: Path.resolve(target !== "default" ? `dist-${target}` : "dist", "js"),
    pathinfo: inspectpack, // Enable path information for inspectpack
    publicPath: "/js/",
    chunkFilename: `${target}.[hash].[name].js`,
    filename: `${target}-[name].bundle.js`
  }
};
