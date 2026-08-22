"use strict";

var assert = require("assert");
var path = require("path");

function load(file) {
  var scope = {};
  var fs = require("fs");
  var vm = require("vm");
  var code = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  vm.runInNewContext(code, { window: scope, global: scope });
  return scope;
}

var logicScope = load("js/logic.js");
var configScope = load("js/config.js");
var L = logicScope.SortLogic;
var C = configScope.GameConfig;

function testPourRules() {
  var from = ["red", "blue", "blue"];
  var empty = [];
  var other = ["red"];
  var mismatch = ["yellow"];
  var full = ["red", "red", "red", "red"];

  assert.strictEqual(L.canPour(from, empty, 4), true);
  assert.strictEqual(L.pourAmount(from, empty, 4), 2);
  assert.strictEqual(L.canPour(from, other, 4), false);
  assert.strictEqual(L.canPour(from, mismatch, 4), false);
  assert.strictEqual(L.canPour(from, full, 4), false);

  var src = ["red", "blue", "blue"];
  var dst = ["blue"];
  assert.strictEqual(L.pour(src, dst, 4), 2);
  assert.deepStrictEqual(src, ["red"]);
  assert.deepStrictEqual(dst, ["blue", "blue", "blue"]);
}

function testWinCondition() {
  var solved = [
    ["red", "red", "red", "red"],
    ["blue", "blue", "blue", "blue"],
    [],
  ];
  var unsolved = [
    ["red", "red", "red", "blue"],
    ["blue", "blue", "blue", "red"],
    [],
  ];
  assert.strictEqual(L.isSolved(solved, 4), true);
  assert.strictEqual(L.isSolved(unsolved, 4), false);
  assert.strictEqual(L.sortedCount(solved, 4), 2);
}

function testClassicLevel() {
  var bottles = [
    ["red", "blue", "red", "blue"],
    ["blue", "red", "blue", "red"],
    [],
    [],
  ];
  assert.strictEqual(L.isSolvable(bottles, 4, 20000), true);
}

function testGeneratedLevels() {
  var specs = [
    { colors: 3, empty: 2, seed: 11 },
    { colors: 4, empty: 2, seed: 21 },
    { colors: 5, empty: 2, seed: 31 },
    { colors: 6, empty: 2, seed: 41 },
  ];
  specs.forEach(function (spec) {
    var ids = C.PALETTE.slice(0, spec.colors).map(function (color) {
      return color.id;
    });
    var puzzle = L.generatePuzzle(ids, spec.empty, 4, spec.seed, 40);
    assert.ok(puzzle, "should generate a puzzle for " + spec.colors + " colors");
    assert.strictEqual(L.isSolved(puzzle, 4), false);
    assert.strictEqual(L.isSolvable(puzzle, 4, 120000), true);
    var counts = {};
    puzzle.forEach(function (bottle) {
      bottle.forEach(function (color) {
        counts[color] = (counts[color] || 0) + 1;
      });
    });
    ids.forEach(function (id) {
      assert.strictEqual(counts[id], 4, id + " should appear 4 times");
    });
  });
}

testPourRules();
testWinCondition();
testClassicLevel();
testGeneratedLevels();
console.log("logic tests passed");
