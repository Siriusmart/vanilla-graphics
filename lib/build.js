const fs = require("fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { toHtmlDocument } = require("./convert");
const { bump } = require("./fileHashes");

function buildOne(articleName, params = {}) {
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

    let hashString = hash.digest("hex");
    let metaPath = `./meta/articles/${articleName}.json`;

    let metaJSON = null;
    if (fs.existsSync(metaPath)) {
        let parsed = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        if (parsed.hash != hashString)
            metaJSON = {
                ...parsed,
                updated: Date.now(),
                hash: hashString,
            };
    } else {
        metaJSON = {
            created: Date.now(),
            updated: Date.now(),
            hash: hashString,
        };
    }

    let entryPath = `./src/${articleName}/index.md`;

    if (!fs.existsSync(entryPath)) {
        fs.writeFileSync(entryPath, "");
    }

    if (params.copyAll ?? true)
        fs.cpSync(`./src/${articleName}`, `./dist/${articleName}`, {
            recursive: true,
        });

    let [html, settings] = toHtmlDocument(fs.readFileSync(entryPath, "utf8"), {
        templateBasePath: "./meta/templates/",
        defaultTemplate: "blank",
        prettyFormat: true,
    });
    fs.writeFileSync(`./dist/${articleName}/index.html`, html);

    if (metaJSON != null)
        fs.writeFileSync(
            metaPath,
            JSON.stringify({
                ...metaJSON,
                settings,
                id: articleName,
            }),
        );
}

function build() {
    if (fs.existsSync("./dist")) {
        for (let fileName of fs.readdirSync("./dist")) {
            fs.rmSync(`./dist/${fileName}`, { recursive: true, force: true });
        }
    } else {
        fs.mkdirSync("./dist");
    }

    fs.cpSync("./meta/templates", "./dist/resources/templates", {
        recursive: true,
    });

    for (let articleName of fs.readdirSync("./src")) {
        buildOne(articleName);
    }
}

module.exports = {
    build,
    buildOne,
};
