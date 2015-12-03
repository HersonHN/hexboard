'use strict';

function Cell (p) {
    this.row = p.row;
    this.column = p.column;
    this.x = p.x;
    this.y = p.y;
    this.isEven = p.isEven;
    this.name = Cell.getName(this.row, this.column);

    this.points = [];
    this.lines = [];
    this.boundaries = [];

    this.maxX = 0;
    this.maxY = 0;
    this.minX = 0;
    this.minY = 0;
}

// static functions
Cell.getName = function (r, c) {
    return 'r' + r + 'c' + c;
};

// instance functions
Cell.prototype.calculateBoundaries = function () {
    var p, point;
    var maxX, minX, maxY, minY;

    this.points.forEach(function (point) {
        maxX = max(point.x, maxX);
        maxY = max(point.y, maxY);
        minX = min(point.x, minX);
        minY = min(point.y, minY);
    });

    this.maxX = maxX;
    this.maxY = maxY;
    this.minX = minX;
    this.minY = minY;

    this.calculateCenter();
};

Cell.prototype.calculateCenter = function () {
    var pointA = this.points[0];
    var pointB = this.points[3];

    this.x = (pointA.x + pointB.x) / 2;
    this.y = (pointA.y + pointB.y) / 2;
}

Cell.prototype.isPointInside = function (point) {
    var line, response, pointA, pointB;

    for (var i = 0; i < this.lines.length; i++) {
        line = this.lines[i];
        response = isPointInsideTriangle(point, line.pointA, line.pointB, this);
        if (response) {
            return true;
        }
    }
    return false;
};

function isPointInsideTriangle(p, p1, p2, p3) {
    // using barycentric coordinates
    var alpha = ((p2.y - p3.y) * (p.x  - p3.x) + (p3.x - p2.x) * (p.y  - p3.y)) /
                ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
    var beta  = ((p3.y - p1.y) * (p.x  - p3.x) + (p1.x - p3.x) * (p.y  - p3.y)) /
                ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
    var gamma = 1.0 - alpha - beta;

    return (alpha > 0 && beta > 0 && gamma > 0);
}

function max(x, y) {
    if (isNaN(x)) return y;
    if (isNaN(y)) return x;
    return Math.max(x, y);
}

function min(x, y) {
    if (isNaN(x)) return y;
    if (isNaN(y)) return x;
    return Math.min(x, y);
}

module.exports = Cell;
