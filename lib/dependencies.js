const fs = require("fs");

let localManifests = {};

if (fs.existsSync("./meta/templates"))
    for (let templateName of fs.readdirSync("./meta/templates")) {
        let manifestPath = `./meta/templates/${templateName}/template.json`;
        if (!fs.existsSync(manifestPath)) continue;

        localManifests[templateName] = JSON.parse(
            fs.readFileSync(manifestPath, "utf8"),
        );
    }

let deps = {};

function getDeps(packageName) {
    if (deps[packageName]) return deps[packageName];

    if (localManifests[packageName] == undefined)
        throw new Error(`No such package ${packageName}.`);

    let resolvedDependencies = [];

    for (let dep of localManifests[packageName].dependencies) {
        resolvedDependencies = resolvedDependencies.concat(getDeps(dep));
    }

    let set = new Set();
    let out = [];

    for (let dep of resolvedDependencies.reverse()) {
        if (set.has(dep)) continue;

        set.add(dep);
        out.push(dep);
    }

    deps[packageName] = out;
    return out;
}

module.exports = {
    getDeps,
};
