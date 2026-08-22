"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

function load(file) {
  var scope = {};
  var code = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  vm.runInNewContext(code, { window: scope, global: scope });
  return scope;
}

var L = load("js/logic.js").SortLogic;
var C = load("js/config.js").GameConfig;

var SPECS = [
  { id: 1, name: "Первые капли", difficulty: "easy", handmade: true },
  { id: 2, name: "Три стихии", difficulty: "easy", handmade: true },
  { id: 3, name: "Радуга старт", difficulty: "easy", colors: 3, empty: 2, seed: 108 },
  { id: 4, name: "Яркий микс", difficulty: "easy", colors: 4, empty: 2, seed: 204 },
  { id: 5, name: "Цветной вихрь", difficulty: "medium", colors: 5, empty: 2, seed: 311 },
  { id: 6, name: "Пять огней", difficulty: "medium", colors: 5, empty: 2, seed: 328 },
  { id: 7, name: "Неоновая башня", difficulty: "medium", colors: 6, empty: 2, seed: 417 },
  { id: 8, name: "Лаборатория", difficulty: "medium", colors: 6, empty: 2, seed: 452 },
  { id: 9, name: "Магический шторм", difficulty: "hard", colors: 7, empty: 2, seed: 509 },
  { id: 10, name: "Семь ключей", difficulty: "hard", colors: 7, empty: 2, seed: 577 },
  { id: 11, name: "Хрустальный хаос", difficulty: "hard", colors: 8, empty: 2, seed: 618 },
  { id: 12, name: "Звездный коктейль", difficulty: "hard", colors: 8, empty: 2, seed: 690 },
  { id: 13, name: "Аркана", difficulty: "expert", colors: 6, empty: 1, seed: 733 },
  { id: 14, name: "Последняя колба", difficulty: "expert", colors: 9, empty: 2, seed: 808 },
  { id: 15, name: "Гранд-финал", difficulty: "expert", colors: 7, empty: 1, seed: 909 },
  { id: 16, name: "Мастер сортировки", difficulty: "expert", colors: 10, empty: 2, seed: 1016 },
];

var handmade = {
  1: [
    ["red", "blue", "red", "blue"],
    ["blue", "red", "blue", "red"],
    [],
    [],
  ],
  2: [
    ["red", "lime", "blue", "red"],
    ["lime", "blue", "red", "lime"],
    ["blue", "red", "lime", "blue"],
    [],
    [],
  ],
};

function buildLevel(spec) {
  var bottles;
  if (spec.handmade) {
    bottles = handmade[spec.id];
    if (!L.isSolvable(bottles, C.CAPACITY, 20000)) {
      throw new Error("Handmade level " + spec.id + " is not solvable");
    }
  } else {
    var ids = C.PALETTE.slice(0, spec.colors).map(function (color) {
      return color.id;
    });
    bottles = L.generatePuzzle(ids, spec.empty, C.CAPACITY, spec.seed, 120);
    if (!bottles) {
      throw new Error("Failed to generate level " + spec.id);
    }
  }

  return {
    id: spec.id,
    name: spec.name,
    difficulty: spec.difficulty,
    time: C.LEVEL_TIME,
    capacity: C.CAPACITY,
    bottles: bottles,
  };
}

var levels = SPECS.map(function (spec) {
  var started = Date.now();
  var level = buildLevel(spec);
  console.log(
    "level",
    level.id,
    level.difficulty,
    "bottles=" + level.bottles.length,
    "ms=" + (Date.now() - started)
  );
  return level;
});

process.stdout.write(JSON.stringify(levels, null, 2));
