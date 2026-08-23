(function (global) {
  "use strict";

  var STORAGE_KEY = "magic-sort-audio";
  var BEAT = 0.58;
  var LOOP_BEATS = 16;
  var MELODY = [
    [0, 659.25, 1.35],
    [2, 783.99, 0.9],
    [3, 587.33, 1.35],
    [5, 493.88, 0.85],
    [6, 440.0, 1.4],
    [8, 392.0, 1.7],
    [10, 329.63, 1.7],
    [12, 392.0, 0.85],
    [13, 440.0, 0.85],
    [14, 493.88, 1.55],
  ];

  function GameAudio() {
    this.ctx = null;
    this.sfxOn = true;
    this.musicOn = true;
    this.musicPlaying = false;
    this.musicGain = null;
    this.padNodes = [];
    this.timer = null;
    this.loopStart = 0;
    this.nextNote = 0;
    this.loadPrefs();
  }

  GameAudio.prototype.loadPrefs = function () {
    try {
      var raw = global.localStorage && localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      var data = JSON.parse(raw);
      if (typeof data.music === "boolean") {
        this.musicOn = data.music;
      }
      if (typeof data.sfx === "boolean") {
        this.sfxOn = data.sfx;
      }
    } catch (err) {
      this.musicOn = true;
      this.sfxOn = true;
    }
  };

  GameAudio.prototype.savePrefs = function () {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ music: this.musicOn, sfx: this.sfxOn })
      );
    } catch (err) {
      return;
    }
  };

  GameAudio.prototype.ensure = function () {
    if (!this.ctx) {
      var AudioContext = global.AudioContext || global.webkitAudioContext;
      if (!AudioContext) {
        return null;
      }
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (this.musicOn) {
      this.startMusic();
    }
    return this.ctx;
  };

  GameAudio.prototype.tone = function (freq, duration, type, gain, when) {
    if (!this.sfxOn) {
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

  GameAudio.prototype.startMusic = function () {
    var ctx = this.ctx;
    if (!ctx || !this.musicOn || this.musicPlaying) {
      return;
    }
    this.musicPlaying = true;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.musicGain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 1.2);
    this.musicGain.connect(ctx.destination);
    this.padNodes = [];
    this.startPad(164.81, 0.045);
    this.startPad(246.94, 0.032);
    this.startPad(329.63, 0.018);
    this.loopStart = ctx.currentTime + 0.2;
    this.nextNote = 0;
    this.tickMusic();
  };

  GameAudio.prototype.startPad = function (freq, gain) {
    var ctx = this.ctx;
    var osc = ctx.createOscillator();
    var lfo = ctx.createOscillator();
    var lfoGain = ctx.createGain();
    var amp = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    lfo.type = "sine";
    lfo.frequency.value = 0.07 + freq / 8000;
    lfoGain.gain.value = gain * 0.35;
    amp.gain.value = gain;
    lfo.connect(lfoGain);
    lfoGain.connect(amp.gain);
    osc.connect(amp);
    amp.connect(this.musicGain);
    osc.start();
    lfo.start();
    this.padNodes.push(osc, lfo);
  };

  GameAudio.prototype.playMelodyNote = function (freq, duration, when) {
    var ctx = this.ctx;
    if (!ctx || !this.musicGain) {
      return;
    }
    var osc = ctx.createOscillator();
    var amp = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, when);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, when);
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(0.085, when + 0.08);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(filter);
    filter.connect(amp);
    amp.connect(this.musicGain);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  };

  GameAudio.prototype.tickMusic = function () {
    var self = this;
    if (!this.musicPlaying || !this.ctx) {
      return;
    }
    var ctx = this.ctx;
    var horizon = ctx.currentTime + 1.1;
    while (true) {
      var beat = MELODY[this.nextNote][0];
      var when = this.loopStart + beat * BEAT;
      if (when > horizon) {
        break;
      }
      this.playMelodyNote(MELODY[this.nextNote][1], MELODY[this.nextNote][2] * BEAT, Math.max(when, ctx.currentTime + 0.02));
      this.nextNote += 1;
      if (this.nextNote >= MELODY.length) {
        this.nextNote = 0;
        this.loopStart += LOOP_BEATS * BEAT;
      }
    }
    this.timer = global.setTimeout(function () {
      self.tickMusic();
    }, 180);
  };

  GameAudio.prototype.stopMusic = function () {
    if (this.timer) {
      global.clearTimeout(this.timer);
      this.timer = null;
    }
    var ctx = this.ctx;
    if (this.musicGain && ctx) {
      this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
      this.musicGain.gain.setValueAtTime(Math.max(0.0001, this.musicGain.gain.value), ctx.currentTime);
      this.musicGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    }
    var nodes = this.padNodes.slice();
    this.padNodes = [];
    global.setTimeout(function () {
      nodes.forEach(function (node) {
        try {
          node.stop();
          node.disconnect();
        } catch (err) {
          return;
        }
      });
    }, 280);
    this.musicPlaying = false;
    this.musicGain = null;
  };

  GameAudio.prototype.setMusic = function (on) {
    this.musicOn = !!on;
    this.savePrefs();
    if (this.musicOn) {
      this.ensure();
      this.startMusic();
    } else {
      this.stopMusic();
    }
  };

  GameAudio.prototype.setSfx = function (on) {
    this.sfxOn = !!on;
    this.savePrefs();
    if (this.sfxOn) {
      this.ensure();
    }
  };

  GameAudio.prototype.toggleMusic = function () {
    this.setMusic(!this.musicOn);
    return this.musicOn;
  };

  GameAudio.prototype.toggleSfx = function () {
    this.setSfx(!this.sfxOn);
    return this.sfxOn;
  };

  global.GameAudio = GameAudio;
})(typeof window !== "undefined" ? window : global);
