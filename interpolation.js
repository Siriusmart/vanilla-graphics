var interpolation = {
    linear(keyframes) {
        let res = {};

        for (let { position, scene, property, value } of keyframes) {
            res[scene] ??= [{}, {}];
            res[scene][1][property] ??= {};

            if (position <= 0) {
                res[scene][1][property].before = { position, value };
            } else {
                res[scene][1][property].after ??= { position, value };
            }
        }

        for (let [scene, keys] of Object.entries(res)) {
            for (let [property, { before, after }] of Object.entries(keys[1])) {
                if (before == undefined) {
                    res[scene][0][property] = after.value;
                    continue;
                }
                if (after == undefined) {
                    res[scene][0][property] = before.value;
                    continue;
                }

                if (keyTypes[scene][property] != "number") {
                    res[scene][0][property] =
                        Math.abs(before.position) < Math.abs(after.position)
                            ? before.value
                            : after.value;
                    continue;
                }

                res[scene][0][property] =
                    (before.value * Math.abs(after.position) +
                        after.value * Math.abs(before.position)) /
                    (Math.abs(after.position) + Math.abs(before.position));
            }
        }

        return res;
    },
};
