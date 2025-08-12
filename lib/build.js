const fs = require("fs");
const { createHash } = require("node:crypto");
const { toHtmlDocument } = require("./convert");

function build() {
    if (fs.existsSync("./dist")) {
        for (let fileName of fs.readdirSync("./dist")) {
            fs.rmSync(`./dist/${fileName}`, { recursive: true, force: true });
        }
    } else {
        fs.mkdirSync("./dist");
    }

    fs.cpSync("./meta/templates", "./dist/templates", {
        recursive: true,
    });

    for (let articleName of fs.readdirSync("./src")) {
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

        let hash = createHash("sha256");

        for (let [fileName, content] of fileList.sort()) {
            hash.update(fileName);
            hash.update(content);
        }

        let hashString = hash.digest("hex");
        let metaPath = `./meta/articles/${articleName}.json`;

        let metaJSON;
        if (fs.existsSync(metaPath)) {
            metaJSON = {
                ...JSON.parse(fs.readFileSync(metaPath, "utf8")),
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

        fs.cpSync(`./src/${articleName}`, `./dist/${articleName}`, {
            recursive: true,
        });

        let [html, settings] = toHtmlDocument(
            fs.readFileSync(entryPath, "utf8"),
            {
                templateBasePath: "./meta/templates/",
                defaultTemplate: "blank",
                prettyFormat: true,
            },
        );
        fs.writeFileSync(`./dist/${articleName}/index.html`, html);
        fs.writeFileSync(
            metaPath,
            JSON.stringify({
                ...metaJSON,
                settings,
                id: articleName,
            }),
        );
    }
}

module.exports = {
    build,
};
