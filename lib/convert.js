const remarkHtml = require("remark-html").default;
const remarkParse = require("remark-parse").default;
const unified = require("unified").unified;
const { JSDOM } = require("jsdom");
const yaml = require("js-yaml");
const pretty = require("pretty");
const fs = require("fs");

function toHtmlDocument(markdownContent, params = {}) {
    let dom = null;
    if (params.template) {
        dom = new JSDOM(htmlTemplate);
    } else if (params.templatePath) {
        if (!fs.existsSync(params.templatePath))
            throw new Error(
                `Template path ${params.templatePath} does not exist.`,
            );
        dom = new JSDOM(fs.readFileSync(params.templatePath, "utf8"));
    }

    let frontFragment = toHtmlFragment(markdownContent, {
        serialize: false,
    });

    if (dom == null) {
        let priorities = [];
        params.templateBasePath ??= "";
        frontFragment.window.document
            .querySelectorAll("pre code.language-settings")
            .forEach((elem) => {
                let settings = yaml.load(elem.innerHTML) ?? {};

                if (settings.template)
                    priorities.push(
                        `${params.templateBasePath}${settings.template}.html`,
                    );
                if (settings.template)
                    priorities.push(
                        `${params.templateBasePath}${settings.template}/index.html`,
                    );
            });
        if (params.defaultTemplate)
            priorities.push(
                `${params.templateBasePath}${params.defaultTemplate}/index.html`,
            );

        for (let path of priorities) {
            if (fs.existsSync(path) && fs.lstatSync(path).isFile()) {
                dom = new JSDOM(fs.readFileSync(path, "utf8"));
                break;
            }
        }
    }

    if (dom == null) throw new Error("No template specifed at all.");

    dom.window.document.getElementById("front").innerHTML =
        frontFragment.window.document.body.innerHTML;

    dom.window.document
        .querySelectorAll("pre code.language-anchor")
        .forEach((elem) => {
            let anchors = yaml.load(elem.innerHTML) ?? {};
            anchors.top ??= {};
            anchors.bottom ??= {};

            let fragment = dom.window.document.createElement("div");

            for (let [sceneName, sceneValue] of Object.entries(anchors.top)) {
                let anchor = dom.window.document.createElement("anchor");
                anchor.setAttribute("type", "top");
                anchor.setAttribute("scene", sceneName);
                anchor.setAttribute("anchor", sceneValue);
                fragment.appendChild(anchor);
            }

            for (let [sceneName, sceneValue] of Object.entries(
                anchors.bottom,
            )) {
                let anchor = dom.window.document.createElement("anchor");
                anchor.setAttribute("type", "bottom");
                anchor.setAttribute("scene", sceneName);
                anchor.setAttribute("anchor", sceneValue);
                fragment.appendChild(anchor);
            }

            elem.parentNode.outerHTML = fragment.innerHTML;
        });

    dom.window.document
        .querySelectorAll("pre code.language-settings")
        .forEach((elem) => {
            elem.parentNode.remove();
            let settings = yaml.load(elem.innerHTML) ?? {};

            if (settings.title != undefined) {
                let titleElem = dom.window.document.createElement("title");
                titleElem.innerHTML = settings.title;
                dom.window.document.head.appendChild(titleElem);
                delete settings.title;
            }

            for (let [name, content] of Object.entries(settings)) {
                let metaElem = dom.window.document.createElement("meta");
                metaElem.name = name;
                metaElem.content = content;
                dom.window.document.head.appendChild(metaElem);
            }
        });

    dom.window.document
        .querySelectorAll("pre code.language-include")
        .forEach((elem) => {
            elem.parentNode.remove();
            let includes = yaml.load(elem.innerHTML) ?? {};
            includes.js ??= [];
            includes["defer-js"] ??= [];
            includes.css ??= [];
            includes["defer-css"] ??= [];

            for (let script of includes.js) {
                let scriptElem = dom.window.document.createElement("script");
                scriptElem.src = script;
                dom.window.document.body.appendChild(scriptElem);
            }

            for (let script of includes["defer-js"]) {
                let scriptElem = dom.window.document.createElement("script");
                scriptElem.src = script;
                scriptElem.defer = true;
                dom.window.document.body.appendChild(scriptElem);
            }

            for (let css of includes.css) {
                let linkElem = dom.window.document.createElement("link");
                linkElem.rel = "stylesheet";
                linkElem.type = "text/css";
                linkElem.href = css;
                dom.window.document.body.appendChild(linkElem);
            }

            for (let css of includes["defer-css"]) {
                let linkElem = dom.window.document.createElement("link");
                linkElem.rel = "stylesheet";
                linkElem.type = "text/css";
                linkElem.defer = true;
                linkElem.href = css;
                dom.window.document.body.appendChild(linkElem);
            }
        });

    dom.window.document
        .querySelectorAll("pre code.language-inline-css")
        .forEach((elem) => {
            elem.parentNode.remove();

            let styleElem = dom.window.document.createElement("style");
            styleElem.innerHTML = elem.innerHTML;
            dom.window.document.head.appendChild(styleElem);
        });

    dom.window.document
        .querySelectorAll("pre code.language-inline-js")
        .forEach((elem) => {
            elem.parentNode.remove();

            let scriptElem = dom.window.document.createElement("script");
            scriptElem.innerHTML = elem.innerHTML;
            dom.window.document.body.appendChild(scriptElem);
        });

    return params.prettyFormat
        ? pretty(dom.serialize(), { ocd: true })
        : dom.serialize();
}

function toHtmlFragment(markdownContent, params = {}) {
    let naiveHtml = String(
        unified()
            .use(remarkParse)
            .use(remarkHtml, { sanitize: false })
            .processSync(markdownContent),
    );
    let dom = new JSDOM(naiveHtml);

    let headerFrequencies = {};
    let headerTree = { node: null, children: [] };

    function insertHeader(elem, tree) {
        if (
            tree.children.length == 0 ||
            tree.children[tree.children.length - 1].node.tagName >= elem.tagName
        ) {
            tree.children.push({ node: elem, children: [] });
        } else {
            insertHeader(elem, tree.children[tree.children.length - 1]);
        }
    }
    dom.window.document
        .querySelectorAll("h1, h2, h3, h4, h5, h6")
        .forEach((elem) => {
            let name = elem.textContent.replace(" ", "-");
            headerFrequencies[name] ??= 0;
            headerFrequencies[name]++;

            insertHeader(elem, headerTree);
        });

    function headerAddId(tree, frequencies, parentName) {
        let name;
        if (tree.node != null) {
            name = tree.node.textContent.replace(" ", "-");
            if (parentName == undefined || frequencies[name] <= 1)
                tree.node.id = name;
            else tree.node.id = `${parentName}_${name}`;
        }

        for (let child of tree.children) {
            headerAddId(
                child,
                frequencies,
                parentName == undefined ? name : `${parentName}_${name}`,
            );
        }
    }
    headerAddId(headerTree, headerFrequencies);

    dom.window.document
        .querySelectorAll("pre code.language-keydefs")
        .forEach((elem) => {
            let keydefs = yaml.load(elem.innerHTML) ?? {};
            let fragment = dom.window.document.createElement("div");

            for (let [scene, properties] of Object.entries(keydefs)) {
                for (let [propertyName, attributes] of Object.entries(
                    properties,
                )) {
                    let keydef = dom.window.document.createElement("keydef");
                    keydef.setAttribute("scene", scene);
                    keydef.setAttribute("property", propertyName);

                    for (let [attrName, attrValue] of Object.entries(
                        attributes,
                    )) {
                        keydef.setAttribute(attrName, attrValue);
                    }
                    fragment.appendChild(keydef);
                }
            }

            elem.parentNode.outerHTML = fragment.innerHTML;
        });

    dom.window.document
        .querySelectorAll("pre code.language-key")
        .forEach((elem) => {
            let keys = yaml.load(elem.innerHTML) ?? {};
            let fragment = dom.window.document.createElement("div");

            for (let [scene, properties] of Object.entries(keys)) {
                for (let [propertyName, attributes] of Object.entries(
                    properties,
                )) {
                    let key = dom.window.document.createElement("key");
                    key.setAttribute("scene", scene);
                    key.setAttribute("property", propertyName);
                    if (typeof attributes == "object") {
                        for (let [attrName, attrValue] of Object.entries(
                            attributes,
                        )) {
                            key.setAttribute(attrName, attrValue);
                        }
                    } else {
                        key.setAttribute("value", attributes);
                    }
                    fragment.appendChild(key);
                }
            }

            elem.parentNode.outerHTML = fragment.innerHTML;
        });

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
