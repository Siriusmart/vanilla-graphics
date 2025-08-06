let scenes = {};
let keyCache = {};

let vanillaGraphics = {
    addScene(scene) {
        if (!(scene instanceof EmptyScene))
            throw new Error(
                "Attempting to add an object which is not an instanceof EmptyScene",
            );

        scene.onChangeRaw(
            keyCache[scene.name].values ?? {},
            keyCache[scene.name].anchors ?? {},
        );
        scenes[scene.name] = scene;
    },

    onFrame() {
        for (let [sceneName, scene] of Object.entries(scenes)) {
            keyCache[sceneName] ??= {};
            scene.onFrameRaw(
                keyCache[sceneName].values ?? {},
                keyCache[sceneName].anchors ?? {},
            );
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

        let relevantKeys = {};

        for (let { position, scene, property, value } of keyframes) {
            relevantKeys[scene] ??= {};
            relevantKeys[scene][property] ??= {};

            if (position <= 0) {
                relevantKeys[scene][property].before = { position, value };
            } else {
                relevantKeys[scene][property].after ??= { position, value };
            }
        }

        let keyedValues = {};

        for (let [scene, keys] of Object.entries(relevantKeys)) {
            keyedValues[scene] ??= {};

            for (let [property, { before, after }] of Object.entries(keys)) {
                if (before == undefined) {
                    keyedValues[scene][property] = after.value;
                    continue;
                }
                if (after == undefined) {
                    keyedValues[scene][property] = before.value;
                    continue;
                }

                if (
                    isNaN(parseFloat(before.value)) ||
                    isNaN(parseFloat(after.value))
                ) {
                    keyedValues[scene][property] =
                        Math.abs(before.position) < Math.abs(after.position)
                            ? before.value
                            : after.value;
                    continue;
                }

                keyedValues[scene][property] =
                    (before.value * Math.abs(after.position) +
                        after.value * Math.abs(before.position)) /
                    (Math.abs(after.position) + Math.abs(before.position));
            }
        }

        for (let [sceneName, anchors] of Object.entries(relevantKeys)) {
            keyCache[sceneName] = {
                values: keyedValues[sceneName],
                anchors,
            };
        }

        for (let [sceneName, scene] of Object.entries(scenes)) {
            scene.onChangeRaw(
                keyedValues[sceneName] ?? {},
                relevantKeys[sceneName] ?? {},
                params,
            );
        }
    },
};

vanillaGraphics.onChange();
addEventListener("scroll", vanillaGraphics.onChange);
addEventListener("resize", () => vanillaGraphics.onChange({ force: true }));
requestAnimationFrame(vanillaGraphics.onFrame);
