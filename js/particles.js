(function (global) {
  "use strict";

  function Particles() {
    this.items = [];
  }

  Particles.prototype.spawn = function (x, y, color, count, speed) {
    var n = count || 12;
    var v = speed || 140;
    for (var i = 0; i < n; i += 1) {
      var angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      var power = v * (0.35 + Math.random() * 0.8);
      this.items.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power - 40,
        life: 0.45 + Math.random() * 0.45,
        max: 0.9,
        size: 2.5 + Math.random() * 3.5,
        color: color,
        gravity: 220,
      });
    }
  };

  Particles.prototype.stream = function (x1, y1, x2, y2, color) {
    this.items.push({
      x: x1,
      y: y1,
      vx: (x2 - x1) * 3.2,
      vy: (y2 - y1) * 3.2,
      life: 0.18,
      max: 0.18,
      size: 4,
      color: color,
      gravity: 80,
    });
  };

  Particles.prototype.confetti = function (width, height) {
    var colors = GameConfig.PALETTE;
    for (var i = 0; i < 70; i += 1) {
      var color = colors[i % colors.length];
      this.items.push({
        x: Math.random() * width,
        y: -20 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 180,
        vy: 80 + Math.random() * 180,
        life: 1.6 + Math.random(),
        max: 2.2,
        size: 4 + Math.random() * 5,
        color: color.fill,
        gravity: 90,
      });
    }
  };

  Particles.prototype.update = function (dt) {
    for (var i = this.items.length - 1; i >= 0; i -= 1) {
      var p = this.items[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      if (p.life <= 0) {
        this.items.splice(i, 1);
      }
    }
  };

  Particles.prototype.draw = function (ctx) {
    for (var i = 0; i < this.items.length; i += 1) {
      var p = this.items[i];
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  global.Particles = Particles;
})(typeof window !== "undefined" ? window : global);
