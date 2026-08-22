(function () {
  "use strict";

  var logic = SortLogic;
  var render = GameRender;
  var config = GameConfig;

  var canvas = document.getElementById("board");
  var ctx = canvas.getContext("2d");
  var particles = new Particles();
  var audio = new GameAudio();

  var state = {
    screen: "menu",
    levelIndex: 0,
    bottles: [],
    views: [],
    selected: -1,
    capacity: config.CAPACITY,
    timeLeft: config.LEVEL_TIME,
    moves: 0,
    history: [],
    pouring: null,
    overlay: null,
    slogan: config.SLOGANS[0],
    lastTick: 0,
    stars: 0,
    unlocked: 1,
  };

  function loadProgress() {
    try {
      var raw = localStorage.getItem("magic-sort-progress");
      if (!raw) {
        return;
      }
      var data = JSON.parse(raw);
      if (data.unlocked) {
        state.unlocked = data.unlocked;
      }
    } catch (err) {
      state.unlocked = 1;
    }
  }

  function saveProgress() {
    localStorage.setItem(
      "magic-sort-progress",
      JSON.stringify({ unlocked: state.unlocked })
    );
  }

  function formatTime(seconds) {
    var total = Math.max(0, Math.ceil(seconds));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function currentLevel() {
    return LEVELS[state.levelIndex];
  }

  function showScreen(name) {
    state.screen = name;
    document.querySelectorAll(".screen").forEach(function (el) {
      el.classList.toggle("hidden", el.id !== "screen-" + name);
    });
    if (name === "game") {
      resize();
    }
  }

  function renderLevelGrid() {
    var grid = document.getElementById("level-grid");
    grid.innerHTML = "";
    LEVELS.forEach(function (level, index) {
      var button = document.createElement("button");
      var locked = index + 1 > state.unlocked;
      button.className = "level-card " + level.difficulty + (locked ? " locked" : "");
      button.disabled = locked;
      button.innerHTML =
        '<span class="level-num">' +
        level.id +
        "</span>" +
        '<span class="level-name">' +
        level.name +
        "</span>" +
        '<span class="level-diff">' +
        config.DIFFICULTY[level.difficulty].label +
        "</span>";
      button.addEventListener("click", function () {
        startLevel(index);
      });
      grid.appendChild(button);
    });
  }

  function startLevel(index) {
    var level = LEVELS[index];
    state.levelIndex = index;
    state.bottles = logic.cloneBottles(level.bottles);
    state.capacity = level.capacity || config.CAPACITY;
    state.timeLeft = level.time || config.LEVEL_TIME;
    state.moves = 0;
    state.history = [];
    state.selected = -1;
    state.pouring = null;
    state.overlay = null;
    state.slogan = config.SLOGANS[index % config.SLOGANS.length];
    hideOverlay();
    document.getElementById("hud-level").textContent = "Ур. " + level.id;
    document.getElementById("hud-name").textContent = level.name;
    document.getElementById("hud-diff").textContent = config.DIFFICULTY[level.difficulty].label;
    document.getElementById("hud-diff").className = "chip " + level.difficulty;
    document.getElementById("hud-moves").textContent = "0";
    document.getElementById("slogan").textContent = state.slogan;
    updateTimer();
    showScreen("game");
    resize();
  }

  function snapshot() {
    return {
      bottles: logic.cloneBottles(state.bottles),
      moves: state.moves,
    };
  }

  function updateTimer() {
    var el = document.getElementById("hud-time");
    el.textContent = formatTime(state.timeLeft);
    el.classList.toggle("urgent", state.timeLeft <= 15);
  }

  function resize() {
    if (state.screen !== "game") {
      return;
    }
    var wrap = canvas.parentElement;
    var rect = wrap.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, rect.width * dpr);
    canvas.height = Math.max(1, rect.height * dpr);
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuildViews(rect.width, rect.height);
  }

  function rebuildViews(width, height) {
    var previous = state.views;
    state.views = render.layoutBottles(state.bottles.length, width, height);
    if (previous && previous.length === state.views.length) {
      state.views.forEach(function (view, i) {
        view.lift = previous[i].lift;
        view.angle = previous[i].angle;
        view.glow = previous[i].glow;
      });
    }
  }

  function canvasPoint(event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function selectBottle(index) {
    if (state.pouring || state.overlay) {
      return;
    }
    if (index < 0) {
      state.selected = -1;
      return;
    }
    if (state.selected < 0) {
      if (!state.bottles[index].length) {
        audio.invalid();
        shakeBottle(index);
        return;
      }
      if (
        state.bottles[index].length === state.capacity &&
        logic.isBottleComplete(state.bottles[index], state.capacity)
      ) {
        audio.invalid();
        return;
      }
      state.selected = index;
      audio.select();
      return;
    }
    if (state.selected === index) {
      state.selected = -1;
      return;
    }
    tryPour(state.selected, index);
  }

  function shakeBottle(index) {
    var view = state.views[index];
    if (!view) {
      return;
    }
    view.shake = 1;
  }

  function tryPour(from, to) {
    if (!logic.canPour(state.bottles[from], state.bottles[to], state.capacity)) {
      audio.invalid();
      shakeBottle(to);
      state.selected = -1;
      return;
    }
    var amount = logic.pourAmount(state.bottles[from], state.bottles[to], state.capacity);
    state.history.push(snapshot());
    state.pouring = {
      from: from,
      to: to,
      amount: amount,
      color: logic.topColor(state.bottles[from]),
      transferred: 0,
      t: 0,
      phase: "travel",
    };
    state.selected = -1;
  }

  function finishPour() {
    var pour = state.pouring;
    if (!pour) {
      return;
    }
    var actual = logic.pour(state.bottles[pour.from], state.bottles[pour.to], state.capacity);
    state.moves += 1;
    document.getElementById("hud-moves").textContent = String(state.moves);
    audio.pour();
    var dest = state.views[pour.to];
    var color = render.colorOf(pour.color);
    particles.spawn(dest.x, dest.y + dest.h * 0.15, color.glow, 14, 160);
    if (
      logic.isBottleComplete(state.bottles[pour.to], state.capacity) &&
      state.bottles[pour.to].length === state.capacity
    ) {
      audio.complete();
      particles.spawn(dest.x, dest.y, "#ffe14a", 20, 200);
    }
    if (logic.isSolved(state.bottles, state.capacity)) {
      winLevel();
    }
    return actual;
  }

  function starCount(timeLeft) {
    if (timeLeft >= 45) {
      return 3;
    }
    if (timeLeft >= 20) {
      return 2;
    }
    return 1;
  }

  function winLevel() {
    state.stars = starCount(state.timeLeft);
    if (state.levelIndex + 2 > state.unlocked) {
      state.unlocked = Math.min(LEVELS.length, state.levelIndex + 2);
      saveProgress();
    }
    audio.win();
    particles.confetti(canvas.clientWidth, canvas.clientHeight);
    showOverlay(
      "win",
      "Уровень пройден!",
      currentLevel().name +
        " · " +
        formatTime(state.timeLeft) +
        " осталось · " +
        state.moves +
        " ходов"
    );
  }

  function loseLevel() {
    audio.lose();
    showOverlay("lose", "Время вышло!", "Попробуй ещё раз — у тебя 1:30 на каждый уровень.");
  }

  function showOverlay(kind, title, detail) {
    state.overlay = kind;
    var overlay = document.getElementById("overlay");
    document.getElementById("overlay-title").textContent = title;
    document.getElementById("overlay-detail").textContent = detail;
    var stars = document.getElementById("overlay-stars");
    stars.innerHTML = "";
    if (kind === "win") {
      for (var i = 0; i < 3; i += 1) {
        var star = document.createElement("span");
        star.className = "star" + (i < state.stars ? " on" : "");
        star.textContent = "★";
        stars.appendChild(star);
      }
    }
    document.getElementById("btn-next").classList.toggle("hidden", kind !== "win" || state.levelIndex >= LEVELS.length - 1);
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    document.getElementById("overlay").classList.add("hidden");
    state.overlay = null;
  }

  function undo() {
    if (state.pouring || !state.history.length || state.overlay) {
      return;
    }
    var prev = state.history.pop();
    state.bottles = prev.bottles;
    state.moves = prev.moves;
    state.selected = -1;
    document.getElementById("hud-moves").textContent = String(state.moves);
  }

  function restart() {
    startLevel(state.levelIndex);
  }

  function updatePour(dt) {
    var pour = state.pouring;
    if (!pour) {
      return;
    }
    pour.t += dt;
    var src = state.views[pour.from];
    var dst = state.views[pour.to];
    var dir = dst.x >= src.baseX ? 1 : -1;
    if (pour.phase === "travel") {
      var u = render.easeInOut(Math.min(1, pour.t / 0.28));
      src.x = render.lerp(src.baseX, dst.baseX + dir * (dst.w * 0.85), u);
      src.y = render.lerp(src.baseY, dst.baseY - dst.h * 0.72, u);
      src.lift = render.lerp(18, 8, u);
      src.angle = render.lerp(0, dir * 1.15, u);
      if (pour.t >= 0.28) {
        pour.phase = "flow";
        pour.t = 0;
      }
    } else if (pour.phase === "flow") {
      src.x = dst.baseX + dir * (dst.w * 0.85);
      src.y = dst.baseY - dst.h * 0.72;
      src.angle = dir * 1.15;
      var color = render.colorOf(pour.color);
      var from = render.mouthPoint(src);
      var to = { x: dst.baseX, y: dst.baseY - dst.h * 0.42 };
      particles.stream(from.x, from.y, to.x, to.y, color.fill);
      if (pour.t >= 0.22) {
        finishPour();
        pour.phase = "return";
        pour.t = 0;
        state.pouring = pour;
      }
    } else if (pour.phase === "return") {
      var r = render.easeInOut(Math.min(1, pour.t / 0.26));
      src.x = render.lerp(dst.baseX + dir * (dst.w * 0.85), src.baseX, r);
      src.y = render.lerp(dst.baseY - dst.h * 0.72, src.baseY, r);
      src.angle = render.lerp(dir * 1.15, 0, r);
      src.lift = render.lerp(8, 0, r);
      if (pour.t >= 0.26) {
        src.x = src.baseX;
        src.y = src.baseY;
        src.angle = 0;
        src.lift = 0;
        state.pouring = null;
      }
    }
  }

  function updateViews(dt) {
    for (var i = 0; i < state.views.length; i += 1) {
      var view = state.views[i];
      var targetLift = state.selected === i ? 22 : 0;
      if (!state.pouring || state.pouring.from !== i) {
        view.lift += (targetLift - view.lift) * Math.min(1, dt * 10);
        view.x += (view.baseX - view.x) * Math.min(1, dt * 8);
        view.y += (view.baseY - view.y) * Math.min(1, dt * 8);
        view.angle += (0 - view.angle) * Math.min(1, dt * 8);
      }
      if (view.shake > 0) {
        view.shake = Math.max(0, view.shake - dt * 3.4);
      }
      var complete =
        state.bottles[i] &&
        state.bottles[i].length === state.capacity &&
        logic.isBottleComplete(state.bottles[i], state.capacity);
      view.glow += ((complete ? 1 : 0) - view.glow) * Math.min(1, dt * 6);
    }
  }

  function draw() {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    var vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      20,
      width / 2,
      height * 0.55,
      Math.max(width, height) * 0.7
    );
    vignette.addColorStop(0, "rgba(86, 40, 140, 0.18)");
    vignette.addColorStop(1, "rgba(6, 8, 28, 0.08)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    var pouring = state.pouring;
    var stream = null;
    if (pouring && pouring.phase === "flow") {
      var src = state.views[pouring.from];
      var dst = state.views[pouring.to];
      stream = {
        from: render.mouthPoint(src),
        to: { x: dst.baseX, y: dst.baseY - dst.h * 0.42 },
        color: render.colorOf(pouring.color),
      };
    }

    for (var i = 0; i < state.views.length; i += 1) {
      var bottle = state.bottles[i] || [];
      var visual = bottle;
      if (pouring && pouring.phase === "flow" && i === pouring.from) {
        visual = bottle.slice(0, Math.max(0, bottle.length - pouring.amount));
      }
      render.drawBottle(
        ctx,
        state.views[i],
        visual,
        state.capacity,
        state.selected === i,
        bottle.length === state.capacity && logic.isBottleComplete(bottle, state.capacity)
      );
    }

    if (stream) {
      render.drawStream(ctx, stream.from, stream.to, stream.color);
    }
    particles.draw(ctx);
  }

  function frame(now) {
    var dt = Math.min(0.035, (now - state.lastTick) / 1000 || 0.016);
    state.lastTick = now;

    if (state.screen === "game" && !state.overlay && !state.pouring) {
      var before = Math.ceil(state.timeLeft);
      state.timeLeft -= dt;
      if (state.timeLeft <= 15 && Math.ceil(state.timeLeft) < before && state.timeLeft > 0) {
        audio.tick();
      }
      updateTimer();
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        updateTimer();
        loseLevel();
      }
    }

    if (state.screen === "game") {
      updatePour(dt);
      updateViews(dt);
      particles.update(dt);
      draw();
    }

    requestAnimationFrame(frame);
  }

  function createStars() {
    var sky = document.getElementById("stars");
    var html = "";
    for (var i = 0; i < 70; i += 1) {
      var left = Math.random() * 100;
      var top = Math.random() * 100;
      var size = 1 + Math.random() * 2.4;
      var delay = Math.random() * 4;
      html +=
        '<span style="left:' +
        left +
        "%;top:" +
        top +
        "%;width:" +
        size +
        "px;height:" +
        size +
        "px;animation-delay:" +
        delay +
        's"></span>';
    }
    sky.innerHTML = html;
  }

  function bindUi() {
    document.getElementById("btn-play").addEventListener("click", function () {
      renderLevelGrid();
      showScreen("levels");
    });
    document.getElementById("btn-howto").addEventListener("click", function () {
      document.getElementById("howto").classList.toggle("hidden");
    });
    document.getElementById("btn-back").addEventListener("click", function () {
      showScreen("menu");
    });
    document.getElementById("btn-menu").addEventListener("click", function () {
      hideOverlay();
      renderLevelGrid();
      showScreen("levels");
    });
    document.getElementById("btn-undo").addEventListener("click", undo);
    document.getElementById("btn-restart").addEventListener("click", restart);
    document.getElementById("btn-retry").addEventListener("click", restart);
    document.getElementById("btn-next").addEventListener("click", function () {
      startLevel(Math.min(LEVELS.length - 1, state.levelIndex + 1));
    });
    document.getElementById("btn-overlay-menu").addEventListener("click", function () {
      hideOverlay();
      renderLevelGrid();
      showScreen("levels");
    });

    canvas.addEventListener("pointerdown", function (event) {
      audio.ensure();
      if (state.screen !== "game" || state.overlay || state.pouring) {
        return;
      }
      var point = canvasPoint(event);
      selectBottle(render.hitTest(state.views, point.x, point.y));
    });

    window.addEventListener("resize", resize);
    document.addEventListener(
      "pointerdown",
      function () {
        audio.ensure();
      },
      { once: true }
    );
  }

  loadProgress();
  createStars();
  bindUi();
  renderLevelGrid();
  var params = new URLSearchParams(window.location.search);
  var startAt = parseInt(params.get("level"), 10);
  if (params.get("screen") === "levels") {
    state.unlocked = LEVELS.length;
    renderLevelGrid();
    showScreen("levels");
  } else if (startAt >= 1 && startAt <= LEVELS.length) {
    state.unlocked = Math.max(state.unlocked, startAt);
    startLevel(startAt - 1);
  }
  requestAnimationFrame(frame);
})();
