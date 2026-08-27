"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var scope = {
  window: {},
  global: null,
  Promise: Promise,
};
scope.global = scope;
scope.window = scope;

vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "..", "js/audio.js"), "utf8"),
  scope
);

var audio = new scope.MatchAudio();
assert.strictEqual(audio.muted, false);
audio.setSuspended(true);
assert.strictEqual(audio.enabled, false);
audio.setSuspended(false);
assert.strictEqual(audio.enabled, true);
console.log("match-3d audio suspend tests passed");
