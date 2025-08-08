const remarkHtml = require("remark-html").default;
const remarkParse = require("remark-parse").default;
const unified = require("unified").unified;
const { JSDOM } = require("jsdom");
const yaml = require("js-yaml");
const pretty = require("pretty");

function toHtmlDocument(markdownContent, htmlTemplate, prettyFormat = true) {
    let dom = new JSDOM(htmlTemplate);
    dom.window.document.getElementById("front").innerHTML = toHtmlFragment(
        markdownContent,
        false,
    );

    dom.window.document
        .querySelectorAll("pre code.language-include")
        .forEach((elem) => {
            elem.parentNode.remove();
            let includes = yaml.load(elem.innerHTML);
            includes.js ??= [];
            includes['defer-js'] ??= [];
            includes.css ??= [];
            includes['defer-css'] ??= [];

            for (let script of includes.script) {
                let scriptElem = dom.window.document.createElement("script");
                scriptElem.src = script;
                dom.window.document.body.appendChild(scriptElem);
            }

            for (let script of includes.deferScript) {
                let scriptElem = dom.window.document.createElement("script");
                scriptElem.src = script;
                scriptElem.defer = true;
                dom.window.document.body.appendChild(scriptElem);
            }

            for (let css of includes.style) {
                let linkElem = dom.window.document.createElement("link");
                linkElem.rel = "stylesheet";
                linkElem.type = "text/css";
                linkElem.href = css;
                dom.window.document.body.appendChild(linkElem);
            }

            for (let css of includes.deferStyle) {
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

    return prettyFormat
        ? pretty(dom.serialize(), { ocd: true })
        : dom.serialize();
}

function toHtmlFragment(markdownContent, prettyFormat = true) {
    let naiveHtml = String(
        unified().use(remarkParse).use(remarkHtml).processSync(markdownContent),
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
            let keydefs = yaml.load(elem.innerHTML);
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
            let keys = yaml.load(elem.innerHTML);
            let fragment = dom.window.document.createElement("div");

            for (let [scene, properties] of Object.entries(keys)) {
                for (let [propertyName, attributes] of Object.entries(
                    properties,
                )) {
                    let key = dom.window.document.createElement("key");
                    key.setAttribute("scene", scene);
                    key.setAttribute("property", propertyName);
                    for (let [attrName, attrValue] of Object.entries(
                        attributes,
                    )) {
                        key.setAttribute(attrName, attrValue);
                    }
                    fragment.appendChild(key);
                }
            }

            elem.parentNode.outerHTML = fragment.innerHTML;
        });

    return prettyFormat
        ? pretty(dom.window.document.body.innerHTML, { ocd: true })
        : dom.window.document.body.innerHTML;
}

module.exports = {
    toHtmlDocument,
    toHtmlFragment,
};
