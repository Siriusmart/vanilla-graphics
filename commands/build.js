const fs = require("fs");
const path = require("node:path");

function build(projectPath) {
    if (!fs.existsSync(path.join(projectPath, "./src")))
        require("./init").init(projectPath);

    console.log("Building of project started.");
    let start = Date.now();
    require("../lib/build").build();
    console.log(`Build completed in ${Date.now() - start}ms.`);
}

module.exports = { build };
