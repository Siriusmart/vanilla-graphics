const fs = require("fs");
const path = require("node:path");
const liveServer = require("live-server");

async function serve(projectPath) {
    if (!fs.existsSync(path.join(projectPath, "./src")))
        await require("./init").init(projectPath);

    console.log("Initial building of project started.");
    let start = Date.now();
    await require("../lib/build").build();
    console.log(
        `Build completed in ${Date.now() - start}ms, watching file changes.`,
    );

    console.log("Started development server.")

    let params = {
        port: 8000,
        host: "0.0.0.0",
        root: "./dist",
        open: true,
        wait: 0,
        logLevel: 0,
    };

    liveServer.start(params);
    await require("../lib/watch").watch(projectPath);
}

module.exports = { serve };
