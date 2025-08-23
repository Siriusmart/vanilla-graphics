const path = require("node:path");
const remarkParse = require("remark-parse").default;
const remarkRehype = require("remark-rehype").default;
const rehypeStringify = require("rehype-stringify").default;
const unified = require("unified").unified;
const { JSDOM } = require("jsdom");
const yaml = require("js-yaml");
const pretty = require("pretty");
const fs = require("fs");

let templates = {};

function md2Html(markdownContent) {
    return String(
        unified()
            .use(remarkParse)
            .use(remarkRehype, { allowDangerousHtml: true })
            .use(rehypeStringify, { allowDangerousHtml: true })
            .processSync(markdownContent),
    );
}

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

async function toHtmlDocument(markdownContent, params = {}) {
    try {
        return await toHtmlDocumentInternal(markdownContent, params);
    } catch (e) {
        console.error(
            `[ERROR] Build failed for article ${params.articleName ?? "Unspecified name"}`,
        );
        console.error(e);
        return [false, e];
    }
}

async function toHtmlDocumentInternal(markdownContent, params = {}) {
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
        let templatePath = `${params.templateBasePath}${templateName}/template.html`;
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

    let customHTML = await template.toHTML(markdownContent, {
        md2Html,
        unified,
        remarkParse,
        rehypeStringify,
        remarkRehype,
    });

    switch (typeof customHTML) {
        case "undefined":
            break;
        case "string":
            frontFragment = new JSDOM(customHTML);
            break;
        case "object":
            frontFragment = customHTML;
            break;
        default:
            throw new Error(
                `Bad return type ${typeof customHTML} for template.toHTML()`,
            );
    }

    dom.window.document.getElementById("front").innerHTML +=
        frontFragment.window.document.body.innerHTML;

    dom.window.document
        .querySelectorAll("pre code.language-settings")
        .forEach((elem) => {
            let settings = yaml.load(elem.innerHTML) ?? {};
            info = settings;
        });

    while (template.postProcess({ dom, md2Html }));

    return [
        params.prettyFormat ? pretty(dom.serialize()) : dom.serialize(),
        info,
    ];
}

function toHtmlFragment(markdownContent, params = {}) {
    let naiveHtml = md2Html(markdownContent);
    let dom = new JSDOM(naiveHtml);

    params.serialize ??= true;

    if (!params.serialize) return dom;

    params.prettyFormat ??= true;

    return params.prettyFormat
        ? pretty(dom.window.document.body.innerHTML)
        : dom.window.document.body.innerHTML;
}

module.exports = {
    toHtmlDocument,
    toHtmlFragment,
};
