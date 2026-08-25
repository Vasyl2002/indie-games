(function (global) {
  "use strict";

  var geos = {};
  var mats = {};

  function geo(name, factory) {
    if (!geos[name]) {
      geos[name] = factory();
    }
    return geos[name];
  }

  function mat(key, color, extra) {
    var id = key + "_" + color;
    if (!mats[id]) {
      mats[id] = new THREE.MeshLambertMaterial(
        Object.assign({ color: color }, extra || {})
      );
    }
    return mats[id];
  }

  function add(parent, geometry, material, x, y, z, sx, sy, sz) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x || 0, y || 0, z || 0);
    if (sx) {
      mesh.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
    }
    mesh.castShadow = false;
    mesh.receiveShadow = false;
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
    var body = geo("sphere", function () {
      return new THREE.SphereGeometry(0.42, 16, 12);
    });
    add(g, body, mat("duck", "#ffd93d"), 0, 0, 0, 1, 0.85, 1.1);
    add(g, body, mat("duck", "#ffd93d"), 0.28, 0.28, 0.18, 0.55, 0.5, 0.55);
    add(
      g,
      geo("cone", function () {
        return new THREE.ConeGeometry(0.12, 0.28, 10);
      }),
      mat("beak", "#ff8a3c"),
      0.48,
      0.24,
      0.18
    ).rotation.z = -Math.PI / 2;
    return g;
  }

  function makeBall() {
    var g = group("ball");
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("ball", "#ff4d6d"));
    add(g, geo("torus", function () { return new THREE.TorusGeometry(0.28, 0.05, 8, 16); }), mat("ball2", "#ffffff"), 0, 0, 0);
    return g;
  }

  function makeGem() {
    var g = group("gem");
    add(
      g,
      geo("octa", function () {
        return new THREE.OctahedronGeometry(0.48);
      }),
      mat("gem", "#5ad6ff")
    );
    return g;
  }

  function makeDonut() {
    var g = group("donut");
    add(g, geo("torusMed", function () { return new THREE.TorusGeometry(0.32, 0.16, 10, 18); }), mat("donut", "#ff7ad9"));
    add(g, geo("torusThin", function () { return new THREE.TorusGeometry(0.32, 0.07, 8, 16); }), mat("icing", "#ffe566"), 0, 0.06, 0);
    return g;
  }

  function makeApple() {
    var g = group("apple");
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("apple", "#ff3b5c"), 0, -0.02, 0, 1, 0.95, 1);
    add(g, geo("cyl", function () { return new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8); }), mat("stem", "#5c4d3c"), 0, 0.42, 0);
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("leaf", "#8dff3c"), 0.12, 0.44, 0, 0.28, 0.08, 0.18);
    return g;
  }

  function makeStar() {
    var g = group("star");
    add(
      g,
      geo("ico", function () {
        return new THREE.IcosahedronGeometry(0.42, 0);
      }),
      mat("star", "#ffe566")
    ).rotation.z = 0.4;
    return g;
  }

  function makeCupcake() {
    var g = group("cupcake");
    add(g, geo("cyl2", function () { return new THREE.CylinderGeometry(0.28, 0.22, 0.28, 12); }), mat("wrap", "#c77dff"), 0, -0.12, 0);
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("frost", "#ffb4d9"), 0, 0.16, 0, 0.72, 0.5, 0.72);
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("cherry", "#ff4d6d"), 0, 0.38, 0, 0.22);
    return g;
  }

  function makeBalloon() {
    var g = group("balloon");
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("balloon", "#4dffb8"), 0, 0.08, 0, 0.9, 1.05, 0.9);
    add(g, geo("cone", function () { return new THREE.ConeGeometry(0.12, 0.28, 10); }), mat("knot", "#4dffb8"), 0, -0.38, 0, 0.7, 0.5, 0.7);
    return g;
  }

  function makeCandy() {
    var g = group("candy");
    add(g, geo("cyl3", function () { return new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12); }), mat("candy", "#ff9f1c")).rotation.z = Math.PI / 2;
    add(g, geo("cone", function () { return new THREE.ConeGeometry(0.12, 0.28, 10); }), mat("wrap1", "#ff4d6d"), 0.38, 0, 0, 0.9).rotation.z = -Math.PI / 2;
    add(g, geo("cone", function () { return new THREE.ConeGeometry(0.12, 0.28, 10); }), mat("wrap2", "#5ad6ff"), -0.38, 0, 0, 0.9).rotation.z = Math.PI / 2;
    return g;
  }

  function makeCat() {
    var g = group("cat");
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("cat", "#ffb4a2"));
    add(g, geo("cone", function () { return new THREE.ConeGeometry(0.12, 0.28, 10); }), mat("ear", "#ffb4a2"), -0.22, 0.38, 0, 1.1, 1.1, 0.6);
    add(g, geo("cone", function () { return new THREE.ConeGeometry(0.12, 0.28, 10); }), mat("ear2", "#ffb4a2"), 0.22, 0.38, 0, 1.1, 1.1, 0.6);
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("nose", "#ff4d6d"), 0, 0, 0.36, 0.16);
    return g;
  }

  function makeBurger() {
    var g = group("burger");
    add(g, geo("cyl4", function () { return new THREE.CylinderGeometry(0.36, 0.36, 0.12, 14); }), mat("bun", "#f4a261"), 0, 0.2, 0);
    add(g, geo("cyl4", function () { return new THREE.CylinderGeometry(0.36, 0.36, 0.12, 14); }), mat("patty", "#9c6644"), 0, 0.06, 0, 1, 0.7, 1);
    add(g, geo("cyl4", function () { return new THREE.CylinderGeometry(0.36, 0.36, 0.12, 14); }), mat("lettuce", "#8dff3c"), 0, -0.02, 0, 1.05, 0.4, 1.05);
    add(g, geo("cyl4", function () { return new THREE.CylinderGeometry(0.36, 0.36, 0.12, 14); }), mat("bun2", "#f4a261"), 0, -0.16, 0);
    return g;
  }

  function makeRocket() {
    var g = group("rocket");
    add(g, geo("cyl5", function () { return new THREE.CylinderGeometry(0.18, 0.22, 0.62, 12); }), mat("rocket", "#7aa2ff"), 0, 0.04, 0);
    add(g, geo("cone", function () { return new THREE.ConeGeometry(0.12, 0.28, 10); }), mat("nose", "#ff4d6d"), 0, 0.48, 0, 1.6, 1.2, 1.6);
    add(g, geo("cone", function () { return new THREE.ConeGeometry(0.12, 0.28, 10); }), mat("fin", "#ffe566"), 0.22, -0.2, 0, 0.7, 1, 0.2).rotation.z = 0.6;
    add(g, geo("cone", function () { return new THREE.ConeGeometry(0.12, 0.28, 10); }), mat("fin2", "#ffe566"), -0.22, -0.2, 0, 0.7, 1, 0.2).rotation.z = -0.6;
    return g;
  }

  function makeHeart() {
    var g = group("heart");
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("heart", "#ff4d6d"), -0.16, 0.12, 0, 0.62);
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("heart2", "#ff4d6d"), 0.16, 0.12, 0, 0.62);
    add(g, geo("cone", function () { return new THREE.ConeGeometry(0.12, 0.28, 10); }), mat("heart3", "#ff4d6d"), 0, -0.22, 0, 2.4, 1.7, 1.5).rotation.x = Math.PI;
    return g;
  }

  function makeFish() {
    var g = group("fish");
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("fish", "#00bbf9"), 0, 0, 0, 1.15, 0.7, 0.7);
    add(g, geo("cone", function () { return new THREE.ConeGeometry(0.12, 0.28, 10); }), mat("tail", "#ff9f1c"), -0.48, 0, 0, 1.4, 1.4, 0.4).rotation.z = Math.PI / 2;
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("eye", "#ffffff"), 0.28, 0.1, 0.18, 0.18);
    return g;
  }

  function makeBell() {
    var g = group("bell");
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("bell", "#ffd166"), 0, 0.08, 0, 0.9, 0.85, 0.9);
    add(g, geo("cyl", function () { return new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8); }), mat("loop", "#b08968"), 0, 0.48, 0);
    add(g, geo("sphere", function () { return new THREE.SphereGeometry(0.42, 16, 12); }), mat("clapper", "#b08968"), 0, -0.32, 0, 0.22);
    return g;
  }

  function makeCube() {
    var g = group("cube");
    add(
      g,
      geo("box", function () {
        return new THREE.BoxGeometry(0.62, 0.62, 0.62);
      }),
      mat("cube", "#9b5de5")
    );
    add(g, geo("box", function () { return new THREE.BoxGeometry(0.62, 0.62, 0.62); }), mat("cube2", "#f15bb5"), 0, 0, 0, 0.55);
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

  global.MatchItems = {
    createItem: createItem,
    FACTORIES: FACTORIES,
  };
})(typeof window !== "undefined" ? window : global);
