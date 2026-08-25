(function (global) {
  "use strict";

  var geos = {};
  var mats = {};
  var iconCache = {};
  var iconRenderer = null;

  function geo(name, factory) {
    if (!geos[name]) {
      geos[name] = factory();
    }
    return geos[name];
  }

  var envMap = null;

  function getEnvMap() {
    if (envMap) {
      return envMap;
    }
    var c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    var ctx = c.getContext("2d");
    var g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.28, "#d7f0ff");
    g.addColorStop(0.55, "#62b7ff");
    g.addColorStop(1, "#1d4e7a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(170, 48, 46, 0, Math.PI * 2);
    ctx.fill();
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    envMap = tex;
    return envMap;
  }

  function sph() {
    return geo("sph", function () {
      return new THREE.SphereGeometry(0.5, 48, 32);
    });
  }

  function cyl(name, rt, rb, h, seg) {
    return geo(name, function () {
      return new THREE.CylinderGeometry(rt, rb, h, seg || 36);
    });
  }

  function mat(key, color, extra) {
    extra = extra || {};
    var id = key + "_" + color + "_" + (extra.roughness || 0) + "_" + (extra.metalness || 0) + (extra.vertexColors ? "v" : "");
    if (!mats[id]) {
      mats[id] = new THREE.MeshStandardMaterial({
        color: color,
        roughness: extra.roughness != null ? extra.roughness : 0.28,
        metalness: extra.metalness != null ? extra.metalness : 0.08,
        envMap: getEnvMap(),
        envMapIntensity: extra.envMapIntensity != null ? extra.envMapIntensity : 0.85,
        vertexColors: !!extra.vertexColors,
        emissive: extra.emissive || 0x000000,
        emissiveIntensity: extra.emissiveIntensity || 0,
      });
    }
    return mats[id];
  }

  function add(parent, geometry, material, x, y, z, sx, sy, sz) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x || 0, y || 0, z || 0);
    if (sx) {
      mesh.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
    }
    parent.add(mesh);
    return mesh;
  }

  function group(type) {
    var g = new THREE.Group();
    g.userData.type = type;
    return g;
  }

  function makeDuck() {
    var g = group("duck");
    var body = mat("duck", "#ffd54a", { roughness: 0.28 });
    add(g, sph(), body, 0, -0.02, 0.04, 0.92, 0.7, 1.05);
    add(g, sph(), body, 0.28, 0.26, 0.16, 0.52);
    add(g, cyl("beak", 0.11, 0.05, 0.34, 16), mat("beak", "#ff8a3c", { roughness: 0.4 }), 0.52, 0.22, 0.16).rotation.z = -Math.PI / 2;
    add(g, sph(), mat("eye", "#fff", { roughness: 0.2 }), 0.4, 0.34, 0.3, 0.12);
    add(g, sph(), mat("eye2", "#fff", { roughness: 0.2 }), 0.4, 0.34, 0.04, 0.12);
    add(g, sph(), mat("pupil", "#2b2118", { roughness: 0.4 }), 0.45, 0.35, 0.33, 0.05);
    add(g, sph(), mat("pupil2", "#2b2118", { roughness: 0.4 }), 0.45, 0.35, 0.07, 0.05);
    add(g, sph(), body, -0.02, 0.02, 0.42, 0.42, 0.18, 0.28);
    return g;
  }

  function makeBall() {
    var g = group("ball");
    var geom = geo("beach", function () {
      var s = new THREE.SphereGeometry(0.46, 48, 28);
      var pos = s.attributes.position;
      var colors = [];
      var pal = [new THREE.Color("#ff3b4a"), new THREE.Color("#f6f8ff"), new THREE.Color("#3b7dff")];
      for (var i = 0; i < pos.count; i += 1) {
        var ang = Math.atan2(pos.getZ(i), pos.getX(i));
        var slice = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 6) % 6;
        var c = pal[slice % 3];
        colors.push(c.r, c.g, c.b);
      }
      s.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      return s;
    });
    add(g, geom, mat("beach", "#ffffff", { vertexColors: true, roughness: 0.26 }));
    return g;
  }

  function makeGem() {
    var g = group("gem");
    add(g, cyl("kiwi", 0.42, 0.42, 0.2, 32), mat("skin", "#6b4423", { roughness: 0.7 }), 0, 0, 0);
    add(g, cyl("flesh", 0.36, 0.36, 0.18, 32), mat("flesh", "#b6d94c", { roughness: 0.45 }), 0, 0.02, 0);
    add(g, cyl("core", 0.1, 0.1, 0.19, 16), mat("core", "#f4f7e2", { roughness: 0.4 }), 0, 0.03, 0);
    for (var i = 0; i < 10; i += 1) {
      var a = (i / 10) * Math.PI * 2;
      add(g, sph(), mat("seed", "#2b2118", { roughness: 0.5 }), Math.cos(a) * 0.2, 0.08, Math.sin(a) * 0.2, 0.07, 0.05, 0.04);
    }
    return g;
  }

  function makeDonut() {
    var g = group("donut");
    add(
      g,
      geo("donut", function () {
        return new THREE.TorusGeometry(0.3, 0.16, 18, 36);
      }),
      mat("dough", "#e0a45a", { roughness: 0.55 })
    );
    add(
      g,
      geo("icing", function () {
        return new THREE.TorusGeometry(0.3, 0.09, 14, 32);
      }),
      mat("icing", "#ff7ad9", { roughness: 0.28 }),
      0,
      0.07,
      0
    );
    var spr = ["#ffe566", "#5ad6ff", "#fff", "#ff4d6d"];
    for (var i = 0; i < 8; i += 1) {
      var a = (i / 8) * Math.PI * 2;
      var m = add(
        g,
        cyl("spr", 0.03, 0.03, 0.12, 8),
        mat("spr" + (i % 4), spr[i % 4], { roughness: 0.3 }),
        Math.cos(a) * 0.3,
        0.16,
        Math.sin(a) * 0.3
      );
      m.rotation.z = a;
    }
    return g;
  }

  function makeApple() {
    var g = group("apple");
    add(g, sph(), mat("apple", "#ff3355", { roughness: 0.28 }), 0, 0, 0, 0.9, 0.84, 0.9);
    add(g, sph(), mat("apple2", "#ff3355", { roughness: 0.28 }), 0, 0.08, 0, 0.82, 0.7, 0.82);
    add(g, cyl("stem", 0.035, 0.04, 0.22, 8), mat("stem", "#5c4033", { roughness: 0.6 }), 0, 0.5, 0);
    add(g, sph(), mat("leaf", "#7ed957", { roughness: 0.4 }), 0.14, 0.52, 0, 0.28, 0.08, 0.16);
    add(g, sph(), mat("shine", "#fff", { roughness: 0.15 }), -0.18, 0.16, 0.28, 0.16, 0.1, 0.08);
    return g;
  }

  function makeStar() {
    var g = group("star");
    add(g, sph(), mat("orange", "#ff9f1c", { roughness: 0.32 }), 0, 0, 0, 0.9);
    add(g, sph(), mat("dimple", "#f08c00", { roughness: 0.4 }), 0, 0.38, 0, 0.18, 0.08, 0.18);
    add(g, sph(), mat("oleaf", "#7ed957", { roughness: 0.4 }), 0.16, 0.42, 0, 0.26, 0.08, 0.16);
    return g;
  }

  function makeCupcake() {
    var g = group("cupcake");
    add(g, sph(), mat("white", "#fff6e8", { roughness: 0.3 }), 0, -0.08, 0, 1.15, 0.28, 0.9);
    add(g, sph(), mat("yolk", "#ffd166", { roughness: 0.26 }), 0.06, 0.04, 0.04, 0.5);
    return g;
  }

  function makeBalloon() {
    var g = group("balloon");
    add(g, sph(), mat("bal", "#ff5a6a", { roughness: 0.22 }), 0, 0.12, 0, 0.88, 1.08, 0.88);
    add(g, cyl("knot", 0.06, 0.02, 0.14, 10), mat("knot", "#e44555", { roughness: 0.3 }), 0, -0.42, 0);
    add(g, cyl("str", 0.012, 0.012, 0.36, 8), mat("str", "#f4f6fb", { roughness: 0.5 }), 0, -0.62, 0);
    add(g, sph(), mat("bshine", "#fff", { roughness: 0.12 }), -0.18, 0.32, 0.28, 0.18, 0.22, 0.1);
    return g;
  }

  function makeCandy() {
    var g = group("candy");
    add(g, sph(), mat("lol", "#ff4d6d", { roughness: 0.22 }), 0, 0.16, 0, 0.72);
    add(
      g,
      geo("swirl", function () {
        return new THREE.TorusGeometry(0.22, 0.045, 10, 28);
      }),
      mat("swirl", "#fff", { roughness: 0.25 }),
      0,
      0.16,
      0
    );
    add(g, cyl("stick", 0.04, 0.04, 0.62, 10), mat("stick", "#f4f6fb", { roughness: 0.4 }), 0, -0.32, 0);
    return g;
  }

  function makeCat() {
    var g = group("cat");
    var fur = mat("cat", "#f4a261", { roughness: 0.45 });
    add(g, sph(), fur, 0, 0, 0, 0.92);
    var earL = add(g, cyl("ear", 0.01, 0.16, 0.28, 12), fur, -0.26, 0.42, 0);
    earL.rotation.z = 0.35;
    var earR = add(g, cyl("ear2", 0.01, 0.16, 0.28, 12), fur, 0.26, 0.42, 0);
    earR.rotation.z = -0.35;
    add(g, sph(), mat("in", "#ffb4c8", { roughness: 0.4 }), -0.26, 0.4, 0.04, 0.12, 0.1, 0.08);
    add(g, sph(), mat("in2", "#ffb4c8", { roughness: 0.4 }), 0.26, 0.4, 0.04, 0.12, 0.1, 0.08);
    add(g, sph(), mat("ceye", "#2b2118", { roughness: 0.3 }), -0.16, 0.08, 0.38, 0.12, 0.16, 0.08);
    add(g, sph(), mat("ceye2", "#2b2118", { roughness: 0.3 }), 0.16, 0.08, 0.38, 0.12, 0.16, 0.08);
    add(g, sph(), mat("cnose", "#ff6b8a", { roughness: 0.35 }), 0, -0.02, 0.44, 0.1);
    add(g, sph(), mat("muzzle", "#ffe0c2", { roughness: 0.4 }), 0, -0.12, 0.36, 0.32, 0.18, 0.22);
    return g;
  }

  function makeBurger() {
    var g = group("burger");
    var bun = mat("bun", "#e09f4a", { roughness: 0.5 });
    add(g, sph(), bun, 0, 0.22, 0, 0.92, 0.42, 0.92);
    add(g, cyl("patty", 0.4, 0.4, 0.1, 24), mat("patty", "#7a3e22", { roughness: 0.6 }), 0, 0.06, 0);
    add(g, cyl("cheese", 0.42, 0.42, 0.04, 24), mat("cheese", "#ffd166", { roughness: 0.4 }), 0, 0.12, 0);
    add(g, cyl("let", 0.44, 0.4, 0.05, 24), mat("let", "#7ed957", { roughness: 0.5 }), 0, 0.0, 0);
    add(g, cyl("bot", 0.4, 0.4, 0.12, 24), bun, 0, -0.12, 0);
    for (var i = 0; i < 6; i += 1) {
      var a = (i / 6) * Math.PI * 2;
      add(g, sph(), mat("ses", "#fff3c4", { roughness: 0.45 }), Math.cos(a) * 0.22, 0.4, Math.sin(a) * 0.18, 0.07, 0.04, 0.05);
    }
    return g;
  }

  function makeRocket() {
    var g = group("rocket");
    var hull = mat("hull", "#3b7dff", { roughness: 0.3 });
    add(g, cyl("boat", 0.18, 0.28, 0.9, 20), hull, 0, -0.06, 0).rotation.z = Math.PI / 2;
    add(g, sph(), hull, 0.42, -0.06, 0, 0.36, 0.28, 0.28);
    add(g, sph(), hull, -0.42, -0.06, 0, 0.28, 0.24, 0.24);
    add(g, cyl("cabin", 0.16, 0.16, 0.22, 16), mat("cabin", "#f4f6fb", { roughness: 0.25 }), -0.08, 0.18, 0);
    add(g, cyl("stack", 0.06, 0.07, 0.22, 12), mat("stack", "#ff4d6d", { roughness: 0.35 }), 0.16, 0.22, 0);
    return g;
  }

  function makeHeart() {
    var g = group("heart");
    var slice = geo("melon", function () {
      return new THREE.CylinderGeometry(0.5, 0.5, 0.16, 28, 1, false, 0, Math.PI);
    });
    var m = add(g, slice, mat("flesh", "#ff3b5c", { roughness: 0.35 }));
    m.rotation.x = Math.PI / 2;
    var rind = add(
      g,
      geo("rind", function () {
        return new THREE.TorusGeometry(0.5, 0.055, 10, 28, Math.PI);
      }),
      mat("rind", "#2f9e44", { roughness: 0.45 })
    );
    rind.rotation.x = Math.PI / 2;
    for (var i = 0; i < 5; i += 1) {
      var a = 0.35 + i * 0.45;
      add(g, sph(), mat("sd", "#2b2118", { roughness: 0.5 }), Math.cos(a) * 0.22, Math.sin(a) * 0.18, 0.06, 0.06, 0.04, 0.03);
    }
    return g;
  }

  function makeFish() {
    var g = group("fish");
    var pie = add(
      g,
      geo("pizza", function () {
        return new THREE.CylinderGeometry(0.58, 0.58, 0.08, 28, 1, false, 0, 1.05);
      }),
      mat("cheese", "#ffd166", { roughness: 0.4 })
    );
    pie.rotation.x = Math.PI / 2;
    var crust = add(
      g,
      geo("crust", function () {
        return new THREE.TorusGeometry(0.58, 0.07, 10, 24, 1.05);
      }),
      mat("crust", "#d48a3a", { roughness: 0.55 })
    );
    crust.rotation.x = Math.PI / 2;
    add(g, cyl("pep", 0.1, 0.1, 0.05, 16), mat("pep", "#e63946", { roughness: 0.4 }), 0.16, 0.12, 0.06);
    add(g, cyl("pep2", 0.09, 0.09, 0.05, 16), mat("pep2", "#e63946", { roughness: 0.4 }), 0.02, -0.08, 0.06);
    add(g, cyl("pep3", 0.08, 0.08, 0.05, 16), mat("pep3", "#e63946", { roughness: 0.4 }), -0.12, 0.14, 0.06);
    return g;
  }

  function makeBell() {
    var g = group("bell");
    var banana = add(
      g,
      geo("banana", function () {
        return new THREE.TorusGeometry(0.34, 0.11, 16, 28, 2.35);
      }),
      mat("ban", "#ffe566", { roughness: 0.32 })
    );
    banana.rotation.y = Math.PI / 2;
    banana.rotation.z = 0.4;
    add(g, sph(), mat("tip", "#6b4423", { roughness: 0.55 }), 0.08, 0.38, 0.22, 0.12);
    add(g, sph(), mat("tip2", "#c9a227", { roughness: 0.5 }), 0.02, -0.34, -0.28, 0.1);
    return g;
  }

  function makeCube() {
    var g = group("cube");
    add(g, cyl("can", 0.26, 0.26, 0.62, 28), mat("can", "#e63946", { roughness: 0.28, metalness: 0.18 }));
    add(g, cyl("lid", 0.27, 0.27, 0.06, 28), mat("lid", "#dfe7ef", { roughness: 0.22, metalness: 0.7 }), 0, 0.32, 0);
    add(g, cyl("bot", 0.27, 0.27, 0.05, 28), mat("bot", "#dfe7ef", { roughness: 0.22, metalness: 0.7 }), 0, -0.3, 0);
    add(g, cyl("stripe", 0.265, 0.265, 0.14, 28), mat("stripe", "#f4f6fb", { roughness: 0.3 }), 0, 0.04, 0);
    return g;
  }

  var FACTORIES = {
    duck: makeDuck,
    ball: makeBall,
    gem: makeGem,
    donut: makeDonut,
    apple: makeApple,
    star: makeStar,
    cupcake: makeCupcake,
    balloon: makeBalloon,
    candy: makeCandy,
    cat: makeCat,
    burger: makeBurger,
    rocket: makeRocket,
    heart: makeHeart,
    fish: makeFish,
    bell: makeBell,
    cube: makeCube,
  };

  function createItem(type) {
    var factory = FACTORIES[type] || makeBall;
    var mesh = factory();
    mesh.userData.type = type;
    mesh.traverse(function (child) {
      child.userData.type = type;
      child.userData.root = mesh;
    });
    return mesh;
  }

  function ensureIconRenderer() {
    if (iconRenderer) {
      return iconRenderer;
    }
    var canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 192;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(192, 192, false);
    renderer.setPixelRatio(2);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    var scene = new THREE.Scene();
    scene.environment = getEnvMap();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x4a6a88, 1.1));
    var key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(2.2, 3.4, 2.8);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x9ecbff, 0.45);
    fill.position.set(-2, 1, -1);
    scene.add(fill);
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    camera.position.set(0.45, 0.62, 1.85);
    camera.lookAt(0, 0.02, 0);
    iconRenderer = { renderer: renderer, scene: scene, camera: camera, canvas: canvas };
    return iconRenderer;
  }

  function iconUrl(type) {
    if (iconCache[type]) {
      return iconCache[type];
    }
    var pack = ensureIconRenderer();
    var item = createItem(type);
    item.scale.setScalar(1.2);
    pack.scene.add(item);
    pack.renderer.render(pack.scene, pack.camera);
    pack.scene.remove(item);
    iconCache[type] = pack.canvas.toDataURL("image/png");
    return iconCache[type];
  }

  function warmIcons() {
    Object.keys(FACTORIES).forEach(function (type) {
      iconUrl(type);
    });
  }

  global.MatchItems = {
    createItem: createItem,
    FACTORIES: FACTORIES,
    iconUrl: iconUrl,
    warmIcons: warmIcons,
    getEnvMap: getEnvMap,
  };
})(typeof window !== "undefined" ? window : global);
