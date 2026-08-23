"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var store = {};
var scope = {
  window: null,
  global: null,
  localStorage: {
    getItem: function (key) {
      return store[key] || null;
    },
    setItem: function (key, value) {
      store[key] = String(value);
    },
  },
  setTimeout: function () {
    return 0;
  },
  clearTimeout: function () {},
};
scope.window = scope;
scope.global = scope;

vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "..", "js/audio.js"), "utf8"),
  scope
);

var audio = new scope.GameAudio();
assert.strictEqual(audio.musicOn, true);
assert.strictEqual(audio.sfxOn, true);
audio.setMusic(false);
audio.setSfx(false);
assert.strictEqual(audio.musicOn, false);
assert.strictEqual(audio.sfxOn, false);

var saved = JSON.parse(store["magic-sort-audio"]);
assert.strictEqual(saved.music, false);
assert.strictEqual(saved.sfx, false);

var again = new scope.GameAudio();
assert.strictEqual(again.musicOn, false);
assert.strictEqual(again.sfxOn, false);
assert.strictEqual(again.toggleMusic(), true);
assert.strictEqual(again.toggleSfx(), true);
console.log("audio tests passed");
