'use strict';

var Cell = require('./cell');
var Point = require('./point');
var Line = require('./line');

function Board(conf) {
    this.cells = {};
    this.points = {};
    this.lines = {};

    this.cellList = [];
    this.pointList = [];
    this.lineList = [];

    if (conf) this.init(conf);
}


// abstract functions
Board.prototype.beforeSelectCell = function (cell, board) {};
Board.prototype.afterSelectCell  = function (cell, board) {};
Board.prototype.beforeDraw = function (board) {};
Board.prototype.afterDraw  = function (board) {};
Board.prototype.onDrawCell = function (cell, board, ctx) {};


Board.prototype.init = function (conf) {
    var xInterval = Math.sin(Math.PI / 6);
    var yInterval = Math.cos(Math.PI / 6);

    var xDistance = conf.distance * xInterval;
    var yDistance = conf.distance * yInterval;

    if (!conf.horizontalOffset) conf.horizontalOffset = 0;
    if (!conf.verticalOffset) conf.verticalOffset = 0;

    this.conf = conf;

    this.generateCells(xInterval, yInterval);
    this.generateCellBoundaries();
    this.generatePoints(xInterval, yInterval);
    this.linkPoints(xInterval, yInterval);
    this.generateLines();
    this.calculateBoundaries(this.conf);
};


Board.prototype.draw = function (ctx, opt) {
    opt = opt || {};

    this.beforeDraw(this);
    this.drawLines(ctx);
    this.drawCells(ctx, opt);

    if (opt.debug && opt.drawPoints) {
        this.drawPoints(ctx);
    }

    this.drawHilight(ctx);

    this.afterDraw(this);
};


Board.prototype.generateCells = function (xInterval, yInterval) {
    var cols, rows, cell, c, r, isEven;

    cols = this.conf.columns;

    for (c = 1; c <= cols; c++) {

        isEven = (c % 2 === 0);
        rows = isEven ? this.conf.evenRows : this.conf.evenRows - 1;

        for (r = 1; r <= rows; r++) {

            cell = new Cell({
                row: r,
                column: c,
                isEven: isEven,
                x: c * (xInterval + 1) * 0.5 - xInterval * 0.5,
                y: (r - (isEven ? 0.5 : 0)) * yInterval
            });

            this.cells[cell.name] = cell;
            this.cellList.push(cell);
        }
    }
};


Board.prototype.generatePoints = function (xInterval, yInterval) {
    var cell, pointL, pointR;

    this.cellList.forEach(function (cell) {
        var name, nameL, nameR;

        name = cell.name;
        nameL = cell.name + 'L';
        nameR = cell.name + 'R';

        pointL = new Point({
            x: cell.x - xInterval * 0.5,
            y: cell.y - yInterval * 0.5,
            name: nameL
        });

        pointR = new Point({
            x: cell.x + xInterval * 0.5,
            y: cell.y - yInterval * 0.5,
            name: nameR
        });

        cell.points.push(pointR);
        cell.points.push(pointL);

        this.points[nameL] = pointL;
        this.points[nameR] = pointR;

        this.pointList.push(pointL);
        this.pointList.push(pointR);
    }, this);
};


Board.prototype.generateCellBoundaries = function () {
    var board = this;

    this.cellList.forEach(function (cell) {
        var nn, ss, nw, ne, sw, se;

        nn = Cell.getName(cell.row - 1, cell.column);
        ss = Cell.getName(cell.row + 1, cell.column);

        if (cell.isEven) {
            nw = Cell.getName(cell.row - 1, cell.column - 1);
            ne = Cell.getName(cell.row - 1, cell.column + 1);
            sw = Cell.getName(cell.row,     cell.column - 1);
            se = Cell.getName(cell.row,     cell.column + 1);
        } else {
            nw = Cell.getName(cell.row,     cell.column - 1);
            ne = Cell.getName(cell.row,     cell.column + 1);
            sw = Cell.getName(cell.row + 1, cell.column - 1);
            se = Cell.getName(cell.row + 1, cell.column + 1);
        }

        if (board.cells[nn]) cell.boundaries.push(board.cells[nn]);
        if (board.cells[ss]) cell.boundaries.push(board.cells[ss]);
        if (board.cells[nw]) cell.boundaries.push(board.cells[nw]);
        if (board.cells[ne]) cell.boundaries.push(board.cells[ne]);
        if (board.cells[sw]) cell.boundaries.push(board.cells[sw]);
        if (board.cells[se]) cell.boundaries.push(board.cells[se]);

    });
};


Board.prototype.linkPoints = function (xInterval, yInterval) {

    this.cellList.forEach(function (cell) {
        var bottomCellName, leftCellName, rightCellName;
        var wPoint, ePoint, swPoint, sePoint;

        bottomCellName = Cell.getName(cell.row + 1, cell.column);
        leftCellName   = Cell.getName(cell.isEven ? cell.row : cell.row + 1, cell.column - 1);
        rightCellName  = Cell.getName(cell.isEven ? cell.row : cell.row + 1, cell.column + 1);

        swPoint = bottomCellName + 'L';
        sePoint = bottomCellName + 'R';
        wPoint  = leftCellName   + 'R';
        ePoint  = rightCellName  + 'L';

        // link the point on counter clock order
        // starting from west to east
        this.linkPoint(cell, { name: wPoint,  x: cell.x - 0.5, y: cell.y });
        this.linkPoint(cell, { name: swPoint, x: cell.x - xInterval * 0.5, y: cell.y + yInterval * 0.5 });
        this.linkPoint(cell, { name: sePoint, x: cell.x + xInterval * 0.5, y: cell.y + yInterval * 0.5 });
        this.linkPoint(cell, { name: ePoint,  x: cell.x + 0.5, y: cell.y });
    }, this);
};


Board.prototype.linkPoint = function (cell, o) {
    var name = o.name;
    var point;

    if (this.points.hasOwnProperty(name)) {
        point = this.points[name];
        cell.points.push(point);
    } else {
        point = new Point(o);
        this.points[name] = point;
        this.pointList.push(point);
        cell.points.push(point);
    }
};


Board.prototype.generateLines = function () {
    var board = this;

    board.cellList.forEach(function (cell) {
        var firstPoint = cell.points[0];

        var lastPoint = cell.points.reduce(function (pointA, pointB, index) {
            board.generateLine(cell, pointA, pointB);
            return pointB;
        });

        board.generateLine(cell, lastPoint, firstPoint);
    });
};


Board.prototype.calculateBoundaries = function () {
    this.cellList.forEach(function (cell) {
        cell.calculateBoundaries();
    });
};


Board.prototype.generateLine = function (cell, pointA, pointB) {
    // build the line name
    var lineName, line;

    lineName = Line.getName(pointA.name, pointB.name);

    if (this.lines.hasOwnProperty(lineName)) {
        line = this.lines[lineName];
        cell.lines.push(line);
        return;
    }

    line = new Line({
        pointA: pointA,
        pointB: pointB,
        name: lineName
    });

    this.lines[lineName] = line;
    this.lineList.push(line);
    cell.lines.push(line);
};


Board.prototype.drawLines = function (ctx) {
    var board = this;

    ctx.strokeStyle = board.conf.lineColor;

    board.lineList.forEach(function (line) {
        board.onDrawLine(line, board, ctx);
    });
};


Board.prototype.onDrawLine = function (line, board, ctx) {
    var distance = this.conf.distance;
    var horizontalOffset = this.conf.horizontalOffset;
    var verticalOffset   = this.conf.verticalOffset;

    var aX = line.pointA.x * distance + horizontalOffset;
    var aY = line.pointA.y * distance + verticalOffset;
    var bX = line.pointB.x * distance + horizontalOffset;
    var bY = line.pointB.y * distance + verticalOffset;

    ctx.beginPath();
    ctx.moveTo(aX, aY);
    ctx.lineTo(bX, bY);
    ctx.stroke();
};


Board.prototype.drawCells = function (ctx, opt) {
    var board = this;
    this.cellList.forEach(function (cell) {
        board.onDrawCell(cell, board, ctx);

        if (opt.debug == true && opt.drawCenter == true) {
            board.drawPoint(ctx, cell);
        }
    });
};


Board.prototype.drawPoints = function (ctx) {
    var xDistance, yDistance;
    var board = this;

    var distance = this.conf.distance;
    xDistance = distance * Math.sin(Math.PI / 6);
    yDistance = distance * Math.cos(Math.PI / 6);

    board.pointList.forEach(function (point) {
        board.drawPoint(ctx, point);
    });
};


Board.prototype.drawPoint = function (ctx, point, o) {
    o = o || {};
    o.horizontalOffset = o.horizontalOffset || this.conf.horizontalOffset;
    o.verticalOffset   = o.verticalOffset   || this.conf.verticalOffset;

    var x = point.x * this.conf.distance + o.horizontalOffset;
    var y = point.y * this.conf.distance + o.verticalOffset;
    ctx.fillStyle = point.color || 'black';

    ctx.font = '10px monospace';
    ctx.fillText(point.name, x + 10, y + 10);

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2, true);
    ctx.fill();
};

Board.prototype.drawHilight = function (ctx) {
    var hovered = this.hoveredCell;

    if (!hovered) return;
    var conf = this.conf;
    var board = this;

    ctx.strokeStyle = conf.hoverColor;

    hovered.lines.forEach(function (line) {
        board.onDrawLine(line, board, ctx);
    });

    ctx.strokeStyle = conf.lineColor;
};


Board.prototype.selectCellFromPoint = function (p, callback) {
    var board = this;
    var x = (p.x - board.conf.horizontalOffset) / board.conf.distance;
    var y = (p.y - board.conf.verticalOffset)   / board.conf.distance;


    var cell, isWithinBoundaries, isPointInside;

    for (var i = board.cellList.length - 1; i >= 0; i--) {

        cell = board.cellList[i];

        isWithinBoundaries = ((cell.minX <= x && cell.maxX >= x) && (cell.minY <= y && cell.maxY >= y));
        if (!isWithinBoundaries) continue;

        isPointInside = cell.isPointInside({ x: x, y: y });
        if (!isPointInside) continue;

        if (typeof callback == 'function') {
            callback(cell, board);
            break;
        }

        return cell;
    }
};



Board.prototype.selectCell = function (cell, board) {
    cell.selected = !cell.selected;
};


Board.prototype.hoverCell = function (cell, board) {
    board.hoveredCell = cell;
};



Board.prototype.savePoints = function () {
    this.pointList.forEach(savePoints);
    this.cellList.forEach(savePoints);
};
function savePoints(point) {
    var saved = {
        x: point.x || 0,
        y: point.y || 0,
        z: point.z || 0
    }
    point.saved = saved;
}


Board.prototype.loadPoints = function () {
    this.pointList.forEach(loadPoints);
    this.cellList.forEach(loadPoints);
};
function loadPoints(point) {
    if (!point.saved) return;

    point.x = point.saved.x;
    point.y = point.saved.y;
    point.z = point.saved.z;
}

module.exports = Board;
