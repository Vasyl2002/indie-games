(function (global) {
  "use strict";

  function GameAudio() {
    this.ctx = null;
    this.enabled = true;
  }

  GameAudio.prototype.ensure = function () {
    if (!this.ctx) {
      var AudioContext = global.AudioContext || global.webkitAudioContext;
      if (!AudioContext) {
        this.enabled = false;
        return null;
      }
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  };

  GameAudio.prototype.tone = function (freq, duration, type, gain, when) {
    if (!this.enabled) {
      return;
    }
    var ctx = this.ensure();
    if (!ctx) {
      return;
    }
    var start = ctx.currentTime + (when || 0);
    var osc = ctx.createOscillator();
    var amp = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain || 0.08, start + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  GameAudio.prototype.select = function () {
    this.tone(620, 0.08, "triangle", 0.05);
  };

  GameAudio.prototype.pour = function () {
    this.tone(380, 0.12, "sine", 0.06);
    this.tone(520, 0.16, "triangle", 0.04, 0.05);
  };

  GameAudio.prototype.invalid = function () {
    this.tone(160, 0.16, "sawtooth", 0.04);
  };

  GameAudio.prototype.complete = function () {
    this.tone(740, 0.1, "sine", 0.06);
    this.tone(980, 0.14, "triangle", 0.05, 0.08);
  };

  GameAudio.prototype.win = function () {
    this.tone(523, 0.14, "sine", 0.07);
    this.tone(659, 0.16, "sine", 0.07, 0.12);
    this.tone(784, 0.22, "triangle", 0.08, 0.24);
  };

  GameAudio.prototype.lose = function () {
    this.tone(220, 0.2, "triangle", 0.06);
    this.tone(165, 0.28, "sine", 0.06, 0.16);
  };

  GameAudio.prototype.tick = function () {
    this.tone(880, 0.05, "square", 0.03);
  };

  global.GameAudio = GameAudio;
})(typeof window !== "undefined" ? window : global);
