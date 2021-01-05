"use strict";

module.exports = (base, merge) => {
  const pkg = {
    name: "my-x-app",
    version: "0.0.1",
    description: "Web application using Electrode X",
    homepage: "",
    scripts: {
      dev: "clap -q dev",
      test: "clap check",
      build: "clap build",
      start: "node lib/server"
    },
    author: {
      name: "",
      email: "",
      url: ""
    },
    contributors: [],
    main: "lib/server/index.js",
    keywords: ["electrode", "web"],
    repository: {
      type: "git",
      url: ""
    },
    license: "UNLICENSED",
    engines: {
      node: ">= 10",
      npm: ">= 6"
    },
    dependencies: {
      "@xarc/app": "^8.2.0",
      "@xarc/fastify-server": "^2.0.0",
      "@xarc/react": "^0.1.0",
      "@xarc/react-redux": "^0.1.0"
    },
    devDependencies: {
      "@types/node": "^14.14.6",
      "@xarc/app-dev": "^8.2.0",
      "ts-node": "^9.0.0",
      typescript: "^4.0.3"
    }
  };

  return merge({}, base, pkg);
};
