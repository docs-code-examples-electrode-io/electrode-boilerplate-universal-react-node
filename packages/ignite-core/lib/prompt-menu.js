"use strict";

/* eslint-disable no-console, no-magic-numbers */

const xsh = require("xsh");
const chalk = require("chalk");
const readline = require("readline");
const _ = require("lodash");
const EventEmitter = require("events");
const Promise = require("bluebird");
const helpers = require("./util/helpers");
const Yargs = require("yargs");
const logger = require("./util/logger");

xsh.Promise = Promise;

class PromptMenu extends EventEmitter {
  constructor(options) {
    super();

    this._title = options.title;
    this._menu = options.menu;
    this._exitCb = options.exitCb || process.exit;
    this._output = options.output || console.log;
    this._progName = options.progName || "ignite";
    this._clap = false;

    const refresh = () => {
      if (this._idle) {
        this._output("");
        this.show();
      }
    };

    this.on("exit", () => {
      this._exit = true;
      setTimeout(() => this._exitCb(0), 10);
    });

    this.on("done", () => {
      this._exit = true;
    });

    this.on("refresh", refresh);

    this.on("skip_prompt", () => {
      this._skipPrompt = true;
    });

    this.on("prompt", () => {
      this.prompt();
    });
  }

  getRL() {
    if (this.rl) {
      this.rl.close();
    }
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    return this.rl;
  }

  closeRL() {
    if (this.rl) {
      this.rl.close();
      this.rl = undefined;
    }
  }

  prompt() {
    this.getRL().question("Please select your option: ", answer => {
      this._output("You choose", answer);
      this.closeRL();
      const choice = parseInt(answer);
      if (choice >= 1 && choice <= this._menu.length) {
        this.runMenuItem(this._menu[choice - 1]);
      } else {
        this.show();
      }
    });
  }

  show() {
    this.closeRL();
    this._skipPrompt = false;
    const colors = ["magenta", "green"];

    _.each(this._menu, mi => {
      mi.emit("pre_show", { menu: this });
    });

    if (this._skipPrompt) return;
    const dashedLines = `---------------------------------------------------------`;
    this._output(chalk.blueBright(dashedLines));
    this._output(chalk.blueBright(this._title));
    this._output(chalk.blueBright(dashedLines));

    _.each(this._menu, (mi, x) => {
      const icon = mi.icon || "";
      this._output(chalk[colors[x % 2]](`[${x + 1}] ${icon} ${mi.menuText}`));
      mi.index = x + 1;
      mi.emit("show", { menu: this });
    });
    this._output(chalk.blueBright(dashedLines));

    this._idle = true;

    this.prompt();

    _.each(this._menu, mi => {
      mi.emit("post_show", { menu: this });
    });
  }

  clap(argv) {
    this._clap = true;
    return _.reduce(
      this._menu,
      (yargs, mi) => {
        if (!mi.cliCmd) return yargs;

        const menuText = chalk.cyan(mi.menuText);
        return yargs.command({
          command: mi.cliCmd,
          desc: menuText,
          aliases: mi.cliAliases,
          handler: () => {
            logger.log(`Running ${menuText}`);
            return this.runMenuItem(mi);
          }
        });
      },
      Yargs
    )
      .help()
      .usage(`Usage: ${this._progName} <command>`)
      .parse(argv);
  }

  runMenuItem(item) {
    this._idle = false;

    const spinner = item.spinnerTitle
      ? helpers.makeSpinner(item.spinnerTitle)
      : { start: _.noop, stop: _.noop };

    spinner.start();
    item.emit("pre_execute");
    return Promise.try(() => item.execute({ menu: this }))
      .then(() => {
        spinner.stop();
        item.emit("post_execute");
        if (!this._exit && !this._clap) {
          this.show();
        }
      })
      .finally(() => spinner.stop());
  }
}

module.exports = PromptMenu;
