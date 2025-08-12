const fs = require("fs");
const path = require("node:path");
const { bump, rmHash } = require("./fileHashes");
const { toHtmlDocument } = require("./convert");
const { bumpArticleHashString } = require("./hasher");
const { buildOne } = require("./build");

function watch(projectPath) {
    fs.watch(
        path.join(projectPath, "./src"),
        { recursive: true },
        (type, file) => {
            let sourcePath = path.join(projectPath, "./src", file);
            let destPath = path.join(projectPath, "./dist", file);
            let [articleName, fileName] = file.split("/");
            let metaPath = path.join(
                projectPath,
                "./meta",
                "articles",
                `${articleName}.json`,
            );

            switch (type) {
                case "rename":
                    if (
                        fs.existsSync(
                            path.join(projectPath, "./src", articleName),
                        )
                    ) {
                        bumpArticleHashString(articleName);
                    } else {
                        fs.rm(metaPath, () => {});
                    }

                    if (fs.existsSync(sourcePath)) {
                        console.log(`+ ${file}`);
                        fs.cp(
                            sourcePath,
                            destPath,
                            { recursive: true },
                            () => {},
                        );
                        if (fs.lstatSync(sourcePath).isFile())
                            bump(sourcePath, fs.readFileSync(sourcePath));

                        if (fileName != "README.md") return;

                        let html = toHtmlDocument(
                            fs.readFileSync(sourcePath, "utf8"),
                        );
                        fs.writeSync(
                            path.join(
                                projectPath,
                                "./dist",
                                articleName,
                                "index.html",
                            ),
                            html,
                        );
                    } else {
                        console.log(`- ${file}`);
                        fs.rm(destPath, { recursive: true }, () => {});
                        rmHash(sourcePath);
                    }
                    break;
                case "change":
                    let content = fs.readFileSync(sourcePath);
                    if (!bump(sourcePath, content)) return;

                    console.log(`~ ${file}`);
                    fs.cp(sourcePath, destPath, { recursive: true }, () => {});

                    if (fileName == "index.md")
                        buildOne(articleName, { copyAll: false });
            }
        },
    );
}

module.exports = { watch };
