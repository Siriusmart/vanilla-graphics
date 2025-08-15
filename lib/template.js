const yaml = require("js-yaml");

class Template {
    constructor() {}

    postProcess(dom) {
        for (let component of Object.values(this.components ?? {})) {
            component(dom);
        }
    }

    registerComponent(name, listener, params = {}) {
        this.components ??= {};
        this.components[name] = (dom) => {
            dom.window.document
                .querySelectorAll(`pre code.language-${name}`)
                .forEach((elem) => {
                    let inSettings = params.hasSettings ?? true;
                    let settingsLines = [];
                    let contentLines = [];

                    for (let line of elem.innerHTML.split("\n")) {
                        if (inSettings) {
                            if (line == "---") {
                                inSettings = false;
                                continue;
                            }

                            settingsLines.push(line);
                        } else {
                            contentLines.push(line);
                        }
                    }

                    let settings = yaml.load(settingsLines.join("\n")) ?? {};
                    let content = contentLines.join("\n");

                    let producedElem = listener(content, settings);

                    if (typeof producedElem == "string") {
                        elem.parentNode.outerHTML = producedElem;
                    } else {
                        elem.parentNode.outerHTML = producedElem.innerHTML;
                    }
                });
        };
    }
}

module.exports = { Template };
