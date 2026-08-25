(function (global) {
  "use strict";

  function MatchAudio() {
    this.ctx = null;
    this.enabled = true;
  }

  MatchAudio.prototype.ensure = function () {
    if (!this.ctx) {
      var C = global.AudioContext || global.webkitAudioContext;
      if (!C) {
        return null;
      }
      this.ctx = new C();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  };

  MatchAudio.prototype.beep = function (freq, dur, type, gain) {
    if (!this.enabled) {
      return;
    }
    var ctx = this.ensure();
    if (!ctx) {
      return;
    }
    var osc = ctx.createOscillator();
    var amp = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0.0001, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(gain || 0.06, ctx.currentTime + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  };

  MatchAudio.prototype.pick = function () {
    this.beep(640, 0.08, "triangle", 0.05);
  };
  MatchAudio.prototype.match = function () {
    this.beep(520, 0.1, "sine", 0.06);
    this.beep(780, 0.14, "triangle", 0.05);
  };
  MatchAudio.prototype.win = function () {
    this.beep(523, 0.12, "sine", 0.07);
    this.beep(659, 0.14, "sine", 0.07);
    this.beep(784, 0.2, "triangle", 0.08);
  };
  MatchAudio.prototype.lose = function () {
    this.beep(180, 0.22, "triangle", 0.05);
  };

  global.MatchAudio = MatchAudio;
})(typeof window !== "undefined" ? window : global);
