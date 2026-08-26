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
      lead: "Tap toys from the pile, pair two identical ones in the 10-slot tray, and clear the goals before time runs out.",
      play: "Play",
      levels: "Levels",
      back: "Back",
      levelsTitle: "Levels",
      shuffle: "Shuffle",
      restart: "Retry",
      menu: "Menu",
      next: "Next",
      retry: "Retry",
      toLevels: "Levels",
      adBtn: "Watch ad +1:00",
      win: "Level complete!",
      loseTime: "Time's up!",
      loseTray: "Tray is full!",
      winDetail: "Nice pairing! +30 coins",
      loseTimeDetail: "Watch an ad for one extra minute, or retry.",
      loseTrayDetail: "Match two identical toys before all 10 slots fill.",
      level: "LEVEL",
      bomb: "Bomb",
      bombHint: "Tap the pile to throw the bomb",
      noCoins: "Need 30 coins for a bomb",
    },
    ru: {
      tagline: "3D МАТЧ",
      lead: "Нажимай игрушки в куче, собирай пары в лотке из 10 слотов и закрой цели до конца таймера.",
      play: "Играть",
      levels: "Уровни",
      back: "Назад",
      levelsTitle: "Уровни",
      shuffle: "Микс",
      restart: "Ещё",
      menu: "Меню",
      next: "Дальше",
      retry: "Ещё раз",
      toLevels: "Уровни",
      adBtn: "Реклама +1:00",
      win: "Уровень пройден!",
      loseTime: "Время вышло!",
      loseTray: "Лоток заполнен!",
      winDetail: "Отличные пары! +30 монет",
      loseTimeDetail: "Посмотри рекламу и получи ещё минуту — или начни заново.",
      loseTrayDetail: "Собери две одинаковые игрушки, пока не заняты все 10 слотов.",
      level: "УРОВЕНЬ",
      bomb: "Бомба",
      bombHint: "Нажми на кучу, куда кинуть бомбу",
      noCoins: "Нужно 30 монет на бомбу",
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
    coins: 0,
    aimingBomb: false,
    bombFlight: null,
    bursts: [],
  };

  var scene, camera, renderer, raycaster, pointer, pileGroup, clock;

  function loadProgress() {
    try {
      var data = JSON.parse(localStorage.getItem("pair-pop-progress") || "{}");
      if (data.unlocked) {
        state.unlocked = data.unlocked;
      }
      if (typeof data.coins === "number") {
        state.coins = Math.max(0, data.coins);
      }
      if (data.muted) {
        audio.muted = true;
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
      JSON.stringify({ unlocked: state.unlocked, lang: i18n.lang, coins: state.coins, muted: audio.muted })
    );
  }

  function t(key) {
    return i18n.t(key);
  }

  function updateCoinsHud() {
    document.querySelectorAll(".coin-count").forEach(function (el) {
      el.textContent = String(state.coins);
    });
    var bombBtn = document.getElementById("btn-bomb");
    if (bombBtn) {
      bombBtn.classList.toggle("poor", state.coins < MatchConfig.BOMB_COST && !state.aimingBomb);
      bombBtn.classList.toggle("aiming", !!state.aimingBomb);
    }
  }

  function showToast(text) {
    var el = document.getElementById("toast");
    el.textContent = text;
    el.classList.remove("hidden");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () {
      el.classList.add("hidden");
    }, 1600);
  }

  function setBombAim(on) {
    state.aimingBomb = !!on;
    document.body.classList.toggle("bomb-aim", state.aimingBomb);
    document.getElementById("bomb-hint").classList.toggle("hidden", !state.aimingBomb);
    updateCoinsHud();
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
    document.getElementById("lbl-shuffle").textContent = t("shuffle");
    document.getElementById("lbl-restart").textContent = t("restart");
    document.getElementById("lbl-menu").textContent = t("menu");
    document.getElementById("lbl-bomb").textContent = t("bomb");
    document.getElementById("bomb-hint").textContent = t("bombHint");
    document.getElementById("bomb-cost").textContent = String(MatchConfig.BOMB_COST);
    document.getElementById("btn-next").textContent = t("next");
    document.getElementById("btn-retry").textContent = t("retry");
    document.getElementById("btn-overlay-menu").textContent = t("toLevels");
    document.getElementById("btn-ad").textContent = t("adBtn");
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      if (btn.hasAttribute("data-music")) {
        return;
      }
      btn.classList.toggle("active", btn.getAttribute("data-lang") === i18n.lang);
    });
    if (state.screen === "levels") {
      renderLevelGrid();
    }
    if (state.screen === "game") {
      document.getElementById("hud-level").textContent = t("level") + " " + (state.levelIndex + 1);
      renderGoals();
    }
    updateCoinsHud();
    applyMusicButtons();
  }

  function applyMusicButtons() {
    document.querySelectorAll("[data-music]").forEach(function (btn) {
      btn.classList.toggle("off", audio.muted);
      btn.setAttribute("aria-pressed", audio.muted ? "false" : "true");
    });
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
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
    camera.position.set(0, 9.2, 7.4);
    camera.lookAt(0, 0.15, 0);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    pileGroup = new THREE.Group();
    scene.add(pileGroup);
    scene.environment = MatchItems.getEnvMap();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x4a7aa8, 1.05));
    var key = new THREE.DirectionalLight(0xfff7ea, 1.55);
    key.position.set(5, 12, 6);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x9ecbff, 0.55);
    fill.position.set(-6, 4, -3);
    scene.add(fill);
    var bounce = new THREE.DirectionalLight(0xffe0b0, 0.28);
    bounce.position.set(0, -5, 2);
    scene.add(bounce);
    var floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.8, 64),
      new THREE.MeshStandardMaterial({ color: 0x2a6fa8, roughness: 0.85, metalness: 0.05, envMapIntensity: 0.3 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.62;
    scene.add(floor);
    var shadow = new THREE.Mesh(
      new THREE.CircleGeometry(3.3, 48),
      new THREE.MeshBasicMaterial({ color: 0x0a2a44, transparent: true, opacity: 0.22 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.6;
    scene.add(shadow);
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
    var radius = 1.05 + Math.min(2.2, Math.sqrt(count) * 0.2);
    bag.forEach(function (type, index) {
      var mesh = MatchItems.createItem(type);
      var angle = (index / count) * Math.PI * 2 + Math.random() * 0.55;
      var r = Math.sqrt((index + 0.2) / count) * radius * (0.55 + Math.random() * 0.55);
      var y = Math.min(2.1, (index % 8) * 0.14 + Math.random() * 0.22);
      mesh.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r * 0.86);
      mesh.rotation.set(Math.random() * 0.85, Math.random() * Math.PI * 2, Math.random() * 0.85);
      mesh.scale.setScalar(0.95 + Math.random() * 0.12);
      pileGroup.add(mesh);
      state.pile.push(mesh);
    });
    var zoom = 8.4 + Math.min(2.6, count / 36);
    camera.position.set(0, zoom, zoom * 0.72);
    camera.lookAt(0, 0.2, 0);
  }

  function typeIcon(type) {
    return '<img class="toy-icon" alt="" src="' + MatchItems.iconUrl(type) + '">';
  }

  function fillMenuToys() {
    var box = document.getElementById("menu-toys");
    if (!box) {
      return;
    }
    box.innerHTML = "";
    ["duck", "burger", "donut", "apple", "ball", "cat"].forEach(function (type) {
      var wrap = document.createElement("div");
      wrap.className = "toy-frame";
      var img = document.createElement("img");
      img.src = MatchItems.iconUrl(type);
      img.alt = "";
      wrap.appendChild(img);
      box.appendChild(wrap);
    });
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
    setBombAim(false);
    clearBursts();
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
    state.coins += MatchConfig.WIN_COINS;
    saveProgress();
    updateCoinsHud();
    audio.win();
    audio.coin();
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
      to: new THREE.Vector3((slotIndex - (TRAY_SIZE - 1) / 2) * 0.42, -2.55, 2.8),
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
    audio.unlockAndPlay();
    if (state.screen !== "game" || state.overlay || state.busy) {
      return;
    }
    var rect = canvas.getBoundingClientRect();
    var x = (event.clientX - rect.left) / rect.width;
    var y = (event.clientY - rect.top) / rect.height;
    pointer.set(x * 2 - 1, -(y * 2) + 1);
    raycaster.setFromCamera(pointer, camera);
    if (state.aimingBomb) {
      throwBomb();
      return;
    }
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

  function getAimPoint() {
    var hits = raycaster.intersectObjects(state.pile, true);
    if (hits.length) {
      return hits[0].point.clone();
    }
    var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.15);
    var target = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, target)) {
      return target;
    }
    return new THREE.Vector3(0, 0.3, 0);
  }

  function throwBomb() {
    if (state.coins < MatchConfig.BOMB_COST) {
      showToast(t("noCoins"));
      setBombAim(false);
      return;
    }
    var world = getAimPoint();
    state.coins -= MatchConfig.BOMB_COST;
    saveProgress();
    updateCoinsHud();
    setBombAim(false);
    state.busy = true;
    var bomb = MatchItems.createBomb();
    bomb.position.copy(camera.position).add(new THREE.Vector3(0, -1.2, -1.4));
    scene.add(bomb);
    state.bombFlight = {
      mesh: bomb,
      from: bomb.position.clone(),
      to: world,
      t: 0,
    };
  }

  function explodeAt(worldPoint) {
    audio.boom();
    var local = pileGroup.worldToLocal(worldPoint.clone());
    var radius = MatchConfig.BLAST_RADIUS;
    state.pile.forEach(function (mesh) {
      var dx = mesh.position.x - local.x;
      var dy = mesh.position.y - local.y;
      var dz = mesh.position.z - local.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.05;
      if (dist < radius) {
        var force = (1 - dist / radius) * 1.85;
        mesh.userData.toss = {
          vx: (dx / dist) * force + (Math.random() - 0.5) * 0.5,
          vy: 1.35 + force * 0.8,
          vz: (dz / dist) * force + (Math.random() - 0.5) * 0.5,
          spin: (Math.random() - 0.5) * 10,
        };
      }
    });
    spawnBurst(worldPoint);
  }

  function spawnBurst(worldPoint) {
    var group = new THREE.Group();
    group.position.copy(worldPoint);
    scene.add(group);
    var bits = [];
    var colors = ["#ff9a2e", "#ffe566", "#ff4d3a", "#fff"];
    for (var i = 0; i < 18; i += 1) {
      var geo = new THREE.SphereGeometry(0.09, 8, 8);
      var mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
      var mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
      bits.push({
        mesh: mesh,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3.2,
        vz: (Math.random() - 0.5) * 4,
      });
    }
    state.bursts.push({ group: group, bits: bits, t: 0 });
  }

  function clearBursts() {
    state.bursts.forEach(function (burst) {
      scene.remove(burst.group);
    });
    state.bursts = [];
    if (state.bombFlight) {
      scene.remove(state.bombFlight.mesh);
      state.bombFlight = null;
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
      if (state.bombFlight) {
        state.bombFlight.t += dt / 0.38;
        var bu = Math.min(1, state.bombFlight.t);
        var easeB = 1 - Math.pow(1 - bu, 2);
        state.bombFlight.mesh.position.lerpVectors(state.bombFlight.from, state.bombFlight.to, easeB);
        state.bombFlight.mesh.position.y += Math.sin(bu * Math.PI) * 1.35;
        state.bombFlight.mesh.rotation.x += dt * 8;
        if (bu >= 1) {
          var dest = state.bombFlight.to.clone();
          scene.remove(state.bombFlight.mesh);
          state.bombFlight = null;
          explodeAt(dest);
        }
      }
      state.pile.forEach(function (mesh) {
        var toss = mesh.userData.toss;
        if (!toss) {
          return;
        }
        toss.vy -= 9 * dt;
        mesh.position.x += toss.vx * dt;
        mesh.position.y += toss.vy * dt;
        mesh.position.z += toss.vz * dt;
        mesh.rotation.y += toss.spin * dt;
        if (mesh.position.y < 0) {
          mesh.position.y = 0;
          toss.vy *= -0.32;
          toss.vx *= 0.72;
          toss.vz *= 0.72;
          if (Math.abs(toss.vy) < 0.45) {
            mesh.userData.toss = null;
          }
        }
      });
      var liveBursts = [];
      state.bursts.forEach(function (burst) {
        burst.t += dt;
        burst.bits.forEach(function (bit) {
          bit.vy -= 8 * dt;
          bit.mesh.position.x += bit.vx * dt;
          bit.mesh.position.y += bit.vy * dt;
          bit.mesh.position.z += bit.vz * dt;
          var s = Math.max(0.02, 1 - burst.t * 2.1);
          bit.mesh.scale.setScalar(s);
        });
        if (burst.t < 0.55) {
          liveBursts.push(burst);
        } else {
          scene.remove(burst.group);
        }
      });
      state.bursts = liveBursts;
      state.busy = still.length > 0 || !!state.bombFlight;
      pileGroup.rotation.y = Math.sin(performance.now() / 2400) * 0.05;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }

  function bindUi() {
    document.getElementById("btn-play").addEventListener("click", function () {
      audio.unlockAndPlay();
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
    document.getElementById("btn-bomb").addEventListener("click", function () {
      audio.unlockAndPlay();
      if (state.overlay || state.busy) {
        return;
      }
      if (state.aimingBomb) {
        setBombAim(false);
        return;
      }
      if (state.coins < MatchConfig.BOMB_COST) {
        showToast(t("noCoins"));
        return;
      }
      setBombAim(true);
    });
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
        if (btn.hasAttribute("data-music")) {
          return;
        }
        i18n.lang = btn.getAttribute("data-lang");
        saveProgress();
        applyLang();
      });
    });
    document.querySelectorAll("[data-music]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        audio.toggleMute();
        saveProgress();
        applyMusicButtons();
      });
    });
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", resize);
    document.body.addEventListener("pointerdown", function () {
      audio.unlockAndPlay();
    });
  }

  loadProgress();
  initThree();
  MatchItems.warmIcons();
  fillMenuToys();
  bindUi();
  applyLang();
  updateCoinsHud();
  renderLevelGrid();
  requestAnimationFrame(frame);
})();
