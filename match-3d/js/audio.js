(function (global) {
  "use strict";

  function midi(n) {
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  function addNote(data, sampleRate, freq, startSec, durSec, gain, type) {
    var start = Math.max(0, Math.floor(startSec * sampleRate));
    var len = Math.max(1, Math.floor(durSec * sampleRate));
    var attack = Math.min(0.02, durSec * 0.25);
    var release = Math.min(0.08, durSec * 0.35);
    var i;
    var t;
    var env;
    var phase;
    var sample;
    var cycle;
    for (i = 0; i < len && start + i < data.length; i += 1) {
      t = i / sampleRate;
      env = 1;
      if (t < attack) {
        env = t / attack;
      } else if (t > durSec - release) {
        env = Math.max(0, (durSec - t) / release);
      }
      cycle = freq * t;
      if (type === "triangle") {
        sample = 1 - 4 * Math.abs(Math.round(cycle - 0.25) - (cycle - 0.25));
      } else {
        phase = cycle * Math.PI * 2;
        sample = Math.sin(phase);
      }
      data[start + i] += sample * env * gain;
    }
  }

  function MatchAudio() {
    this.ctx = null;
    this.enabled = true;
    this.muted = false;
    this.musicOn = false;
    this.musicSource = null;
    this.musicBuffer = null;
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
      this.musicGain.gain.value = this.muted ? 0 : 0.38;
      this.sfxGain.gain.value = 0.7;
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      this.musicBuffer = this.buildLoopBuffer();
    }
    if (this.ctx.state === "suspended" && this.ctx.resume) {
      try {
        this.ctx.resume();
      } catch (err) {
        /* iOS can reject resume outside a gesture; caller retries on tap */
      }
    }
    return this.ctx;
  };

  MatchAudio.prototype.buildLoopBuffer = function () {
    var ctx = this.ctx;
    var bpm = 126;
    var beat = 60 / bpm;
    var loopBeats = 16;
    var duration = loopBeats * beat;
    var sampleRate = ctx.sampleRate || 44100;
    var length = Math.max(1, Math.floor(sampleRate * duration));
    var buffer = ctx.createBuffer(1, length, sampleRate);
    var data = buffer.getChannelData(0);
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
    var peak = 0.0001;
    var i;
    melody.forEach(function (n) {
      addNote(data, sampleRate, midi(n[1]), n[0] * beat, n[2] * beat, 0.42, "triangle");
    });
    bass.forEach(function (n) {
      addNote(data, sampleRate, midi(n[1]), n[0] * beat, n[2] * beat, 0.32, "sine");
    });
    sparkle.forEach(function (n) {
      addNote(data, sampleRate, midi(n[1]), n[0] * beat, n[2] * beat, 0.14, "sine");
    });
    for (i = 0; i < data.length; i += 1) {
      peak = Math.max(peak, Math.abs(data[i]));
    }
    if (peak > 0.9) {
      for (i = 0; i < data.length; i += 1) {
        data[i] *= 0.9 / peak;
      }
    }
    return buffer;
  };

  MatchAudio.prototype.unlockAndPlay = function () {
    var ctx = this.ensure();
    if (!ctx) {
      return;
    }
    if (!this.muted) {
      this.startMusic();
    }
  };

  MatchAudio.prototype.applyMusicGain = function () {
    if (!this.musicGain) {
      return;
    }
    var value = this.muted ? 0 : 0.38;
    if (this.ctx && this.musicGain.gain.setValueAtTime) {
      try {
        this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGain.gain.setValueAtTime(value, this.ctx.currentTime);
        return;
      } catch (err) {
        /* fall through */
      }
    }
    this.musicGain.gain.value = value;
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
    if (this.musicSource) {
      try {
        this.musicSource.stop(0);
      } catch (err) {
        /* already stopped */
      }
      try {
        this.musicSource.disconnect();
      } catch (err2) {
        /* ignore */
      }
      this.musicSource = null;
    }
  };

  MatchAudio.prototype.startMusic = function () {
    var ctx = this.ctx;
    if (!ctx || this.muted) {
      return;
    }
    if (this.musicOn && this.musicSource) {
      return;
    }
    this.stopMusic();
    if (!this.musicBuffer) {
      this.musicBuffer = this.buildLoopBuffer();
    }
    if (!this.musicBuffer || !this.musicGain) {
      return;
    }
    var source = ctx.createBufferSource();
    source.buffer = this.musicBuffer;
    source.loop = true;
    source.connect(this.musicGain);
    try {
      source.start(0);
    } catch (err) {
      return;
    }
    this.musicSource = source;
    this.musicOn = true;
    this.applyMusicGain();
  };

  MatchAudio.prototype.beep = function (freq, dur, type, gain) {
    if (!this.enabled) {
      return;
    }
    var ctx = this.ensure();
    if (!ctx || !this.sfxGain) {
      return;
    }
    var now = ctx.currentTime || 0;
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
