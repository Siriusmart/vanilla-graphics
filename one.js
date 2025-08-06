class SceneOne extends FixedScene {
    constructor() {
        super("one");
        this.board = document.createElement("canvas");
        this.board.id = "oneBoard";
        this.board.style.width = "100%";
        this.board.style.height = "100%";
        this.ctx = this.board.getContext("2d");

        let sceneWindow = document.getElementById("one");
        sceneWindow.appendChild(this.board);

        this.addKeyFilter("x", new SmoothedKeyFilter("exponential"));
        this.addKeyFilter("y", new SmoothedKeyFilter("exponential"));
    }

    onChange(_keys, _anchors) {
        this.ctx.canvas.width = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight;
    }

    onFrame({ x, y }, _anchors) {
        this.ctx.clearRect(0, 0, this.board.width, this.board.height);
        let { width, height } = this.board;

        this.ctx.fillRect(
            width / 2 + x * 200 - 100,
            height / 2 + y * 200 - 100,
            100,
            100,
        );
    }
}

vanillaGraphics.addScene(new SceneOne());
