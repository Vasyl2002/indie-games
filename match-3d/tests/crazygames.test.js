"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

function loadCrazy(locationSearch) {
  var scope = {
    window: {},
    global: null,
    Promise: Promise,
    location: { search: locationSearch || "" },
  };
  scope.global = scope;
  scope.window = scope;
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, "..", "js/crazygames.js"), "utf8"),
    scope
  );
  return scope;
}

var html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
var game = fs.readFileSync(path.join(__dirname, "..", "js/game.js"), "utf8");
var wrapper = fs.readFileSync(path.join(__dirname, "..", "js/crazygames.js"), "utf8");
assert.ok(html.indexOf("crazygames-sdk-v3.js") !== -1);
assert.ok(html.indexOf("fonts.googleapis.com") === -1);
assert.ok(html.indexOf("terms-and-conditions") !== -1);
assert.ok(html.indexOf("privacy-policy") !== -1);
assert.ok(html.indexOf("ads.js") === -1);
assert.ok(html.indexOf("Watch ad") === -1);
assert.ok(game.indexOf("requestAd") === -1);
assert.ok(game.indexOf("showInterstitial") === -1);
assert.ok(game.indexOf("setPlatformMuted") !== -1);
assert.ok(wrapper.indexOf("requestAd") === -1);
assert.ok(wrapper.indexOf("muteAudio") !== -1);
assert.ok(wrapper.indexOf("addSettingsChangeListener") !== -1);
assert.ok(game.indexOf("gameplayStart") !== -1);

var scope = loadCrazy();
assert.ok(scope.CrazySDK);
assert.strictEqual(typeof scope.CrazySDK.showInterstitial, "undefined");
assert.strictEqual(typeof scope.CrazySDK.showRewarded, "undefined");

var started = 0;
var settingsListeners = [];
var mutes = [];
scope.CrazyGames = {
  SDK: {
    init: function () {
      return Promise.resolve();
    },
    game: {
      settings: { muteAudio: false },
      addSettingsChangeListener: function (fn) {
        settingsListeners.push(fn);
      },
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

return scope.CrazySDK.init({
  onMute: function (value) {
    mutes.push(value);
  },
}).then(function () {
  assert.strictEqual(scope.CrazySDK.isReady(), true);
  scope.CrazySDK.gameplayStart();
  assert.strictEqual(started, 1);
  assert.strictEqual(settingsListeners.length, 1);
  assert.strictEqual(mutes[0], false);
  assert.strictEqual(scope.CrazySDK.isAudioMuted(), false);

  scope.CrazyGames.SDK.game.settings.muteAudio = true;
  settingsListeners[0]({ muteAudio: true });
  assert.strictEqual(mutes[mutes.length - 1], true);
  assert.strictEqual(scope.CrazySDK.isAudioMuted(), true);

  var queryScope = loadCrazy("?muteAudio=true");
  var queryMutes = [];
  return queryScope.CrazySDK.init({
    onMute: function (value) {
      queryMutes.push(value);
    },
  }).then(function () {
    assert.strictEqual(queryMutes[0], true);
    assert.strictEqual(queryScope.CrazySDK.isAudioMuted(), true);
    console.log("match-3d crazygames tests passed");
  });
});
