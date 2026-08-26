"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

function loadCrazy(locationSearch) {
  var messageListeners = [];
  var scope = {
    window: {},
    global: null,
    Promise: Promise,
    location: { search: locationSearch || "" },
    addEventListener: function (type, fn) {
      if (type === "message") {
        messageListeners.push(fn);
      }
    },
  };
  scope.global = scope;
  scope.window = scope;
  scope.__messageListeners = messageListeners;
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, "..", "js/crazygames.js"), "utf8"),
    scope
  );
  return scope;
}

function throwingSdk(gameObj) {
  var inited = false;
  var sdkObj = {
    init: function () {
      inited = true;
      return Promise.resolve();
    },
  };
  Object.defineProperty(sdkObj, "game", {
    get: function () {
      if (!inited) {
        throw new Error("CrazySDK is not initialized yet");
      }
      return gameObj;
    },
  });
  return sdkObj;
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
assert.ok(wrapper.indexOf("audioChanged") !== -1);
assert.ok(game.indexOf("gameplayStart") !== -1);

var scope = loadCrazy();
assert.ok(scope.CrazySDK);
assert.strictEqual(typeof scope.CrazySDK.showInterstitial, "undefined");
assert.strictEqual(typeof scope.CrazySDK.showRewarded, "undefined");

var started = 0;
var settingsListeners = [];
var mutes = [];
var gameObj = {
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
};
scope.CrazyGames = { SDK: throwingSdk(gameObj) };

return scope.CrazySDK.init({
  onMute: function (value) {
    mutes.push(value);
  },
}).then(function () {
  assert.strictEqual(scope.CrazySDK.isReady(), true, "init finishes even if SDK.game throws beforehand");
  scope.CrazySDK.gameplayStart();
  assert.strictEqual(started, 1);
  assert.strictEqual(settingsListeners.length, 1, "mute listener is attached after init");
  assert.strictEqual(scope.CrazySDK.isAudioMuted(), false);

  gameObj.settings.muteAudio = true;
  settingsListeners[0]({ muteAudio: true });
  assert.strictEqual(mutes[mutes.length - 1], true);
  assert.strictEqual(scope.CrazySDK.isAudioMuted(), true);

  gameObj.settings.muteAudio = false;
  settingsListeners[0]({ muteAudio: false });
  assert.strictEqual(mutes[mutes.length - 1], false);

  scope.__messageListeners[0]({
    data: { messageTarget: "sdk", type: "audioChanged", muteAudio: true },
  });
  assert.strictEqual(mutes[mutes.length - 1], true, "parent audioChanged message mutes the game");

  var beforeNoise = mutes.length;
  scope.__messageListeners[0]({
    data: { type: "audioChanged", muteAudio: true },
  });
  assert.strictEqual(mutes.length, beforeNoise, "ignores mute messages that are not from the CrazyGames SDK");

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
