class IntroSquareScene extends AnchoredCanvasScene {
    constructor() {
        super("intro-square");
        this.addKeyFilter("width", new SmoothedKeyFilter("exponential"));
        this.addKeyFilter("height", new SmoothedKeyFilter("exponential"));
        this.addKeyFilter("y", new SmoothedKeyFilter("exponential"));
        this.addKeyFilter("x", new SmoothedKeyFilter("exponential"));
        this.addKeyFilter("height", new EmptyKeyFilter());
        this.addKeyFilter("width", new EmptyKeyFilter());
        this.addKeyFilter("color", new LazyKeyFilter());
        this.addKeyFilter("opacity", new LazyKeyFilter());
    }

    onVisibleFrame({ width, y, x, height, color }) {
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            this.canvas.width / 2 + x - width / 2,
            this.canvas.height / 2 - y - height / 2,
            width,
            height,
        );
    }
}

vanillaGraphics.addScene(new IntroSquareScene());
