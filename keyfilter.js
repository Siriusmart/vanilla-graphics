class EmptyKeyFilter {
    constructor() {}

    pass(key) {
        return key;
    }
}

class LazyKeyFilter extends EmptyKeyFilter {
    constructor() {
        super();
    }

    pass(key) {
        if (this.previous == key) return null;
        else {
            this.previous = key;
            return key;
        }
    }
}

class SmoothedKeyFilter extends LazyKeyFilter {
    constructor(algorithm, params = {}) {
        super();

        switch (algorithm) {
            case "exponential":
                params.speed ??= 0.1;
                params.effectiveZero ??= 0.01;
                this.algorithm = (key) => {
                    if (
                        this.previous == undefined ||
                        Math.abs(this.previous - key) < params.effectiveZero
                    )
                        return key;
                    else
                        return (
                            params.speed * key +
                            this.previous * (1 - params.speed)
                        );
                };
                break;
            default:
                throw new Error(`Unknown smoothing algorithm ${algorithm}`);
        }
    }

    pass(key) {
        return super.pass(this.algorithm(key));
    }
}
