(function (global) {
  "use strict";

  var TYPES = [
    { id: "duck", color: "#ffd93d", accent: "#ff8a3c", label: { en: "Duck", ru: "Утка" } },
    { id: "ball", color: "#ff4d6d", accent: "#fff", label: { en: "Ball", ru: "Мяч" } },
    { id: "gem", color: "#5ad6ff", accent: "#b8f3ff", label: { en: "Gem", ru: "Кристалл" } },
    { id: "donut", color: "#ff7ad9", accent: "#ffe566", label: { en: "Donut", ru: "Пончик" } },
    { id: "apple", color: "#ff3b5c", accent: "#8dff3c", label: { en: "Apple", ru: "Яблоко" } },
    { id: "star", color: "#ffe566", accent: "#ffb703", label: { en: "Star", ru: "Звезда" } },
    { id: "cupcake", color: "#c77dff", accent: "#ffb4d9", label: { en: "Cupcake", ru: "Капкейк" } },
    { id: "balloon", color: "#4dffb8", accent: "#ff4d6d", label: { en: "Balloon", ru: "Шарик" } },
    { id: "candy", color: "#ff9f1c", accent: "#ff4d6d", label: { en: "Candy", ru: "Конфета" } },
    { id: "cat", color: "#ffb4a2", accent: "#5c4d3c", label: { en: "Cat", ru: "Кот" } },
    { id: "burger", color: "#f4a261", accent: "#8dff3c", label: { en: "Burger", ru: "Бургер" } },
    { id: "rocket", color: "#7aa2ff", accent: "#ff4d6d", label: { en: "Rocket", ru: "Ракета" } },
    { id: "heart", color: "#ff4d6d", accent: "#ff9aa2", label: { en: "Heart", ru: "Сердце" } },
    { id: "fish", color: "#00bbf9", accent: "#ff9f1c", label: { en: "Fish", ru: "Рыбка" } },
    { id: "bell", color: "#ffd166", accent: "#b08968", label: { en: "Bell", ru: "Колокол" } },
    { id: "cube", color: "#9b5de5", accent: "#f15bb5", label: { en: "Cube", ru: "Кубик" } },
  ];

  var TYPE_MAP = {};
  TYPES.forEach(function (type) {
    TYPE_MAP[type.id] = type;
  });

  global.MatchConfig = {
    TRAY_SIZE: 6,
    MATCH_SIZE: 2,
    MAX_TIME: 180,
    TYPES: TYPES,
    TYPE_MAP: TYPE_MAP,
  };
})(typeof window !== "undefined" ? window : global);
