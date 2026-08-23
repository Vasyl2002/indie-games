"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var scope = {
  window: null,
  global: null,
  document: {
    createElement: function () {
      return { onload: null, onerror: null };
    },
    head: { appendChild: function () {} },
  },
  Promise: Promise,
};
scope.window = scope;
scope.global = scope;

vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "..", "js/yandex.js"), "utf8"),
  scope
);

assert.ok(scope.YandexSDK);
assert.strictEqual(scope.YandexSDK.isReady(), false);
assert.strictEqual(scope.YandexSDK.getSdk(), null);

var called = false;
scope.YandexSDK.showInterstitial(function () {
  called = true;
});
assert.strictEqual(called, true);
console.log("yandex tests passed");
