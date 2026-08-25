(function (global) {
  "use strict";

  var TYPES = [
    { id: "duck", color: "#ffd93d", accent: "#ff8a3c", label: { en: "Duck", ru: "Утка" } },
    { id: "ball", color: "#ff4d6d", accent: "#3b7dff", label: { en: "Ball", ru: "Мяч" } },
    { id: "gem", color: "#8fbf3a", accent: "#6a4a2a", label: { en: "Kiwi", ru: "Киви" } },
    { id: "donut", color: "#ff7ad9", accent: "#ffe566", label: { en: "Donut", ru: "Пончик" } },
    { id: "apple", color: "#ff3b5c", accent: "#8dff3c", label: { en: "Apple", ru: "Яблоко" } },
    { id: "star", color: "#ff9f1c", accent: "#8dff3c", label: { en: "Orange", ru: "Апельсин" } },
    { id: "cupcake", color: "#fff4d6", accent: "#ffd166", label: { en: "Egg", ru: "Яйцо" } },
    { id: "balloon", color: "#ff5a6a", accent: "#ffe566", label: { en: "Balloon", ru: "Шарик" } },
    { id: "candy", color: "#ff4d6d", accent: "#fff", label: { en: "Lollipop", ru: "Леденец" } },
    { id: "cat", color: "#f4a261", accent: "#5c4d3c", label: { en: "Cat", ru: "Кот" } },
    { id: "burger", color: "#f4a261", accent: "#8dff3c", label: { en: "Burger", ru: "Бургер" } },
    { id: "rocket", color: "#3b7dff", accent: "#ff4d6d", label: { en: "Boat", ru: "Катер" } },
    { id: "heart", color: "#ff4d6d", accent: "#2f9e44", label: { en: "Melon", ru: "Арбуз" } },
    { id: "fish", color: "#ffb703", accent: "#e63946", label: { en: "Pizza", ru: "Пицца" } },
    { id: "bell", color: "#ffe566", accent: "#b08968", label: { en: "Banana", ru: "Банан" } },
    { id: "cube", color: "#e63946", accent: "#dfe7ef", label: { en: "Soda", ru: "Газировка" } },
  ];

  var TYPE_MAP = {};
  TYPES.forEach(function (type) {
    TYPE_MAP[type.id] = type;
  });

  global.MatchConfig = {
    TRAY_SIZE: 10,
    MATCH_SIZE: 2,
    MAX_TIME: 180,
    WIN_COINS: 30,
    BOMB_COST: 30,
    BLAST_RADIUS: 1.95,
    TYPES: TYPES,
    TYPE_MAP: TYPE_MAP,
  };
})(typeof window !== "undefined" ? window : global);
