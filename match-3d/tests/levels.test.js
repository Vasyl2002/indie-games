"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

function load(file) {
  var scope = { window: {}, global: null };
  scope.global = scope;
  scope.window = scope;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), scope);
  return scope;
}

var config = load("js/config.js").MatchConfig;
var levels = load("js/levels.js").MATCH_LEVELS;

assert.strictEqual(config.TRAY_SIZE, 10);
assert.strictEqual(config.MATCH_SIZE, 2);
assert.strictEqual(config.WIN_COINS, 30);
assert.strictEqual(config.BOMB_COST, 30);
levels.forEach(function (level) {
  assert.ok(level.time >= 45 && level.time <= 180, "time bounds " + level.id);
  var total = 0;
  function add(map) {
    Object.keys(map || {}).forEach(function (type) {
      assert.ok(config.TYPE_MAP[type], "unknown type " + type + " on level " + level.id);
      assert.strictEqual(map[type] % 2, 0, type + " must be even on level " + level.id);
      total += map[type];
    });
  }
  add(level.goals);
  add(level.extras);
  assert.ok(total >= 8, "enough objects on level " + level.id);
});
assert.strictEqual(levels[0].time, 50);
assert.strictEqual(levels[19].time, 180);
console.log("match-3d level tests passed");
