const fs = require("fs");
const path = require("node:path");

function build(projectPath) {
    if (fs.existsSync(path.join(projectPath, "./src"))) {
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

module.exports = { build };
