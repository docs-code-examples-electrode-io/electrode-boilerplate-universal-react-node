"use strict";

/* eslint-disable quotes */

const Promise = require("bluebird");
const assign = require("object-assign");
const electrodeServer = require("electrode-server");

describe("Test electrode-react-webapp", () => {
  let config;
  let configOptions;
  let paths;

  const getConfig = () => {
    return {
      plugins: {
        "./lib/hapi/index": {
          options: {
            pageTitle: "Electrode App",
            paths: {
              "/{args*}": {
                view: "index",
                content: {
                  status: 200,
                  html: "<div>Hello Electrode</div>",
                  prefetch: "console.log('Hello');"
                }
              }
            }
          }
        }
      }
    };
  };

  beforeEach(() => {
    config = getConfig();
    configOptions = config.plugins["./lib/hapi/index"].options;
    paths = configOptions.paths["/{args*}"];
  });

  const stopServer = server =>
    new Promise((resolve, reject) =>
      server.stop(stopErr => {
        return stopErr ? reject(stopErr) : resolve();
      })
    );

  it("should successfully render to static markup", () => {
    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain("<title>Electrode App</title>");
          expect(res.result).to.contain("<div>Hello Electrode</div>");
          expect(res.result).to.contain("<script>console.log('Hello');</script>");
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should successfully render to static markup with content as a function", () => {
    assign(paths, {
      content: () =>
        Promise.resolve({
          status: 200,
          html: "<div>Hello Electrode</div>",
          prefetch: "console.log('Hello');"
        })
    });

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain("<title>Electrode App</title>");
          expect(res.result).to.contain("<div>Hello Electrode</div>");
          expect(res.result).to.contain("<script>console.log('Hello');</script>");
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should return error", () => {
    assign(paths, {
      content: () =>
        Promise.reject({
          status: 500,
          message: "Internal server error"
        })
    });

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/"
        })
        .then(res => {
          expect(res.statusCode).to.equal(500);
          expect(res.statusMessage).to.equal("Internal Server Error");
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should handle multiple entry points - foo", () => {
    configOptions.bundleChunkSelector = "test/data/chunk-selector.js";
    configOptions.stats = "test/data/stats-test-multibundle.json";

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/foo"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain("foo.bundle.f07a873ce87fc904a6a5.js");
          expect(res.result).to.contain("foo.style.f07a873ce87fc904a6a5.css");
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should handle multiple entry points - bar", () => {
    configOptions.bundleChunkSelector = "test/data/chunk-selector.js";
    configOptions.stats = "test/data/stats-test-multibundle.json";

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/bar"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain("bar.bundle.f07a873ce87fc904a6a5.js");
          expect(res.result).to.contain("bar.style.f07a873ce87fc904a6a5.css");
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should handle multiple entry points with a prodBundleBase", () => {
    configOptions.prodBundleBase = "http://awesome-cdn.com/multi/";
    configOptions.bundleChunkSelector = "test/data/chunk-selector.js";
    configOptions.stats = "test/data/stats-test-multibundle.json";

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/bar"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain(
            `<script src="http://awesome-cdn.com/multi/bar.bundle.f07a873ce87fc904a6a5.js"`
          );
          expect(res.result).to.contain(
            `<link rel="stylesheet" href="http://awesome-cdn.com/multi/bar.style.f07a873ce87fc904a6a5.css"`
          );
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should handle multiple entry points - default", () => {
    configOptions.bundleChunkSelector = "test/data/chunk-selector.js";
    configOptions.stats = "test/data/stats-test-multibundle.json";

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain("bundle.f07a873ce87fc904a6a5.js");
          expect(res.result).to.contain("style.f07a873ce87fc904a6a5.css");
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should inject a pwa manfiest", () => {
    configOptions.stats = "test/data/stats-test-pwa.json";

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain('<link rel="manifest" href="/js/manifest.json" />');
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should inject a pwa manfiest in dev mode", () => {
    configOptions.stats = "test/data/stats-test-pwa.json";
    configOptions.webpackDev = true;

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain(
            '<link rel="manifest" href="http://127.0.0.1:2992/js/manifest.json" />'
          );
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should inject a pwa manfiest with a prodBundleBase", () => {
    configOptions.prodBundleBase = "http://awesome-cdn.com/subdir/";
    configOptions.stats = "test/data/stats-test-pwa.json";

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain(
            '<link rel="manifest" href="http://awesome-cdn.com/subdir/manifest.json" />'
          );
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should inject pwa icons", () => {
    configOptions.iconStats = "test/data/icon-stats-test-pwa.json";

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain('<meta name="mobile-web-app-capable" content="yes">');
          expect(res.result).to.contain('<meta name="application-name" content="Electrode">');
          expect(res.result).to.contain('<link rel="icon" href="/js/favicon-32x32.png">');
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should inject critical css", () => {
    configOptions.criticalCSS = "test/data/critical.css";

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain("<style>body {color: green;}\n</style>");
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should inject a script reference with a provided prodBundleBase", () => {
    configOptions.prodBundleBase = "http://awesome-cdn.com/myapp/";
    configOptions.stats = "test/data/stats-test-one-bundle.json";

    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain(
            '<script src="http://awesome-cdn.com/myapp/bundle.f07a873ce87fc904a6a5.js">'
          );
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });

  it("should inject from unbundledJS enterHead", () => {
    configOptions.prodBundleBase = "http://awesome-cdn.com/myapp/";
    configOptions.stats = "test/data/stats-test-one-bundle.json";

    config.plugins["./lib/hapi/index"].options.unbundledJS = {
      enterHead: [`console.log("test-unbundledJS-enterHead")`, { src: "test-enter-head.js" }]
    };
    return electrodeServer(config).then(server => {
      return server
        .inject({
          method: "GET",
          url: "/"
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.contain(
            '<script src="http://awesome-cdn.com/myapp/bundle.f07a873ce87fc904a6a5.js">'
          );
          expect(res.result).to.contain("test-unbundledJS-enterHead");
          stopServer(server);
        })
        .catch(err => {
          stopServer(server);
          throw err;
        });
    });
  });
});
