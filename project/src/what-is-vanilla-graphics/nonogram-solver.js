class Board {
    // rows, columns: number
    // rules: number[]
    constructor(rows, columns, rules) {
        if (rows == undefined) return;

        if (rules.length != rows + columns)
            throw new Error(
                `Assert rules.length (${rules.length}) == rows + columns (${rows + columns}) failed.`,
            );

        this.rows = rules.slice(0, rows);
        this.columns = rules.slice(rows, rows + columns);

        this.state = [];
        for (let y = 0; y < this.rows.length; y++) {
            let row = [];
            for (let x = 0; x < this.columns.length; x++) {
                row.push(null);
            }
            this.state.push(row);
        }
    }

    display(canvas, params) {
        const padding = 10;
        const cellSize = params.size;

        let rowsMaxChunks = Math.max(
            1,
            ...this.rows.map((rules) => rules.length),
        );
        let columnsMaxChunks = Math.max(
            1,
            ...this.columns.map((rules) => rules.length),
        );

        let requiredHeight = columnsMaxChunks + this.rows.length;
        let requiredWidth = rowsMaxChunks + this.columns.length;

        let ctx = canvas.getContext("2d");
        let offsetX =
            (canvas.width - (requiredWidth * cellSize + 2 * padding)) / 2 +
            params.x;
        let offsetY =
            (canvas.height - requiredHeight * cellSize + 2 * padding) / 2 +
            params.y;

        // draw grid
        for (let y = 0; y <= requiredHeight; y++) {
            if (y < columnsMaxChunks && y != 0) continue;
            ctx.beginPath();
            ctx.moveTo(
                offsetX + (y == 0 ? rowsMaxChunks * cellSize : 0) + padding,
                offsetY + y * cellSize + padding,
            );
            ctx.lineTo(
                offsetX + requiredWidth * cellSize + padding,
                offsetY + y * cellSize + padding,
            );
            ctx.stroke();
        }

        for (let x = 0; x <= requiredWidth; x++) {
            if (x < rowsMaxChunks && x != 0) continue;
            ctx.beginPath();
            ctx.moveTo(
                offsetX + x * cellSize + padding,
                offsetY + (x == 0 ? columnsMaxChunks * cellSize : 0) + padding,
            );
            ctx.lineTo(
                offsetX + x * cellSize + padding,
                offsetY + requiredHeight * cellSize + padding,
            );
            ctx.stroke();
        }

        ctx.font = `${cellSize / 2}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // draw rules
        for (let y = 0; y < this.rows.length; y++) {
            let rule = this.rows[y];
            if (rule.length == 0) rule = [0];
            for (let mx = 0; mx < rule.length; mx++) {
                ctx.fillText(
                    rule[rule.length - mx - 1],
                    offsetX + (rowsMaxChunks - 0.5 - mx) * cellSize + padding,
                    offsetY + (y + columnsMaxChunks + 0.5) * cellSize + padding,
                );
            }
        }

        for (let x = 0; x < this.columns.length; x++) {
            let rule = this.columns[x];
            if (rule.length == 0) rule = [0];
            for (let my = 0; my < rule.length; my++) {
                ctx.fillText(
                    rule[rule.length - my - 1],
                    offsetX + (x + rowsMaxChunks + 0.5) * cellSize + padding,
                    offsetY +
                        (columnsMaxChunks - 0.5 - my) * cellSize +
                        padding,
                );
            }
        }

        // draw cells
        for (let y = 0; y < this.state.length; y++) {
            for (let x = 0; x < this.state[y].length; x++) {
                switch (this.state[y][x]) {
                    case true:
                        ctx.fillRect(
                            offsetX +
                                padding +
                                (rowsMaxChunks + 0.1 + x) * cellSize,
                            offsetY +
                                padding +
                                (columnsMaxChunks + 0.1 + y) * cellSize,
                            cellSize * 0.8,
                            cellSize * 0.8,
                        );
                        break;
                    case false:
                        ctx.font = `${cellSize / 4}px sans-serif`;
                        ctx.fillText(
                            "❌",
                            offsetX +
                                padding +
                                (rowsMaxChunks + 0.5 + x) * cellSize,
                            offsetY +
                                padding +
                                (columnsMaxChunks + 0.5 + y) * cellSize,
                        );
                        break;
                    case null:
                    default: {
                    }
                }
            }
        }
    }

    blacken(x, y) {
        if (y >= this.state.length && x >= this.state[y].length)
            throw new Error(
                `Out of bounds: trying to access (${x},${y}) in a ${this.columns.length}x${this.rows.length} board.`,
            );

        let newBoard = this.clone();
        newBoard.state[y][x] = true;
        return newBoard;
    }

    mark(x, y) {
        if (y >= this.state.length && x >= this.state[y].length)
            throw new Error(
                `Out of bounds: trying to access (${x},${y}) in a ${this.columns.length}x${this.rows.length} board.`,
            );

        let newBoard = this.clone();
        newBoard.state[y][x] = false;
        return newBoard;
    }

    setRowConflict(y, row) {
        let boardRow = this.row(y);
        return row.some(
            (val, x) =>
                boardRow[x] != null && row[x] != null && boardRow[x] != val,
        );
    }

    setColumnConflict(x, column) {
        let boardColumn = this.column(x);
        return column.some(
            (val, y) =>
                boardColumn[y] != null &&
                column[y] != null &&
                boardColumn[y] != val,
        );
    }

    rowRule(y) {
        return this.rows[y];
    }

    columnRule(x) {
        return this.columns[x];
    }

    row(y) {
        return this.state[y];
    }

    column(x) {
        return this.state.map((row) => row[x]);
    }

    width() {
        return this.state[0].length;
    }

    height() {
        return this.state.length;
    }

    setRow(y, row) {
        let board = this;
        row.forEach((val, x) => {
            switch (val) {
                case true:
                    board = board.blacken(x, y);
                    break;
                case false:
                    board = board.mark(x, y);
                case null:
                default: {
                }
            }
        });
        return board;
    }

    setColumn(x, column) {
        let board = this;
        column.forEach((val, y) => {
            switch (val) {
                case true:
                    board = board.blacken(x, y);
                    break;
                case false:
                    board = board.mark(x, y);
                case null:
                default: {
                }
            }
        });
        return board;
    }

    clone() {
        let newBoard = new Board();
        newBoard.state = structuredClone(this.state);
        newBoard.rows = this.rows;
        newBoard.columns = this.columns;

        return newBoard;
    }
}

function ruleFromCells(cells) {
    let previous = false;
    let ruleFromCells = [];
    cells.forEach((val) => {
        if (val) {
            if (previous == false) ruleFromCells.push(0);
            ruleFromCells[ruleFromCells.length - 1] += 1;
        }
        previous = val;
    });

    return ruleFromCells;
}

function isValid(board) {
    for (let y = 0; y < board.height(); y++) {
        let row = board.row(y);
        if (row.some((val) => val == null)) continue;

        let rule = board.rowRule(y);
        let ruleFromRow = ruleFromCells(row);

        // if mismatch, impossible arrangment
        if (ruleFromRow > rule || ruleFromRow < rule) return false;
    }

    for (let x = 0; x < board.height(); x++) {
        let column = board.column(x);
        if (column.some((val) => val == null)) continue;

        let rule = board.columnRule(x);
        let ruleFromColumn = ruleFromCells(column);

        if (ruleFromColumn > rule || ruleFromColumn < rule) return false;
    }

    return true;
}

function searchPossibilities(rule, row) {
    // special case: length == 0 if row empty
    if (rule.length == 0) {
        if (row.some((cell) => cell == true)) {
            // impossible
            return [];
        } else {
            return [row.map((_) => false)];
        }
    }

    let arrangements = [];

    // search for where to place the chunk of rule[0]
    for (let i = 0; i <= row.length - rule[0]; i++) {
        let currentArrange = Array(i)
            .fill(false)
            .concat(Array(rule[0]).fill(true));
        let hasConflict = currentArrange.some(
            (cell, i) => row[i] != null && cell != row[i],
        );

        // impossible here
        if (hasConflict) continue;

        let subrow = row.slice(i + rule[0]);
        if (subrow.length != 0) {
            if (subrow[0] == true) continue;
            if (rule.length > 1) subrow[0] = false;
        }

        let fullRowArranges = searchPossibilities(rule.slice(1), subrow).map(
            (subArrange) => currentArrange.concat(subArrange),
        );
        arrangements = arrangements.concat(fullRowArranges);
    }

    return arrangements;
}

let steps = [];

function solve(board) {
    steps.push(board);

    // check if board is completed
    if (board.state.every((row) => row.every((val) => val != null)))
        return board;

    let arrangements = [];

    // create a list of all possible placements for each row/column
    for (let y = 0; y < board.height(); y++) {
        arrangements.push(searchPossibilities(board.rowRule(y), board.row(y)));
    }

    for (let x = 0; x < board.width(); x++) {
        arrangements.push(
            searchPossibilities(board.columnRule(x), board.column(x)),
        );
    }

    // impossible
    if (arrangements.some((arrangment) => arrangment.length == 0)) return null;

    // find common values in arrangements
    let commons = arrangements.map((rows) => {
        return rows[0].map((val, i) =>
            rows.slice(1).every((row) => row[i] == val) ? val : null,
        );
    });

    // write the common values to the board
    let squaresPainted = 0;

    for (let y = 0; y < board.height(); y++) {
        if (board.setRowConflict(y, commons[y])) return null;

        commons[y].forEach((val, x) => {
            if (board.row(y)[x] == null && val != null) squaresPainted++;
        });
        board = board.setRow(y, commons[y]);
    }

    for (let x = 0; x < board.width(); x++) {
        if (board.setColumnConflict(x, commons[x + board.height()]))
            return null;
        commons[x + board.height()].forEach((val, y) => {
            if (board.column(x)[y] == null && val != null) squaresPainted++;
        });
        board = board.setColumn(x, commons[x + board.height()]);
    }

    if (squaresPainted != 0) {
        if (!isValid(board)) return null;
        return solve(board);
    }

    // if this iteration did not progress the board at all
    // start the guessing
    // find one cell that splits the space of all possibilities into roughly 2
    // equal parts
    let minDeviation = null; // [x, y, deviation]

    board.state.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell != null) return;
            let yay = 0; // arrangments where the cell is true
            let nay = 0; // arrangments where the cell is false

            arrangements[y].forEach((row) => {
                if (row[x]) yay++;
                else nay++;
            });

            let deviation = Math.abs(0.5 - yay / (yay + nay));
            if (minDeviation == null || deviation < minDeviation[2])
                minDeviation = [x, y, deviation];
        });
    });

    // either it is true or false, so colour the cell and try it out
    let possibility1 = board.blacken(minDeviation[0], minDeviation[1]);
    if (isValid(possibility1)) {
        let solved1 = solve(possibility1);
        if (solved1 != null) return solved1;
    }

    let possibility2 = board.mark(minDeviation[0], minDeviation[1]);
    return solve(possibility2);
}

class NonogramSolverScene extends AnchoredCanvasScene {
    constructor() {
        super("nonogram-solver");
        let board = new Board(20, 20, [
            [8],
            [3, 2],
            [5, 8],
            [2, 4, 3],
            [2, 4, 2],
            [2, 3, 8],
            [1, 2, 3],
            [2, 2, 3],
            [2, 2, 3],
            [6, 3],
            [4, 2],
            [4, 3, 2],
            [4, 2, 1],
            [5, 1, 2, 1],
            [5, 1, 2, 1],
            [5, 1, 1, 1],
            [5, 1, 1, 1],
            [4, 2, 2, 2],
            [3, 1, 4, 3],
            [20],
            [3, 10],
            [2, 2, 10],
            [2, 12],
            [2, 9, 1],
            [1, 1, 4, 1],
            [1, 2, 1, 3],
            [1, 2, 1, 5, 1],
            [2, 1, 1, 1],
            [1, 1, 1, 2],
            [2, 1, 1, 6],
            [1, 1, 1, 1, 2, 3],
            [1, 2, 3, 2, 2],
            [1, 1, 2, 2, 1],
            [1, 1, 4, 1, 1],
            [1, 1, 2, 1, 1, 1],
            [1, 1, 2, 2, 1],
            [3, 2, 1, 1],
            [3, 1, 2, 2],
            [3, 3, 3],
            [2, 11],
        ]);

        solve(board);

        this.addKeyFilter("opacity", new LazyKeyFilter());
        this.addKeyFilter("size", new SmoothedKeyFilter("exponential"));
        this.addKeyFilter("x", new SmoothedKeyFilter("exponential"));
        this.addKeyFilter("y", new SmoothedKeyFilter("exponential"));
        this.addKeyFilter("step", new LazyKeyFilter());
    }

    onVisibleFrame({ size, step, x, y }) {
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        steps[Math.floor(step)].display(this.canvas, { size, x, y });
    }
}

vanillaGraphics.addScene(new NonogramSolverScene());
