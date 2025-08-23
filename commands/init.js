const fs = require("fs");
const path = require("node:path");

let { install } = require("./install");

async function init(projectPath) {
    if (fs.existsSync(path.join(projectPath, "./src"))) {
        console.error("Project has already been initialised.");
    } else {
        require("../lib/init").init(projectPath);
        console.log("Pulling required templates");
        await install(projectPath);
        console.log("Project initialised.");
    }
}

module.exports = { init };
