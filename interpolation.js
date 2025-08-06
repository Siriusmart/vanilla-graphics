var interpolation = {
    nearest(keyframes) {
        let before, after;

        for (let { position, value } of keyframes) {
            if (position <= 0) {
                before = { position, value };
            } else {
                after ??= { position, value };
            }
        }

        if (before == undefined) return [after.value, { after }];
        if (after == undefined) return [before.value, { before }];

        if (Math.abs(before.position) < Math.abs(after.position))
            return [before.value, { before, after }];
        else return [after.value, { before, after }];
    },

    linear(keyframes) {
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

    polynomial(keyframes) {},
};
