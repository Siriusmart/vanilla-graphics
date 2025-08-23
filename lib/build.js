const fs = require("fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { toHtmlDocument } = require("./convert");
const { bump } = require("./fileHashes");

let metaJSONs = {};

function getMetaJSON(articleName) {
    if (metaJSONs[articleName] != undefined) return metaJSONs[articleName];
    let metaPath = path.join("./meta", "articles", `${articleName}.json`);
    let metaJSON = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    metaJSONs[articleName] = metaJSON;
    return metaJSON;
}

function setMetaJSON(articleName, value) {
    metaJSONs[articleName] = value;
    let metaPath = path.join("./meta", "articles", `${articleName}.json`);
    fs.mkdirSync("./meta/articles", { recursive: true });
    fs.writeFileSync(metaPath, JSON.stringify(value));
}

function unsetMetaJSON(articleName) {
    delete metaJSONs[articleName];

    let metaPath = path.join("./meta", "articles", `${articleName}.json`);
    fs.unlinkSync(metaPath, { force: true });
}

async function buildOne(articleName, params = {}) {
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

    let metaJSON = null;

    try {
        let parsed = getMetaJSON(articleName);
        if (parsed.hash != hashString)
            metaJSON = {
                ...parsed,
                updated: Date.now(),
                hash: hashString,
            };
        else metaJSON = parsed;
    } catch (_) {}

    if (metaJSON == null) {
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

    let res = await toHtmlDocument(fs.readFileSync(entryPath, "utf8"), {
        templateBasePath: "./meta/templates/",
        defaultTemplate: "blank",
        prettyFormat: true,
        articleName,
    });

    if (res[0] == false) return;

    let [html, settings] = res;
    fs.writeFileSync(`./dist/${articleName}/index.html`, html);

    if (metaJSON != null)
        setMetaJSON(articleName, {
            ...metaJSON,
            settings,
            id: articleName,
        });
}

async function build() {
    if (fs.existsSync("./dist")) {
        for (let fileName of fs.readdirSync("./dist")) {
            fs.rmSync(`./dist/${fileName}`, { recursive: true, force: true });
        }
    } else {
        fs.mkdirSync("./dist");
    }

    fs.cpSync("./meta/templates", "./dist/resources/templates", {
        recursive: true,
        filter: (source) => source.split("/")[3] != "node_modules",
    });

    for (let articleName of fs.readdirSync("./src")) {
        await buildOne(articleName);
    }
}

module.exports = {
    build,
    buildOne,
    getMetaJSON,
    setMetaJSON,
    unsetMetaJSON,
};
