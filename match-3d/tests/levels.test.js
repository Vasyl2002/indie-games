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

assert.strictEqual(config.TRAY_SIZE, 6);
assert.strictEqual(config.MATCH_SIZE, 2);
var css = fs.readFileSync(path.join(__dirname, "..", "css", "style.css"), "utf8");
var html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
assert.ok(css.indexOf("repeat(6") !== -1);
assert.ok(css.indexOf("top: -7px") === -1, "goal counts must sit inside the card");
assert.strictEqual((html.match(/class="slot"/g) || []).length, 6);
assert.ok(fs.readFileSync(path.join(__dirname, "..", "js", "game.js"), "utf8").indexOf("6-slot tray") !== -1);
assert.ok(fs.readFileSync(path.join(__dirname, "..", "js", "game.js"), "utf8").indexOf("10-slot") === -1);
assert.strictEqual(config.WIN_COINS, 30);
assert.strictEqual(config.BOMB_COST, 30);
assert.ok(config.TYPE_MAP.stone && config.TYPE_MAP.stone.blocker, "stone is a blocker, not a goal toy");
assert.strictEqual(config.BLOCKER_TYPE, "stone");
levels.forEach(function (level) {
  assert.ok(level.time >= 45 && level.time <= 180, "time bounds " + level.id);
  assert.ok(!level.goals.stone, "stones must not be goals on level " + level.id);
  assert.ok(level.extras.stone >= 2, "stones clutter level " + level.id);
  assert.strictEqual(level.extras.stone % 2, 0, "stone count even on level " + level.id);
  var total = 0;
  var types = {};
  function add(map) {
    Object.keys(map || {}).forEach(function (type) {
      assert.ok(config.TYPE_MAP[type], "unknown type " + type + " on level " + level.id);
      assert.strictEqual(map[type] % 2, 0, type + " must be even on level " + level.id);
      types[type] = (types[type] || 0) + map[type];
      total += map[type];
    });
  }
  add(level.goals);
  add(level.extras);
  Object.keys(types).forEach(function (type) {
    assert.strictEqual(types[type] % 2, 0, "paired leftovers for " + type + " on level " + level.id);
  });
  assert.ok(total >= 8, "enough objects on level " + level.id);
});
assert.strictEqual(levels[0].extras.stone, 4);
assert.strictEqual(levels[19].extras.stone, 12);
assert.strictEqual(levels[0].time, 50);
assert.strictEqual(levels[19].time, 180);
console.log("match-3d level tests passed");
