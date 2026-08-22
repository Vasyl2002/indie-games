"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

function load(file) {
  var scope = {};
  var code = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  vm.runInNewContext(code, { window: scope, global: scope });
  return scope;
}

var logic = load("js/logic.js").SortLogic;
var config = load("js/config.js").GameConfig;
var levels = load("js/levels.js").LEVELS;

assert.strictEqual(levels.length, 16);
levels.forEach(function (level) {
  assert.strictEqual(level.time, 90);
  assert.strictEqual(level.capacity, 4);
  assert.ok(["easy", "medium", "hard", "expert"].indexOf(level.difficulty) >= 0);
  assert.strictEqual(logic.isSolved(level.bottles, level.capacity), false);
  assert.strictEqual(
    logic.isSolvable(level.bottles, level.capacity, 200000),
    true,
    "level " + level.id + " should be solvable"
  );

  var counts = {};
  level.bottles.forEach(function (bottle) {
    assert.ok(bottle.length <= level.capacity);
    bottle.forEach(function (color) {
      assert.ok(config.COLOR_BY_ID[color], "unknown color " + color);
      counts[color] = (counts[color] || 0) + 1;
    });
  });
  Object.keys(counts).forEach(function (color) {
    assert.strictEqual(counts[color], 4, color + " count on level " + level.id);
  });
});

console.log("levels tests passed");
