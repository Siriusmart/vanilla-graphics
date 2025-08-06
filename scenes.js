function filterKeys(originalKeys, filters) {
    let keys = structuredClone(originalKeys);
    let changed = false;
    let totalFilters = 0;
    for (let [fieldName, filterList] of Object.entries(filters)) {
        for (let filter of filterList) {
            totalFilters++;
            keys[fieldName] = filter.pass(keys[fieldName]);
            if (keys[fieldName] == null)
                keys[fieldName] = originalKeys[fieldName];
            else changed = true;
        }
    }

    return changed || totalFilters == 0 ? keys : null;
}

class EmptyScene {
    constructor(name) {
        if (typeof name != "string")
            throw new Error("Creating new scene without name specified");
        this.name = name;
        this.keyFilters = {};
    }

    onFrameRaw(keys, anchors) {
        keys = filterKeys(keys, this.keyFilters);
        if (keys != null) this.onFrame(keys, anchors);
    }

    onChangeRaw(keys, ...params) {
        let filteredKeys = filterKeys(keys, this.keyFilters);
        if (params[params.length - 1].force && filteredKeys == null)
            filteredKeys = keys;

        if (filteredKeys != null) {
            this.onChange(filteredKeys, ...params);
            this.onFrame(filteredKeys, ...params);
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
