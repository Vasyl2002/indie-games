(function () {
  "use strict";

  var TRAY_SIZE = MatchConfig.TRAY_SIZE;
  var MATCH_SIZE = MatchConfig.MATCH_SIZE;
  var canvas = document.getElementById("view");
  var audio = new MatchAudio();
  var ads = new GameAds();

  var i18n = {
    lang: "en",
    en: {
      tagline: "3D MATCH",
      lead: "Tap toys from the pile, pair two identical ones in the 6-slot tray, and clear the goals before time runs out.",
      play: "Play",
      levels: "Levels",
      back: "Back",
      levelsTitle: "Levels",
      shuffle: "Shuffle",
      restart: "Restart",
      menu: "Menu",
      next: "Next",
      retry: "Retry",
      toLevels: "Levels",
      adBtn: "Watch ad +1:00",
      win: "Level complete!",
      loseTime: "Time's up!",
      loseTray: "Tray is full!",
      winDetail: "Nice pairing!",
      loseTimeDetail: "Watch an ad for one extra minute, or retry.",
      loseTrayDetail: "Match two identical toys before all 6 slots fill.",
      level: "LEVEL",
    },
    ru: {
      tagline: "3D МАТЧ",
      lead: "Нажимай игрушки в куче, собирай пары в лотке из 6 слотов и закрой цели до конца таймера.",
      play: "Играть",
      levels: "Уровни",
      back: "Назад",
      levelsTitle: "Уровни",
      shuffle: "Перемешать",
      restart: "Заново",
      menu: "Меню",
      next: "Дальше",
      retry: "Ещё раз",
      toLevels: "Уровни",
      adBtn: "Реклама +1:00",
      win: "Уровень пройден!",
      loseTime: "Время вышло!",
      loseTray: "Лоток заполнен!",
      winDetail: "Отличные пары!",
      loseTimeDetail: "Посмотри рекламу и получи ещё минуту — или начни заново.",
      loseTrayDetail: "Собери две одинаковые игрушки, пока не заняты все 6 слотов.",
      level: "УРОВЕНЬ",
    },
    t: function (key) {
      return (this[this.lang] || this.en)[key] || this.en[key] || key;
    },
  };

  var state = {
    screen: "menu",
    levelIndex: 0,
    unlocked: 1,
    goals: {},
    tray: [],
    pile: [],
    flying: [],
    timeLeft: 60,
    lastTick: 0,
    overlay: null,
    busy: false,
    adUsed: false,
    paused: false,
  };

  var scene, camera, renderer, raycaster, pointer, pileGroup, clock;

  function loadProgress() {
    try {
      var data = JSON.parse(localStorage.getItem("pair-pop-progress") || "{}");
      if (data.unlocked) {
        state.unlocked = data.unlocked;
      }
      if (data.lang === "ru" || data.lang === "en") {
        i18n.lang = data.lang;
      }
    } catch (err) {
      state.unlocked = 1;
    }
  }

  function saveProgress() {
    localStorage.setItem(
      "pair-pop-progress",
      JSON.stringify({ unlocked: state.unlocked, lang: i18n.lang })
    );
  }

  function t(key) {
    return i18n.t(key);
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

  function applyLang() {
    document.documentElement.lang = i18n.lang;
    document.getElementById("tagline").textContent = t("tagline");
    document.getElementById("lead").textContent = t("lead");
    document.getElementById("btn-play").textContent = t("play");
    document.getElementById("btn-levels").textContent = t("levels");
    document.getElementById("btn-back").textContent = t("back");
    document.getElementById("levels-title").textContent = t("levelsTitle");
    document.getElementById("btn-shuffle").textContent = t("shuffle");
    document.getElementById("btn-restart").textContent = t("restart");
    document.getElementById("btn-menu").textContent = t("menu");
    document.getElementById("btn-next").textContent = t("next");
    document.getElementById("btn-retry").textContent = t("retry");
    document.getElementById("btn-overlay-menu").textContent = t("toLevels");
    document.getElementById("btn-ad").textContent = t("adBtn");
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === i18n.lang);
    });
    if (state.screen === "levels") {
      renderLevelGrid();
    }
    if (state.screen === "game") {
      document.getElementById("hud-level").textContent = t("level") + " " + (state.levelIndex + 1);
      renderGoals();
    }
  }

  function renderLevelGrid() {
    var grid = document.getElementById("level-grid");
    grid.innerHTML = "";
    MATCH_LEVELS.forEach(function (level, index) {
      var btn = document.createElement("button");
      btn.className = "level-card" + (index + 1 > state.unlocked ? " locked" : "");
      btn.disabled = index + 1 > state.unlocked;
      btn.textContent = String(level.id);
      btn.addEventListener("click", function () {
        startLevel(index);
      });
      grid.appendChild(btn);
    });
  }

  function initThree() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
    camera.position.set(0, 8.4, 8.6);
    camera.lookAt(0, 0.35, 0);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    pileGroup = new THREE.Group();
    scene.add(pileGroup);
    scene.add(new THREE.HemisphereLight(0xfff0ff, 0x223355, 1.15));
    var key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(4, 10, 6);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x88aaff, 0.35);
    rim.position.set(-6, 2, -4);
    scene.add(rim);
    var floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 32),
      new THREE.MeshLambertMaterial({ color: 0x1a1038, transparent: true, opacity: 0.55 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.55;
    scene.add(floor);
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    clock = new THREE.Clock();
    resize();
  }

  function resize() {
    if (!renderer) {
      return;
    }
    var wrap = canvas.parentElement;
    var w = Math.max(1, wrap.clientWidth);
    var h = Math.max(1, wrap.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function clearPile() {
    while (pileGroup.children.length) {
      pileGroup.remove(pileGroup.children[0]);
    }
    state.pile = [];
    state.flying = [];
  }

  function spawnLevel(level) {
    clearPile();
    var bag = [];
    Object.keys(level.goals).forEach(function (type) {
      for (var i = 0; i < level.goals[type]; i += 1) {
        bag.push(type);
      }
    });
    Object.keys(level.extras || {}).forEach(function (type) {
      for (var j = 0; j < level.extras[type]; j += 1) {
        bag.push(type);
      }
    });
    for (var a = bag.length - 1; a > 0; a -= 1) {
      var b = Math.floor(Math.random() * (a + 1));
      var tmp = bag[a];
      bag[a] = bag[b];
      bag[b] = tmp;
    }
    var count = bag.length;
    var radius = 1.15 + Math.min(2.35, Math.sqrt(count) * 0.22);
    bag.forEach(function (type, index) {
      var mesh = MatchItems.createItem(type);
      var angle = (index / count) * Math.PI * 2 + Math.random() * 0.4;
      var r = Math.sqrt((index + 1) / count) * radius * (0.72 + Math.random() * 0.4);
      var y = Math.min(1.9, (index % 7) * 0.16 + Math.random() * 0.18);
      mesh.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r * 0.88);
      mesh.rotation.set(Math.random() * 0.7, Math.random() * Math.PI, Math.random() * 0.7);
      mesh.scale.setScalar(0.88 + Math.random() * 0.18);
      pileGroup.add(mesh);
      state.pile.push(mesh);
    });
    var zoom = 7.6 + Math.min(3.2, count / 28);
    camera.position.set(0, zoom, zoom + 0.8);
    camera.lookAt(0, 0.3, 0);
  }

  function typeIcon(type) {
    var meta = MatchConfig.TYPE_MAP[type];
    return (
      '<div class="icon t-' +
      type +
      '" style="background:' +
      (meta ? meta.color : "#fff") +
      '"></div>'
    );
  }

  function renderGoals() {
    var box = document.getElementById("goals");
    box.innerHTML = "";
    Object.keys(state.goals).forEach(function (type) {
      var el = document.createElement("div");
      el.className = "goal" + (state.goals[type] <= 0 ? " done" : "");
      el.innerHTML =
        '<span class="count">' +
        Math.max(0, state.goals[type]) +
        "</span>" +
        typeIcon(type);
      box.appendChild(el);
    });
  }

  function renderTray() {
    var tray = document.getElementById("tray");
    tray.innerHTML = "";
    for (var i = 0; i < TRAY_SIZE; i += 1) {
      var slot = document.createElement("div");
      var item = state.tray[i];
      slot.className = "slot" + (item ? " filled" : "");
      if (item) {
        slot.innerHTML = typeIcon(item.type);
      }
      tray.appendChild(slot);
    }
  }

  function formatTime(seconds) {
    var total = Math.max(0, Math.ceil(seconds));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function updateTimer() {
    var el = document.getElementById("hud-time");
    document.getElementById("hud-time-text").textContent = formatTime(state.timeLeft);
    el.classList.toggle("urgent", state.timeLeft <= 15);
  }

  function startLevel(index) {
    var level = MATCH_LEVELS[index];
    state.levelIndex = index;
    state.goals = Object.assign({}, level.goals);
    state.tray = [];
    state.timeLeft = level.time;
    state.overlay = null;
    state.busy = false;
    state.adUsed = false;
    state.paused = false;
    hideOverlay();
    document.getElementById("hud-level").textContent = t("level") + " " + level.id;
    spawnLevel(level);
    renderGoals();
    renderTray();
    updateTimer();
    showScreen("game");
    resize();
  }

  function firstEmptySlot() {
    return state.tray.length;
  }

  function canPlace() {
    return state.tray.length < TRAY_SIZE;
  }

  function countType(type) {
    var n = 0;
    state.tray.forEach(function (item) {
      if (item && item.type === type) {
        n += 1;
      }
    });
    return n;
  }

  function tryMatch(type) {
    if (countType(type) < MATCH_SIZE) {
      return false;
    }
    var removed = 0;
    state.tray = state.tray.filter(function (item) {
      if (item.type === type && removed < MATCH_SIZE) {
        removed += 1;
        return false;
      }
      return true;
    });
    if (state.goals[type] != null) {
      state.goals[type] = Math.max(0, state.goals[type] - MATCH_SIZE);
    }
    audio.match();
    renderGoals();
    renderTray();
    checkWin();
    return true;
  }

  function checkWin() {
    var left = Object.keys(state.goals).some(function (type) {
      return state.goals[type] > 0;
    });
    if (!left) {
      winLevel();
    }
  }

  function winLevel() {
    if (state.overlay) {
      return;
    }
    if (state.levelIndex + 2 > state.unlocked) {
      state.unlocked = Math.min(MATCH_LEVELS.length, state.levelIndex + 2);
      saveProgress();
    }
    audio.win();
    showOverlay("win", t("win"), t("winDetail"), false);
  }

  function loseLevel(kind) {
    if (state.overlay) {
      return;
    }
    audio.lose();
    var extra = kind === "time" && !state.adUsed;
    showOverlay(
      "lose",
      kind === "time" ? t("loseTime") : t("loseTray"),
      kind === "time" ? t("loseTimeDetail") : t("loseTrayDetail"),
      extra
    );
  }

  function showOverlay(kind, title, detail, showAd) {
    state.overlay = kind;
    state.paused = true;
    document.getElementById("overlay-title").textContent = title;
    document.getElementById("overlay-detail").textContent = detail;
    document.getElementById("btn-next").classList.toggle("hidden", kind !== "win" || state.levelIndex >= MATCH_LEVELS.length - 1);
    document.getElementById("btn-ad").classList.toggle("hidden", !showAd);
    document.getElementById("overlay").classList.remove("hidden");
  }

  function hideOverlay() {
    document.getElementById("overlay").classList.add("hidden");
    state.overlay = null;
    state.paused = false;
  }

  function pickFromPile(mesh) {
    if (state.busy || state.overlay || state.paused) {
      return;
    }
    if (!canPlace()) {
      loseLevel("tray");
      return;
    }
    state.busy = true;
    audio.pick();
    var world = new THREE.Vector3();
    mesh.getWorldPosition(world);
    pileGroup.remove(mesh);
    scene.add(mesh);
    mesh.position.copy(world);
    var slotIndex = firstEmptySlot();
    state.flying.push({
      mesh: mesh,
      from: world.clone(),
      to: new THREE.Vector3((slotIndex - 2.5) * 0.85, -2.6, 2.8),
      t: 0,
      type: mesh.userData.type,
    });
    state.pile = state.pile.filter(function (item) {
      return item !== mesh;
    });
  }

  function finishFlight(job) {
    scene.remove(job.mesh);
    state.tray.push({ type: job.type });
    renderTray();
    tryMatch(job.type);
    if (!state.overlay && !canPlace() && !hasPendingMatch()) {
      loseLevel("tray");
    }
  }

  function hasPendingMatch() {
    var counts = {};
    state.tray.forEach(function (item) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return Object.keys(counts).some(function (type) {
      return counts[type] >= MATCH_SIZE;
    });
  }

  function onPointer(event) {
    audio.ensure();
    if (state.screen !== "game" || state.overlay || state.busy) {
      return;
    }
    var rect = canvas.getBoundingClientRect();
    var x = (event.clientX - rect.left) / rect.width;
    var y = (event.clientY - rect.top) / rect.height;
    pointer.set(x * 2 - 1, -(y * 2) + 1);
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(state.pile, true);
    if (!hits.length) {
      return;
    }
    var root = hits[0].object.userData.root || hits[0].object;
    while (root.parent && root.parent !== pileGroup && root.parent !== scene) {
      if (root.userData && root.userData.root) {
        root = root.userData.root;
        break;
      }
      root = root.parent;
    }
    if (state.pile.indexOf(root) >= 0) {
      pickFromPile(root);
    }
  }

  function shufflePile() {
    if (state.overlay || state.busy) {
      return;
    }
    var count = state.pile.length;
    var radius = 1.15 + Math.min(2.35, Math.sqrt(count) * 0.22);
    state.pile.forEach(function (mesh, index) {
      var angle = Math.random() * Math.PI * 2;
      var r = Math.sqrt(Math.random()) * radius;
      mesh.position.set(Math.cos(angle) * r, Math.random() * 0.7, Math.sin(angle) * r * 0.88);
      mesh.rotation.y = Math.random() * Math.PI * 2;
    });
  }

  function grantExtraMinute() {
    state.timeLeft += 60;
    if (state.timeLeft > MatchConfig.MAX_TIME) {
      state.timeLeft = MatchConfig.MAX_TIME;
    }
    state.adUsed = true;
    hideOverlay();
    updateTimer();
  }

  function frame() {
    var dt = Math.min(0.033, clock ? clock.getDelta() : 0.016);
    if (state.screen === "game") {
      if (!state.paused && !state.overlay) {
        state.timeLeft -= dt;
        updateTimer();
        if (state.timeLeft <= 0) {
          state.timeLeft = 0;
          updateTimer();
          loseLevel("time");
        }
      }
      state.flying.forEach(function (job) {
        job.t += dt / 0.32;
        var u = Math.min(1, job.t);
        var ease = 1 - Math.pow(1 - u, 3);
        job.mesh.position.lerpVectors(job.from, job.to, ease);
        job.mesh.rotation.y += dt * 6;
        job.mesh.scale.setScalar(1 - ease * 0.35);
      });
      var still = [];
      state.flying.forEach(function (job) {
        if (job.t >= 1) {
          finishFlight(job);
        } else {
          still.push(job);
        }
      });
      state.flying = still;
      state.busy = still.length > 0;
      pileGroup.rotation.y = Math.sin(performance.now() / 1800) * 0.08;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }

  function createStars() {
    var html = "";
    for (var i = 0; i < 60; i += 1) {
      html +=
        '<span style="left:' +
        Math.random() * 100 +
        "%;top:" +
        Math.random() * 100 +
        "%;animation-delay:" +
        Math.random() * 3 +
        's"></span>';
    }
    document.getElementById("stars").innerHTML = html;
  }

  function bindUi() {
    document.getElementById("btn-play").addEventListener("click", function () {
      audio.ensure();
      startLevel(0);
    });
    document.getElementById("btn-levels").addEventListener("click", function () {
      renderLevelGrid();
      showScreen("levels");
    });
    document.getElementById("btn-back").addEventListener("click", function () {
      showScreen("menu");
    });
    document.getElementById("btn-menu").addEventListener("click", function () {
      hideOverlay();
      showScreen("menu");
    });
    document.getElementById("btn-restart").addEventListener("click", function () {
      startLevel(state.levelIndex);
    });
    document.getElementById("btn-shuffle").addEventListener("click", shufflePile);
    document.getElementById("btn-next").addEventListener("click", function () {
      startLevel(Math.min(MATCH_LEVELS.length - 1, state.levelIndex + 1));
    });
    document.getElementById("btn-retry").addEventListener("click", function () {
      startLevel(state.levelIndex);
    });
    document.getElementById("btn-overlay-menu").addEventListener("click", function () {
      hideOverlay();
      renderLevelGrid();
      showScreen("levels");
    });
    document.getElementById("btn-ad").addEventListener("click", function () {
      ads.showRewarded(function (ok) {
        if (ok) {
          grantExtraMinute();
        }
      });
    });
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        i18n.lang = btn.getAttribute("data-lang");
        saveProgress();
        applyLang();
      });
    });
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", resize);
  }

  loadProgress();
  createStars();
  initThree();
  bindUi();
  applyLang();
  renderLevelGrid();
  requestAnimationFrame(frame);
})();
