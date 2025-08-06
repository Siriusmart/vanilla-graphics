var interpolation = {
    linear(keyframes) {
        let res = [null, {}];
        let before, after;

        for (let { position, value } of keyframes) {
            if (position <= 0) {
                before = { position, value };
            } else {
                after ??= { position, value };
            }
        }

        if (before == undefined) {
            return [after.value, { after }];
        }
        if (after == undefined) {
            return [before.value, { before }];
        }

        return [
            (before.value * Math.abs(after.position) +
                after.value * Math.abs(before.position)) /
                (Math.abs(after.position) + Math.abs(before.position)),
            { before, after },
        ];
    },

    polynomial(keyframes) {
        let orderedKeyframes = {};

        for (let key of keyframes) {
            orderedKeyframes[key.scene] ??= {};
            orderedKeyframes[key.scene][key.property] ??= {};
            orderedKeyframes[key.scene][key.property].push(key);
        }

        for (let [sceneName, keys] of orderedKeyframes) {
        }
    },
};
