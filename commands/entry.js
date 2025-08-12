#!/usr/bin/env node
let path = require("node:path");

let args = process.argv.slice(2);

let { init } = require("./init");
let { build } = require("./build");
let { serve } = require("./serve");

let projectPath = ".";

switch (args[0]) {
    case undefined:
        const fs = require("fs");
        if (fs.existsSync(path.join(projectPath, "./src"))) build(projectPath);
        else init(projectPath);
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
