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

var skipped = false;
scope.CrazySDK.showInterstitial(function () {
  skipped = true;
});
assert.strictEqual(skipped, true);

var started = 0;
var ads = [];
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
      happytime: function () {},
    },
    ad: {
      requestAd: function (type, callbacks) {
        ads.push(type);
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
  var mid = false;
  scope.CrazySDK.showInterstitial(function () {
    mid = true;
  });
  assert.strictEqual(ads[0], "midgame");
  assert.strictEqual(mid, true);
  var reward = false;
  scope.CrazySDK.showRewarded(function (ok) {
    reward = ok;
  });
  assert.strictEqual(ads[1], "rewarded");
  assert.strictEqual(reward, true);
  var html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  var game = fs.readFileSync(path.join(__dirname, "..", "js/game.js"), "utf8");
  assert.ok(html.indexOf("crazygames-sdk-v2.js") !== -1);
  assert.ok(game.indexOf("showInterstitial") !== -1);
  assert.ok(game.indexOf("retryLevel") !== -1);
  assert.ok(game.indexOf("happytime") !== -1);
  console.log("match-3d crazygames tests passed");
});
