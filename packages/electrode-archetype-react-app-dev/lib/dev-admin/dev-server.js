"use strict";

const ck = require("chalker");
const archetype = require("electrode-archetype-react-app/config/archetype");
const optionalRequire = require("optional-require")(require);
const electrodeServer = optionalRequire("electrode-server");
const Koa = optionalRequire("koa");
const express = optionalRequire("express");

process.env.WEBPACK_DEV_MIDDLEWARE = true;

if (electrodeServer) {
  electrodeServer({
    connections: {
      default: {
        host: archetype.webpack.devHostname,
        port: archetype.webpack.devPort
      }
    },
    plugins: {
      webpackDevHapi: {
        module: "./dev-hapi.js",
        requireFromPath: __dirname
      }
    }
  });
} else if (Koa) {
  const app = new Koa();
  const setup = require("./dev-koa");
  setup(app);
  app.listen(archetype.webpack.devPort, err => {
    if (err) {
      console.error(ck`<red>koa webpack dev server failed</>${err}`);
    } else {
      console.log(
        ck`<green>koa webpack dev server listening on port ${archetype.webpack.devPort}</>`
      );
    }
  });
} else if (express) {
  const app = express();
  const setup = require("./dev-express");
  setup(app);
  app.listen(archetype.webpack.devPort, err => {
    if (err) {
      console.error(ck`<red>express webpack dev server failed</>${err}`);
    } else {
      console.log(
        ck`<green>express webpack dev server listening on port ${archetype.webpack.devPort}</>`
      );
    }
  });
} else {
  console.error(
    ck(`<red>
ERROR: can't find one of electrode-server, express, koa to run dev-server.
</red>`)
  );
}
