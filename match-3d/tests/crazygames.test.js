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
assert.strictEqual(typeof scope.CrazySDK.showInterstitial, "undefined");
assert.strictEqual(typeof scope.CrazySDK.showRewarded, "undefined");

var started = 0;
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
  },
};

return scope.CrazySDK.init().then(function () {
  assert.strictEqual(scope.CrazySDK.isReady(), true);
  scope.CrazySDK.gameplayStart();
  assert.strictEqual(started, 1);
  var html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  var game = fs.readFileSync(path.join(__dirname, "..", "js/game.js"), "utf8");
  var wrapper = fs.readFileSync(path.join(__dirname, "..", "js/crazygames.js"), "utf8");
  assert.ok(html.indexOf("crazygames-sdk-v2.js") !== -1);
  assert.ok(html.indexOf("fonts.googleapis.com") === -1);
  assert.ok(html.indexOf("terms-and-conditions") !== -1);
  assert.ok(html.indexOf("privacy-policy") !== -1);
  assert.ok(html.indexOf("ads.js") === -1);
  assert.ok(html.indexOf("Watch ad") === -1);
  assert.ok(game.indexOf("requestAd") === -1);
  assert.ok(game.indexOf("showInterstitial") === -1);
  assert.ok(wrapper.indexOf("requestAd") === -1);
  assert.ok(game.indexOf("gameplayStart") !== -1);
  console.log("match-3d crazygames tests passed");
});
