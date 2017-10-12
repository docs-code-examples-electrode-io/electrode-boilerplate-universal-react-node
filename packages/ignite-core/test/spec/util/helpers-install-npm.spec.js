"use strict";

const npmInstall = require("../../../lib/util/helpers").npmInstall;
const expect = require("chai").expect;
const Promise = require("bluebird");

const xsh = require("xsh");
const sinon = require("sinon");
const checkModule = require("../../../lib/util/check-module");
const logger = require("../../../lib/util/logger.js");

xsh.Promise = Promise;

describe("npmInstall", function() {
  let logs = [];
  let execStub;
  let logStub;
  let latestStub;

  function makeLatestStub(resolve) {
    const mockVersion = "hello";
    if (resolve) {
      latestStub = sinon.stub(checkModule, "latest").callsFake(() => {
        return Promise.resolve(mockVersion);
      });
    } else {
      latestStub = sinon.stub(checkModule, "latest").callsFake(() => {
        const error = new Error("blah");
        error.output = { stdout: "{}\n" };
        return Promise.reject(error);
      });
    }
  }

  function makeExecStub(resolve) {
    if (resolve) {
      execStub = sinon.stub(xsh, "exec").returns(Promise.resolve());
    } else {
      execStub = sinon.stub(xsh, "exec").callsFake(() => {
        const error = new Error("blah");
        error.output = { stdout: "{}\n" };
        return Promise.reject(error);
      });
    }
  }

  beforeEach(() => {
    logStub = sinon.stub(logger, "log").callsFake(msg => logs.push(msg));
  });

  afterEach(() => {
    logStub.restore();
  });

  it("should install globally if flag is true", () => {
    logs = [];
    makeLatestStub(true);
    makeExecStub(true);
    expect(npmInstall).to.exist;
    npmInstall(undefined, "1.0.0", true).then(() => {
      expect(logs[0]).includes(
        "You've successfully installed the latest undefined@hello globally"
      );
      latestStub.restore();
      execStub.restore();
    });
  });

  it("should show error message when unable to check result of npm install", () => {
    logs = [];
    makeLatestStub(false);
    makeExecStub(true);
    npmInstall(undefined, "1.0.0", true).then(() => {
      expect(logs[0]).includes(
        "Unable to check result of npm install of undefined@1.0.0 globally"
      );
      expect(logs[1]).includes("Error was:");
      latestStub.restore();
      execStub.restore();
    });
  });

  it("should show error message if it's npm issue", () => {
    let error;
    makeExecStub(false);
    npmInstall(undefined, "1.0.0", false)
      .catch(err => (error = err))
      .then(() => {
        expect(error).to.exist;
      })
      .finally(() => {
        execStub.restore();
      });
  });
});
