const { createHash } = require("node:crypto");
const path = require("node:path");

let fileHashes = {};

function bump(fileName, content) {
    fileName = path.normalize(fileName);
    let fileHash = createHash("md5");
    fileHash.update(content);
    let newHash = fileHash.digest("hex");

    if (newHash == fileHashes[fileName]) return false;
    fileHashes[fileName] = newHash;
    return true;
}

function rmHash(fileName) {
    fileName = path.normalize(fileName);
    delete fileHashes[fileName];
}

module.exports = { bump, rmHash };
