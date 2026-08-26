(function (global) {
  "use strict";

  function midi(n) {
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  function MatchAudio() {
    this.ctx = null;
    this.enabled = true;
    this.muted = false;
    this.musicOn = false;
    this.musicTimer = 0;
    this.musicGain = null;
  }

  MatchAudio.prototype.ensure = function () {
    if (!this.ctx) {
      var C = global.AudioContext || global.webkitAudioContext;
      if (!C) {
        return null;
      }
      this.ctx = new C();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.muted ? 0 : 0.085;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (this.ctx && !this.musicOn && !this.muted) {
      this.startMusic();
    }
    return this.ctx;
  };

  MatchAudio.prototype.setMuted = function (muted) {
    this.muted = !!muted;
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.muted ? 0.0001 : 0.085, this.ctx.currentTime, 0.05);
    }
    if (!this.muted) {
      this.ensure();
    }
  };

  MatchAudio.prototype.toggleMute = function () {
    this.setMuted(!this.muted);
    return this.muted;
  };

  MatchAudio.prototype.beep = function (freq, dur, type, gain) {
    if (!this.enabled || this.muted) {
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

  MatchAudio.prototype.tone = function (freq, start, dur, type, gain) {
    var ctx = this.ctx;
    if (!ctx || !this.musicGain) {
      return;
    }
    var osc = ctx.createOscillator();
    var amp = ctx.createGain();
    osc.type = type || "triangle";
    osc.frequency.setValueAtTime(freq, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.04, dur - 0.03));
    osc.connect(amp);
    amp.connect(this.musicGain);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  };

  MatchAudio.prototype.startMusic = function () {
    var self = this;
    var ctx = this.ensure();
    if (!ctx || this.musicOn) {
      return;
    }
    this.musicOn = true;
    var bpm = 126;
    var beat = 60 / bpm;
    var loopBeats = 16;
    var loopDur = loopBeats * beat;

    var melody = [
      [0, 76, 0.45], [0.5, 79, 0.45], [1, 84, 0.7], [2, 79, 0.4], [2.5, 81, 0.4], [3, 84, 0.9],
      [4, 83, 0.4], [4.5, 81, 0.4], [5, 79, 0.7], [6, 76, 0.4], [6.5, 79, 0.4], [7, 72, 0.9],
      [8, 77, 0.4], [8.5, 81, 0.4], [9, 84, 0.7], [10, 81, 0.4], [10.5, 84, 0.4], [11, 86, 0.9],
      [12, 84, 0.35], [12.5, 83, 0.35], [13, 81, 0.35], [13.5, 79, 0.35], [14, 76, 0.4], [14.5, 79, 0.4], [15, 84, 0.95],
    ];
    var bass = [
      [0, 48, 1.7], [2, 55, 1.6], [4, 45, 1.7], [6, 52, 1.6],
      [8, 41, 1.7], [10, 48, 1.6], [12, 43, 1.7], [14, 50, 1.6],
    ];
    var sparkle = [
      [1.5, 91, 0.18], [3.5, 88, 0.18], [5.5, 91, 0.18], [7.5, 84, 0.2],
      [9.5, 93, 0.18], [11.5, 91, 0.18], [13.75, 96, 0.22], [15.5, 88, 0.22],
    ];

    function schedule(at) {
      if (!self.musicOn) {
        return;
      }
      melody.forEach(function (n) {
        self.tone(midi(n[1]), at + n[0] * beat, n[2] * beat, "triangle", 0.22);
      });
      bass.forEach(function (n) {
        self.tone(midi(n[1]), at + n[0] * beat, n[2] * beat, "sine", 0.16);
      });
      sparkle.forEach(function (n) {
        self.tone(midi(n[1]), at + n[0] * beat, n[2] * beat, "sine", 0.07);
      });
      for (var i = 0; i < loopBeats; i += 1) {
        self.tone(i % 2 === 0 ? 180 : 220, at + i * beat, 0.08, "square", i % 4 === 0 ? 0.04 : 0.02);
      }
      self.musicTimer = global.setTimeout(function () {
        schedule(Math.max(ctx.currentTime + 0.04, at + loopDur));
      }, loopDur * 1000 - 80);
    }

    schedule(ctx.currentTime + 0.06);
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
  MatchAudio.prototype.coin = function () {
    this.beep(880, 0.08, "sine", 0.05);
    this.beep(1180, 0.1, "triangle", 0.04);
  };
  MatchAudio.prototype.boom = function () {
    this.beep(90, 0.28, "sawtooth", 0.08);
    this.beep(240, 0.14, "square", 0.05);
  };

  global.MatchAudio = MatchAudio;
})(typeof window !== "undefined" ? window : global);
