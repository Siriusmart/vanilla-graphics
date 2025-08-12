const fs = require("fs");
const path = require("node:path");

function init(projectPath) {
    if (fs.existsSync(path.join(projectPath, "./src"))) {
        console.error(
            "Project has already been initialised, run `npx vanillagraphics build` to build the project.",
        );
    } else {
        require("../lib/init").init(projectPath);
        console.log("Project initialised.");
    }
}

module.exports = { init };
