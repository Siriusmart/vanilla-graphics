// const pLimit = require("p-limit").default;
// const limit = pLimit(8);

const fs = require("fs");
const download = require("download");
const decompress = require("decompress");

const repo =
    "https://raw.githubusercontent.com/Siriusmart/vanilla-graphics-templates/refs/heads/master";

async function resolve(
    packageName,
    checkedSet,
    toInstallSet,
    remoteIndex,
    localManifests,
) {
    if (checkedSet.has(packageName) || remoteIndex[packageName] == undefined)
        return;

    let res = await fetch(`${repo}/packages/${packageName}/template.json`);
    let remoteManifest = await res.json();

    let remoteVersion = remoteManifest.version
        .split(".")
        .map((s) => parseInt(s));
    let localVersion =
        localManifests[packageName] == undefined
            ? [0]
            : localManifests[packageName].version
                  .split(".")
                  .map((s) => parseInt(s));

    if (remoteVersion > localVersion) {
        toInstallSet.add(packageName);
    }

    checkedSet.add(packageName);
}

async function install(_projectPath, ...packagesToInstall) {
    let localManifests = {};

    if (fs.existsSync("./meta/templates"))
        for (let packageName of fs.readdirSync("./meta/templates")) {
            localManifests[packageName] = JSON.parse(
                fs.readFileSync(
                    `./meta/templates/${packageName}/template.json`,
                    "utf8",
                ),
            );
        }

    let res = await fetch(`${repo}/index.json`);
    let remoteIndex = await res.json();

    let checkedSet = new Set();
    let toInstallSet = new Set();

    for (let packageName of Object.keys(localManifests).concat(
        packagesToInstall,
    )) {
        await resolve(
            packageName,
            checkedSet,
            toInstallSet,
            remoteIndex,
            localManifests,
        );
    }

    for (let packageName of Array.from(toInstallSet)) {
        if (fs.existsSync(`./meta/templates/${packageName}/.git`)) {
            console.warn(
                `${packageName} is a Git repository, this package will not be updated`,
            );
            continue;
        }

        console.log(`Installing ${packageName}`);
        let buffer = await download(
            `${repo}/packages/${packageName}/releases/${remoteIndex[packageName].version}.zip`,
        );
        fs.rmSync(`./meta/templates/${packageName}`, {
            recursive: true,
            force: true,
        });
        decompress(buffer, `./meta/templates/${packageName}`, { strip: 1 });
    }
}

module.exports = { install };
