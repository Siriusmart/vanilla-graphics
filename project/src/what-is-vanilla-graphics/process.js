const path = require("node:path");
const { Template } = require(path.join(__dirname, "lib/template"));

class BlankTemplate extends Template {}

module.exports = BlankTemplate;
