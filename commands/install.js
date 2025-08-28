async function install(projectPath, args) {
    console.log("Resolving packages");
    await require("../lib/install").install(projectPath, args);
    await require("../lib/install").setupTemplates(projectPath, args);
    console.log("Install task completed.");
}

module.exports = { install };
