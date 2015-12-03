'use strict';

var Line = require('./scripts/classes/line');
var Point = require('./scripts/classes/point');
var Cell = require('./scripts/classes/cell');
var Board = require('./scripts/classes/board');

Board.Line = Line;
Board.Point = Point;
Board.Cell = Cell;
Board.Board = Board;

module.exports = Board;
