const path = require("node:path");
const remarkHtml = require("remark-html").default;
const remarkParse = require("remark-parse").default;
const unified = require("unified").unified;
const { JSDOM } = require("jsdom");
const yaml = require("js-yaml");
const pretty = require("pretty");
const fs = require("fs");

let templates = {};

function getTemplateObject(templateBasePath, templateName) {
    let template = templates[templateName];

    if (template == undefined) {
        let processPath1 = `${templateBasePath}${templateName}/template.js`;
        if (fs.existsSync(processPath1)) {
            let templateClass = require(path.join(process.cwd(), processPath1));
            template = templates[templateName] = new templateClass();
        }
    }

    if (template == undefined) {
        let processPath2 = `${templateBasePath}${templateName}/template/index.js`;
        if (fs.existsSync(processPath2)) {
            let templateClass = require(path.join(process.cwd(), processPath2));
            template = templates[templateName] = new templateClass();
        }
    }

    if (template == undefined) {
        throw new Error(`Missing process.js for ${templateName}`);
    }

    return template;
}

function toHtmlDocument(markdownContent, params = {}) {
    let dom = null;
    let info = {};

    let frontFragment = toHtmlFragment(markdownContent, {
        serialize: false,
    });

    let priorities = [];
    params.templateBasePath ??= "";
    frontFragment.window.document
        .querySelectorAll("pre code.language-settings")
        .forEach((elem) => {
            let settings = yaml.load(elem.innerHTML) ?? {};
            if (settings.template) priorities.push(settings.template);
        });
    if (params.defaultTemplate) priorities.push(params.defaultTemplate);

    let template;

    for (let templateName of priorities) {
        let templatePath = `${params.templateBasePath}${templateName}/index.html`;
        if (
            fs.existsSync(templatePath) &&
            fs.lstatSync(templatePath).isFile()
        ) {
            dom = new JSDOM(fs.readFileSync(templatePath, "utf8"));
            template = getTemplateObject(params.templateBasePath, templateName);
            break;
        }
    }

    if (dom == null) throw new Error("No template specifed at all.");

    dom.window.document.getElementById("front").innerHTML =
        frontFragment.window.document.body.innerHTML;

    dom.window.document
        .querySelectorAll("pre code.language-settings")
        .forEach((elem) => {
            let settings = yaml.load(elem.innerHTML) ?? {};
            info = settings;
        });

    template.postProcess(dom);

    return [
        params.prettyFormat
            ? pretty(dom.serialize(), { ocd: true })
            : dom.serialize(),
        info,
    ];
}

function toHtmlFragment(markdownContent, params = {}) {
    let naiveHtml = String(
        unified()
            .use(remarkParse)
            .use(remarkHtml, { sanitize: false })
            .processSync(markdownContent),
    );
    let dom = new JSDOM(naiveHtml);

    params.serialize ??= true;

    if (!params.serialize) return dom;

    params.prettyFormat ??= true;

    return params.prettyFormat
        ? pretty(dom.window.document.body.innerHTML, { ocd: true })
        : dom.window.document.body.innerHTML;
}

module.exports = {
    toHtmlDocument,
    toHtmlFragment,
};
