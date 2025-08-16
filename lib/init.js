const fs = require("fs");
const path = require("node:path");

function init(dest) {
    fs.cpSync(path.join(__dirname, "../project"), dest, {
        recursive: true,
    });
}

module.exports = {
    init,
};
