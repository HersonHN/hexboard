'use strict';

function Line (p) {
    this.name = p.name;
    this.pointA = p.pointA;
    this.pointB = p.pointB;
}

Line.getName = function (pointA, pointB) {
    if (pointA > pointB) {
        return pointA + '-' + pointB;
    } else {
        return pointB + '-' + pointA;
    }
}

Line.prototype.toString = function () {
    return this.name;
}

module.exports = Line;
