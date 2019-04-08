"use strict";

const Path = require("path");
const { babel } = require("electrode-archetype-react-app/config/archetype");
const inspectpack = process.env.INSPECTPACK_DEBUG === "true";
const { target, hasMultiTargets } = babel;

module.exports = {
  output: {
    path: Path.resolve(target !== "default" ? `dist-${target}` : "dist", "js"),
    pathinfo: inspectpack, // Enable path information for inspectpack
    publicPath: "/js/",
    chunkFilename: hasMultiTargets ? `${target}.[hash].[name].js` : "[hash].[name].js",
    filename: hasMultiTargets ? `${target}.[name].bundle.js` : "[name].bundle.[hash].js"
  }
};
