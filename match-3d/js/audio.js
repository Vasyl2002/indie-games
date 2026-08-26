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
    this.sfxGain = null;
  }

  MatchAudio.prototype.ensure = function () {
    if (!this.ctx) {
      var C = global.AudioContext || global.webkitAudioContext;
      if (!C) {
        return null;
      }
      this.ctx = new C();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.gain.value = this.muted ? 0 : 0.32;
      this.sfxGain.gain.value = 0.7;
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  };

  MatchAudio.prototype.unlockAndPlay = function () {
    var self = this;
    var ctx = this.ensure();
    if (!ctx) {
      return;
    }
    var start = function () {
      if (!self.muted) {
        self.startMusic();
      }
    };
    if (ctx.state === "suspended") {
      ctx.resume().then(start).catch(start);
    } else {
      start();
    }
  };

  MatchAudio.prototype.applyMusicGain = function () {
    if (!this.musicGain || !this.ctx) {
      return;
    }
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(this.muted ? 0 : 0.22, this.ctx.currentTime);
  };

  MatchAudio.prototype.setMuted = function (muted) {
    this.muted = !!muted;
    this.applyMusicGain();
    if (this.muted) {
      this.stopMusic();
    } else {
      this.unlockAndPlay();
    }
  };

  MatchAudio.prototype.toggleMute = function () {
    this.setMuted(!this.muted);
    return this.muted;
  };

  MatchAudio.prototype.stopMusic = function () {
    this.musicOn = false;
    if (this.musicTimer) {
      global.clearTimeout(this.musicTimer);
      this.musicTimer = 0;
    }
  };

  MatchAudio.prototype.beep = function (freq, dur, type, gain) {
    if (!this.enabled) {
      return;
    }
    var ctx = this.ensure();
    if (!ctx || !this.sfxGain) {
      return;
    }
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var amp = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(gain || 0.06, now + 0.02);
    amp.gain.linearRampToValueAtTime(0, now + dur);
    osc.connect(amp);
    amp.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.03);
  };

  MatchAudio.prototype.tone = function (freq, start, dur, type, gain) {
    var ctx = this.ctx;
    if (!ctx || !this.musicGain || this.muted) {
      return;
    }
    var t0 = Math.max(start, ctx.currentTime + 0.01);
    var len = Math.max(0.06, dur);
    try {
      var osc = ctx.createOscillator();
      var amp = ctx.createGain();
      osc.type = type || "triangle";
      osc.frequency.setValueAtTime(freq, t0);
      amp.gain.setValueAtTime(0, t0);
      amp.gain.linearRampToValueAtTime(gain, t0 + 0.02);
      amp.gain.linearRampToValueAtTime(0, t0 + len);
      osc.connect(amp);
      amp.connect(this.musicGain);
      osc.start(t0);
      osc.stop(t0 + len + 0.03);
    } catch (err) {
      return;
    }
  };

  MatchAudio.prototype.startMusic = function () {
    var self = this;
    var ctx = this.ctx;
    if (!ctx || this.muted || this.musicOn) {
      return;
    }
    this.musicOn = true;
    this.applyMusicGain();

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

    function schedule(fromTime) {
      if (!self.musicOn || self.muted || !self.ctx) {
        return;
      }
      var at = Math.max(fromTime, self.ctx.currentTime + 0.05);
      melody.forEach(function (n) {
        self.tone(midi(n[1]), at + n[0] * beat, n[2] * beat, "triangle", 0.28);
      });
      bass.forEach(function (n) {
        self.tone(midi(n[1]), at + n[0] * beat, n[2] * beat, "sine", 0.2);
      });
      sparkle.forEach(function (n) {
        self.tone(midi(n[1]), at + n[0] * beat, n[2] * beat, "sine", 0.1);
      });
      var wait = Math.max(200, (at + loopDur - self.ctx.currentTime) * 1000 - 120);
      self.musicTimer = global.setTimeout(function () {
        schedule(at + loopDur);
      }, wait);
    }

    schedule(ctx.currentTime + 0.08);
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
