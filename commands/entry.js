#!/usr/bin/env node
let args = process.argv.slice(2);

let { init } = require("./init");
let { build } = require("./build");
let { serve } = require("./serve");

let projectPath = ".";

switch (args[0]) {
    case undefined:
        serve(projectPath);
        break;
    case "init":
        init(projectPath);
        break;
    case "build":
        build(projectPath);
        break;
    case "serve":
        serve(projectPath);
        break;
    default:
        console.error(`Unknown command ${args[0]}.`);
}
