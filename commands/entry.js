#!/usr/bin/env node
let args = process.argv.slice(2);

let fs = require("fs");

let { init } = require("./init");
let { build } = require("./build");
let { serve } = require("./serve");
let { install } = require("./install");
let { setupTemplates } = require("../lib/install.js");

(async () => {
    let projectPath = ".";

    if (
        args[0] != "install" &&
        fs.existsSync("./site.json") &&
        !fs.existsSync("./meta/templates")
    ) {
        console.log("Pulling required templates");
        await install(projectPath);
    }

		await setupTemplates(projectPath);

    switch (args[0]) {
        case undefined:
            await serve(projectPath);
            break;
        case "init":
            await init(projectPath);
            break;
        case "build":
            await build(projectPath);
            break;
        case "serve":
            await serve(projectPath);
            break;
        case "install":
            await install(projectPath, ...args.slice(1));
            break;
        default:
            console.error(`Unknown command ${args[0]}.`);
    }
})();
