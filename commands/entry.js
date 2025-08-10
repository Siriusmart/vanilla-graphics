#!/usr/bin/env node
const fs = require("fs");
let args = process.argv.slice(2);

function build() {
    if (fs.existsSync("./src")) {
        console.log("Building of project started.");
        let start = Date.now();
        require("../lib/build").build();
        console.log(`Build completed in ${Date.now() - start}ms.`);
    } else {
        console.error(
            "Project has not yet been initialised, run `npx vanillagraphics init` to initialised the project.",
        );
    }
}

function init() {
    if (fs.existsSync("./src")) {
        console.error(
            "Project has already been initialised, run `npx vanillagraphics build` to build the project.",
        );
    } else {
        require("../lib/init").init();
        console.log("Project initialised.");
    }
}

switch (args[0]) {
    case undefined:
        const fs = require("fs");
        if (fs.existsSync("./src")) build();
        else init();
        break;
    case "init":
        init();
        break;
    case "build":
        build();
        break;
    default:
        console.error(`Unknown command ${args[0]}.`);
}
