"use strict";

/* eslint-disable max-statements, complexity, global-require, no-magic-numbers, no-console */

const assert = require("assert");
const _ = require("lodash");
const HttpStatus = require("./http-status");
const templateRouting = require("./template-routing");
const { errorResponse, updateFullTemplate } = require("./utils");
const {
  utils: { resolveChunkSelector }
} = require("@xarc/index-page");
const HttpStatusCodes = require("http-status-codes");
const { checkSSRMetricsReporting } = require("./utils");

module.exports = function registerRoutes({ routes, topOpts, server }) {
  checkSSRMetricsReporting(topOpts);

  // register routes
  routes.forEach(routeInfo => {
    const { route } = routeInfo;

    const routeOptions = Object.assign(
      {},
      topOpts,
      _.pick(route, ["pageTitle", "bundleChunkSelector", "templateFile", "selectTemplate"])
    );

    routeOptions.uiConfig = _.get(server, "settings.app.config.ui", {});

    assert(
      routeOptions.templateFile,
      `subapp-server: route ${routeInfo.name} must define templateFile`
    );
    updateFullTemplate(routeInfo.dir, routeOptions);

    const chunkSelector = resolveChunkSelector(routeOptions);

    routeOptions.__internals = { chunkSelector };

    const routeHandler = templateRouting.makeRouteTemplateSelector(routeOptions);

    const useStream = routeOptions.useStream !== false;

    const handler = async (request, h) => {
      try {
        const context = await routeHandler({
          useStream,
          mode: "",
          request
        });

        if (context._intercepted) {
          return context._intercepted.responseHandler(request, h, context);
        }

        const data = context.result;
        const status = data.status;

        if (data instanceof Error) {
          throw data;
        }

        if (status === undefined) {
          return h.response(data).type("text/html; charset=UTF-8").code(HttpStatusCodes.OK);
        } else if (HttpStatus.redirect[status]) {
          return h.redirect(data.path);
        } else if (HttpStatus.displayHtml[status]) {
          return h.response(data.html !== undefined ? data.html : data).code(status);
        } else if (status >= 200 && status < 300) {
          return data.html !== undefined ? data.html : data;
        } else {
          return h.response(data).code(status);
        }
      } catch (err) {
        return errorResponse({ routeName: routeInfo.name, request, h, err });
      }
    };

    const defaultMethods = [].concat(route.methods);
    const paths = _.uniq([].concat(route.path, route.paths).filter(x => x)).map(x => {
      if (typeof x === "string") {
        return { [x]: defaultMethods };
      }
      return x;
    });

    paths.forEach(pathObj =>
      _.each(pathObj, (method, path) => {
        server.route(
          Object.assign({}, route.options, {
            path,
            method,
            handler: handler
          })
        );
      })
    );
  });
};
