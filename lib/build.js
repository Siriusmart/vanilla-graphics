const fs = require("fs");
const { createHash } = require("node:crypto");
const { toHtmlDocument } = require("./convert");

function build() {
    if (fs.existsSync("./dist")) {
        for (let fileName of fs.readdirSync("./dist")) {
            fs.unlinkSync(`./dist/${fileName}`);
        }
    } else {
        fs.mkdirSync("./dist");
    }

    for (let articleName of fs.readdirSync("./src")) {
        let fileList = [];

        function readDirRecursive(path, runningPath = []) {
            let filePath = runningPath.concat([path]).join("/");
            if (fs.lstatSync(path).isFile()) {
                fileList.push([filePath, fs.readFileSync(filePath)]);
            } else {
                readDirRecursive(path, runningPath.concat([path]));
            }
        }

        readDirRecursive(`./src/${articleName}`);

        let hash = createHash("sha256");

        for (let [fileName, content] of fileList.sort()) {
            hash.update(fileName);
            hash.update(content);
        }

        let hashString = hash.digest("hex");
        let metaPath = `./meta/articles/${articleName}.json`;

        if (fs.existsSync(metaPath)) {
            let metaJSON = JSON.parse(fs.readFileSync(metaPath, "utf8"));
            if (metaJSON.hash != hashString) {
                fs.writeFileSync(
                    metaPath,
                    JSON.stringify({
                        updated: Date.now(),
                        hash: hashString,
                        ...metaJSON,
                    }),
                );
            }
        } else {
            fs.writeFileSync(
                metaPath,
                JSON.stringify({
                    created: Date.now(),
                    updated: Date.now(),
                    hash: hashString,
                }),
            );
        }

        let entryPath = `./src/${articleName}/index.md`;

        if (!fs.existsSync(entryPath)) {
            fs.writeFileSync(entryPath, "");
        }

        fs.cpSync(`./src/${articleName}`, `./dist/${articleName}`, {
            recursive: true,
        });

        let html = toHtmlDocument(fs.readFileSync(entryPath, "utf8"), {
            templateBasePath: "./meta/templates/",
            defaultTemplate: "blank",
        });
        fs.writeFileSync(`./dist/${articleName}/index.html`, html);
    }
}

build();
