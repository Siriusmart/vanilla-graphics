function filterKeys(keys, filters) {
    let changed = false;
    for (let [fieldName, filterList] of Object.entries(filters)) {
        for (let filter of filterList) {
            keys[fieldName] = filter.pass(keys[fieldName]);
            if (keys[fieldName] == null) keys[fieldName] = keys;
            else changed = true;
        }
    }

    return changed ? keys : null;
}

class EmptyScene {
    constructor(name) {
        if (typeof name != "string")
            throw new Error("Creating new scene without name specified");
        this.name = name;
        this.keyFilters = {};
    }

    onFrameRaw(keys, anchors) {
        keys = filterKeys(structuredClone(keys), this.keyFilters);
        if (keys != null) this.onFrame(keys, anchors);
    }

    onChangeRaw(keys, anchors, params = {}) {
        let filteredKeys = filterKeys(structuredClone(keys), this.keyFilters);
        if (params.force && filteredKeys == null) filteredKeys = keys;
        if (filteredKeys != null) {
            this.onChange(filteredKeys, anchors);
            this.onFrame(filteredKeys, anchors);
        }
    }

    onFrame(_keys, _anchors) {}
    onChange(_keys, _anchors) {}

    addKeyFilter(field, filter) {
        if (!(filter instanceof EmptyKeyFilter))
            throw new Error(
                "Attempting to add an object which is not an instanceof EmptyKeyFilter",
            );

        this.keyFilters[field] ??= [];
        this.keyFilters[field].push(filter);
        return this;
    }
}

// Creates an element with sticky positioning when created
class FixedScene extends EmptyScene {
    constructor(name) {
        super(name);

        let screenElem = document.createElement("scene");
        screenElem.style.width = "100vw";
        screenElem.style.height = "100vh";
        screenElem.style.display = "block";
        screenElem.style.position = "relative";
        screenElem.style.top = "0";
        screenElem.style.left = "0";
        screenElem.id = name;
        document.getElementById("back").appendChild(screenElem);
    }
}

class VisibleRenderScene extends FixedScene {
    constructor(name) {
        super(name);
        document.getElementById(name).hidden = true;
    }

    onChange(keys, anchors) {
        if (keys.opacity != undefined && keys.opacity <= 0) {
            document.getElementById(this.name).hidden = true;
        } else {
            document.getElementById(this.name).removeAttribute("hidden");
            this.onVisibleChange(keys, anchors);
        }
    }

    onFrame(keys, anchors) {
        if (keys.opacity != undefined && keys.opacity <= 0) {
            document.getElementById(this.name).hidden = true;
        } else {
            document.getElementById(this.name).removeAttribute("hidden");
            this.onVisibleFrame(keys, anchors);
        }
    }

    onVisibleChange(_keys, _anchors) {}
    onVisibleFrame(_keys, _anchors) {}
}
