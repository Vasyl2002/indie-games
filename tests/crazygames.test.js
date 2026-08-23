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
  fs.readFileSync(path.join(__dirname, "..", "js/crazygames.js"), "utf8"),
  scope
);

assert.ok(scope.CrazySDK);
assert.strictEqual(scope.CrazySDK.isReady(), false);

var called = false;
scope.CrazySDK.showInterstitial(function () {
  called = true;
});
assert.strictEqual(called, true);

var started = 0;
var ads = 0;
scope.CrazyGames = {
  SDK: {
    init: function () {
      return Promise.resolve();
    },
    game: {
      gameplayStart: function () {
        started += 1;
      },
      gameplayStop: function () {
        started -= 1;
      },
    },
    ad: {
      requestAd: function (type, callbacks) {
        ads += 1;
        assert.strictEqual(type, "midgame");
        callbacks.adStarted();
        callbacks.adFinished();
      },
    },
  },
};

return scope.CrazySDK.init().then(function () {
  assert.strictEqual(scope.CrazySDK.isReady(), true);
  scope.CrazySDK.gameplayStart();
  assert.strictEqual(started, 1);
  var finished = false;
  scope.CrazySDK.showInterstitial(function () {
    finished = true;
  });
  assert.strictEqual(ads, 1);
  assert.strictEqual(finished, true);
  console.log("crazygames tests passed");
});
