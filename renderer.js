let scenes = {};
let keyCache = null;
let keyTypes = {};

Array.from(document.getElementsByTagName("keydef")).forEach((defElem) => {
    let sceneName = defElem.getAttribute("scene");
    let propertyName = defElem.getAttribute("property");
    keyTypes[sceneName] ??= {};
    keyTypes[sceneName][propertyName] = defElem.getAttribute("type");
});

Array.from(document.getElementsByTagName("key")).forEach((keyElem) => {
    let sceneName = keyElem.getAttribute("scene");
    let propertyName = keyElem.getAttribute("property");
    if (
        keyTypes[sceneName] == undefined ||
        keyTypes[sceneName][propertyName] == undefined
    ) {
        console.error(
            `Keyframe exist but definition for ${sceneName}.${propertyName} does not exist.`,
        );
    }
});

let vanillaGraphics = {
    addScene(scene) {
        if (!(scene instanceof EmptyScene))
            throw new Error(
                "Attempting to add an object which is not an instanceof EmptyScene",
            );

        scene.onChangeRaw(...keyCache[scene.name]);
        scenes[scene.name] = scene;
    },

    onFrame() {
        for (let [sceneName, scene] of Object.entries(scenes)) {
            keyCache[sceneName] ??= [];
            scene.onFrameRaw(...keyCache[scene.name]);
        }

        requestAnimationFrame(vanillaGraphics.onFrame);
    },

    onChange(params = {}) {
        let keyframes = Array.from(document.getElementsByTagName("key")).map(
            (elem) => {
                return {
                    position:
                        elem.getBoundingClientRect().top -
                        window.innerHeight / 2,
                    scene: elem.getAttribute("scene"),
                    property: elem.getAttribute("property"),
                    value: elem.getAttribute("value"),
                };
            },
        );

        keyCache = interpolation.linear(keyframes);

        for (let [sceneName, scene] of Object.entries(scenes)) {
            scene.onChangeRaw(...keyCache[sceneName], params);
        }
    },
};

vanillaGraphics.onChange();
addEventListener("scroll", vanillaGraphics.onChange);
addEventListener("resize", () => vanillaGraphics.onChange({ force: true }));
requestAnimationFrame(vanillaGraphics.onFrame);
