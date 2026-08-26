"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

function fakeGain() {
  return {
    gain: {
      value: 0,
      cancelScheduledValues: function () {},
      setValueAtTime: function (v) {
        this.value = v;
      },
      linearRampToValueAtTime: function () {},
    },
    connect: function () {},
    disconnect: function () {},
  };
}

function FakeAudioContext() {
  this.state = "suspended";
  this.sampleRate = 22050;
  this.currentTime = 0;
  this.destination = {};
  this.sources = [];
  this.resumeCalls = 0;
}

FakeAudioContext.prototype.resume = function () {
  this.resumeCalls += 1;
  this.state = "running";
  return Promise.resolve();
};

FakeAudioContext.prototype.createGain = function () {
  return fakeGain();
};

FakeAudioContext.prototype.createBuffer = function (channels, length, sampleRate) {
  return {
    numberOfChannels: channels,
    length: length,
    sampleRate: sampleRate,
    getChannelData: function () {
      return new Float32Array(length);
    },
  };
};

FakeAudioContext.prototype.createBufferSource = function () {
  var source = {
    buffer: null,
    loop: false,
    started: false,
    stopped: false,
    connect: function () {},
    disconnect: function () {},
    start: function () {
      this.started = true;
    },
    stop: function () {
      this.stopped = true;
    },
  };
  this.sources.push(source);
  return source;
};

FakeAudioContext.prototype.createOscillator = function () {
  return {
    type: "sine",
    frequency: { value: 0 },
    connect: function () {},
    start: function () {},
    stop: function () {},
  };
};

function loadAudio() {
  var ctxHolder = { current: null };
  function AudioContext() {
    ctxHolder.current = new FakeAudioContext();
    return ctxHolder.current;
  }
  var sandbox = {
    AudioContext: AudioContext,
    webkitAudioContext: AudioContext,
    window: null,
    global: null,
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, "..", "js", "audio.js"), "utf8"),
    sandbox
  );
  return { audio: new sandbox.MatchAudio(), ctxHolder: ctxHolder };
}

var first = loadAudio();
assert.strictEqual(first.audio.muted, false);
first.audio.unlockAndPlay();
assert.ok(first.ctxHolder.current, "creates audio context on first unlock");
assert.strictEqual(first.ctxHolder.current.resumeCalls, 1);
assert.strictEqual(first.ctxHolder.current.state, "running");
assert.strictEqual(first.audio.musicOn, true);
assert.ok(first.audio.musicSource.started, "loop source starts on unlock");
assert.strictEqual(first.audio.musicSource.loop, true);

first.audio.unlockAndPlay();
assert.strictEqual(first.ctxHolder.current.sources.length, 1, "does not spawn a second loop while playing");

first.audio.setMuted(true);
assert.strictEqual(first.audio.muted, true);
assert.strictEqual(first.audio.musicOn, false);
assert.ok(first.ctxHolder.current.sources[0].stopped, "mute stops the loop");
assert.strictEqual(first.audio.musicSource, null);

first.audio.setMuted(false);
assert.strictEqual(first.audio.muted, false);
assert.strictEqual(first.audio.musicOn, true);
assert.ok(first.ctxHolder.current.sources[1].started, "unmute starts a new loop immediately");
assert.strictEqual(first.ctxHolder.current.sources[1].loop, true);

var muted = loadAudio();
muted.audio.muted = true;
muted.audio.unlockAndPlay();
assert.ok(muted.ctxHolder.current, "muted unlock still creates context");
assert.strictEqual(muted.audio.musicOn, false, "muted unlock does not start music");
assert.strictEqual(muted.ctxHolder.current.sources.length, 0);

muted.audio.toggleMute();
assert.strictEqual(muted.audio.muted, false);
assert.strictEqual(muted.audio.musicOn, true);
assert.ok(muted.ctxHolder.current.sources[0].started, "toggle off mute starts music");

var platform = loadAudio();
platform.audio.unlockAndPlay();
assert.strictEqual(platform.audio.musicOn, true);
platform.audio.setPlatformMuted(true);
assert.strictEqual(platform.audio.isSilent(), true);
assert.strictEqual(platform.audio.musicOn, false);
assert.ok(platform.ctxHolder.current.sources[0].stopped, "platform mute stops the loop");
assert.strictEqual(platform.audio.sfxGain.gain.value, 0);

platform.audio.toggleMute();
assert.strictEqual(platform.audio.muted, true, "in-game mute still toggles while platform is muted");
assert.strictEqual(platform.audio.isSilent(), true);
assert.strictEqual(platform.audio.musicOn, false);

platform.audio.setPlatformMuted(false);
assert.strictEqual(platform.audio.muted, true, "platform unmute keeps the in-game mute preference");
assert.strictEqual(platform.audio.isSilent(), true);
assert.strictEqual(platform.audio.musicOn, false);

platform.audio.toggleMute();
assert.strictEqual(platform.audio.muted, false);
assert.strictEqual(platform.audio.isSilent(), false);
assert.strictEqual(platform.audio.musicOn, true);
assert.ok(platform.ctxHolder.current.sources[1].started, "in-game unmute starts music");

console.log("match-3d audio tests passed");
