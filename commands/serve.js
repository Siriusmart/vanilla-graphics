const fs = require("fs");
const path = require("node:path");

function serve(projectPath) {
    if (!fs.existsSync(path.join(projectPath, "./src"))) {
        console.error(
            "Project has not yet been initialised, run `npx vanillagraphics init` to initialised the project.",
        );
        return;
    }

    console.log("Initial building of project started.");
    let start = Date.now();
    require("../lib/build").build();
    console.log(`Build completed in ${Date.now() - start}ms, watching file changes.`);

    require("../lib/watch").watch(projectPath);
}

module.exports = { serve };
