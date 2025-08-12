const { createHash } = require("node:crypto");
const path = require("node:path");
const fs = require("fs");
const { bump } = require("./fileHashes");
const { buildOne } = require("./build");

function getArticleHashString(articleName) {
    let fileList = [];

    function readDirRecursive(path, runningPath = []) {
        let filePath = runningPath.concat([path]).join("/");
        if (fs.lstatSync(filePath).isFile()) {
            fileList.push([filePath, fs.readFileSync(filePath)]);
        } else {
            for (let fileName of fs.readdirSync(filePath)) {
                readDirRecursive(fileName, runningPath.concat([path]));
            }
        }
    }

    readDirRecursive(articleName, [".", "src"]);

    let hash = createHash("md5");

    for (let [fileName, content] of fileList.sort()) {
        fileName = path.normalize(fileName);
        bump(fileName, content);
        hash.update(fileName);
        hash.update(content);
    }

    return hash.digest("hex");
}

function bumpArticleHashString(articleName) {
    let hashString = getArticleHashString(articleName);
    let metaPath = path.join("./meta", "articles", `${articleName}.json`);

    if (!fs.existsSync(metaPath)) return buildOne(articleName);

    let metaJSON = JSON.parse(fs.readFileSync(metaPath, "utf8"));

    if (hashString == metaJSON.hash) return;

    fs.writeFile(
        metaPath,
        JSON.stringify({
            ...metaJSON,
            updated: Date.now(),
            hash: hashString,
        }),
        {},
        () => {},
    );
}

module.exports = { getArticleHashString, bumpArticleHashString };
