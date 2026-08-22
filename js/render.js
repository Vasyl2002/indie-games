(function (global) {
  "use strict";

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function layoutBottles(count, width, height) {
    var rows = count <= 5 ? 1 : 2;
    var topCount = Math.ceil(count / rows);
    var bottomCount = count - topCount;
    var maxCols = Math.max(topCount, bottomCount || topCount);
    var paddingX = Math.max(18, width * 0.06);
    var paddingY = Math.max(16, height * 0.08);
    var gapX = Math.max(10, width * 0.028);
    var gapY = Math.max(28, height * 0.1);
    var availableW = width - paddingX * 2 - gapX * (maxCols - 1);
    var bottleW = Math.min(78, Math.max(44, availableW / maxCols));
    var bottleH = Math.min(bottleW * 2.75, (height - paddingY * 2 - (rows - 1) * gapY) / rows);
    var views = [];
    var placed = 0;

    function placeRow(rowIndex, rowCount) {
      var rowWidth = rowCount * bottleW + (rowCount - 1) * gapX;
      var startX = (width - rowWidth) / 2 + bottleW / 2;
      var startY;
      if (rows === 1) {
        startY = height * 0.52;
      } else {
        startY = paddingY + bottleH / 2 + rowIndex * (bottleH + gapY);
      }
      for (var i = 0; i < rowCount; i += 1) {
        views.push({
          index: placed,
          baseX: startX + i * (bottleW + gapX),
          baseY: startY,
          x: startX + i * (bottleW + gapX),
          y: startY,
          w: bottleW,
          h: bottleH,
          lift: 0,
          angle: 0,
          shake: 0,
          glow: 0,
        });
        placed += 1;
      }
    }

    placeRow(0, topCount);
    if (rows === 2) {
      placeRow(1, bottomCount);
    }
    return views;
  }

  function colorOf(id) {
    return GameConfig.COLOR_BY_ID[id] || GameConfig.PALETTE[0];
  }

  function mouthPoint(view) {
    var ang = view.angle || 0;
    var ly = -view.h / 2;
    return {
      x: view.x - ly * Math.sin(ang),
      y: view.y + ly * Math.cos(ang),
    };
  }

  function drawRoundBottlePath(ctx, w, h) {
    var neckW = w * 0.4;
    var neckH = h * 0.15;
    var bodyW = w;
    var bodyTop = -h / 2 + neckH;
    var bottom = h / 2;
    var radius = bodyW * 0.32;
    ctx.beginPath();
    ctx.moveTo(-neckW / 2, -h / 2 + 6);
    ctx.lineTo(-neckW / 2, bodyTop + 8);
    ctx.quadraticCurveTo(-bodyW / 2, bodyTop + 8, -bodyW / 2, bodyTop + 26);
    ctx.lineTo(-bodyW / 2, bottom - radius);
    ctx.quadraticCurveTo(-bodyW / 2, bottom, 0, bottom);
    ctx.quadraticCurveTo(bodyW / 2, bottom, bodyW / 2, bottom - radius);
    ctx.lineTo(bodyW / 2, bodyTop + 26);
    ctx.quadraticCurveTo(bodyW / 2, bodyTop + 8, neckW / 2, bodyTop + 8);
    ctx.lineTo(neckW / 2, -h / 2 + 6);
    ctx.quadraticCurveTo(neckW / 2, -h / 2, 0, -h / 2);
    ctx.quadraticCurveTo(-neckW / 2, -h / 2, -neckW / 2, -h / 2 + 6);
    ctx.closePath();
  }

  function drawLiquid(ctx, bottle, capacity, w, h) {
    if (!bottle.length) {
      return;
    }
    var neckH = h * 0.15;
    var innerTop = -h / 2 + neckH + 14;
    var innerBottom = h / 2 - 6;
    var innerH = innerBottom - innerTop;
    var layerH = innerH / capacity;
    var innerW = w * 0.78;

    ctx.save();
    drawRoundBottlePath(ctx, w * 0.92, h * 0.96);
    ctx.clip();

    for (var i = 0; i < bottle.length; i += 1) {
      var color = colorOf(bottle[i]);
      var y1 = innerBottom - (i + 1) * layerH;
      var y2 = innerBottom - i * layerH;
      var gradient = ctx.createLinearGradient(-innerW / 2, y1, innerW / 2, y2);
      gradient.addColorStop(0, color.glow);
      gradient.addColorStop(0.45, color.fill);
      gradient.addColorStop(1, color.deep);
      ctx.fillStyle = gradient;
      ctx.fillRect(-innerW / 2, y1, innerW, y2 - y1 + 0.6);

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(-innerW / 2 + 4, y1 + 2, innerW * 0.18, Math.max(3, layerH - 4));
    }

    var top = innerBottom - bottle.length * layerH;
    var topColor = colorOf(bottle[bottle.length - 1]);
    ctx.fillStyle = topColor.glow;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(0, top + 2, innerW / 2 - 1, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawBottle(ctx, view, bottle, capacity, selected, complete) {
    ctx.save();
    ctx.translate(view.x, view.y - view.lift);
    ctx.rotate(view.angle || 0);
    if (view.shake) {
      ctx.translate(Math.sin(view.shake * 28) * 5, 0);
    }

    ctx.save();
    ctx.translate(4, 8);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    drawRoundBottlePath(ctx, view.w, view.h);
    ctx.fill();
    ctx.restore();

    if (selected || complete || view.glow) {
      ctx.save();
      ctx.shadowColor = complete ? "#fff4a8" : selected ? "#7be7ff" : "rgba(255,255,255,0.4)";
      ctx.shadowBlur = 22 + view.glow * 16;
      ctx.strokeStyle = complete ? "rgba(255,232,120,0.85)" : "rgba(130,230,255,0.75)";
      ctx.lineWidth = 5;
      drawRoundBottlePath(ctx, view.w, view.h);
      ctx.stroke();
      ctx.restore();
    }

    var glass = ctx.createLinearGradient(-view.w / 2, -view.h / 2, view.w / 2, view.h / 2);
    glass.addColorStop(0, "rgba(210,235,255,0.16)");
    glass.addColorStop(0.5, "rgba(160,200,255,0.07)");
    glass.addColorStop(1, "rgba(80,120,180,0.12)");
    ctx.fillStyle = glass;
    drawRoundBottlePath(ctx, view.w, view.h);
    ctx.fill();

    drawLiquid(ctx, bottle, capacity, view.w, view.h);

    ctx.strokeStyle = "rgba(230,246,255,0.72)";
    ctx.lineWidth = 2.2;
    drawRoundBottlePath(ctx, view.w, view.h);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.38)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-view.w * 0.22, -view.h * 0.18);
    ctx.quadraticCurveTo(-view.w * 0.28, 0, -view.w * 0.18, view.h * 0.28);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(0, -view.h / 2 + 3, view.w * 0.22, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (complete && bottle.length) {
      ctx.fillStyle = "rgba(255,240,150,0.95)";
      ctx.beginPath();
      ctx.arc(view.w * 0.28, -view.h * 0.32, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawStream(ctx, from, to, color) {
    var midY = (from.y + to.y) / 2;
    ctx.save();
    ctx.strokeStyle = color.fill;
    ctx.shadowColor = color.glow;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo((from.x + to.x) / 2, midY + 16, to.x, to.y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function hitTest(views, x, y) {
    for (var i = 0; i < views.length; i += 1) {
      var view = views[i];
      if (
        Math.abs(x - view.x) <= view.w * 0.62 &&
        Math.abs(y - (view.y - view.lift)) <= view.h * 0.58
      ) {
        return view.index;
      }
    }
    return -1;
  }

  global.GameRender = {
    lerp: lerp,
    easeInOut: easeInOut,
    layoutBottles: layoutBottles,
    colorOf: colorOf,
    mouthPoint: mouthPoint,
    drawBottle: drawBottle,
    drawStream: drawStream,
    hitTest: hitTest,
  };
})(typeof window !== "undefined" ? window : global);
