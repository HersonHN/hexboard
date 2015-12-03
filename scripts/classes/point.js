'use strict';

function Point (p) {
    this.x = p.x;
    this.y = p.y;
    this.z = 0;
    this.name = p.name;
}

Point.prototype.toString = function () {
    return this.name;
}

module.exports = Point;
