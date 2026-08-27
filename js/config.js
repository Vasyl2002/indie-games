(function (global) {
  "use strict";

  var CAPACITY = 4;
  var LEVEL_TIME = 90;

  var PALETTE = [
    { id: "red", fill: "#ff3b6a", glow: "#ff7a9d", deep: "#b01038" },
    { id: "orange", fill: "#ff8a3c", glow: "#ffb56e", deep: "#c45210" },
    { id: "yellow", fill: "#ffe14a", glow: "#fff1a3", deep: "#c9a60c" },
    { id: "lime", fill: "#8dff3c", glow: "#c4ff8a", deep: "#4aa010" },
    { id: "cyan", fill: "#3defff", glow: "#9af8ff", deep: "#0a93a8" },
    { id: "blue", fill: "#4d8cff", glow: "#93b8ff", deep: "#1a4aae" },
    { id: "purple", fill: "#b44dff", glow: "#d29aff", deep: "#6a18b0" },
    { id: "pink", fill: "#ff4ec8", glow: "#ff97e0", deep: "#b0127a" },
    { id: "mint", fill: "#3effc1", glow: "#96ffe0", deep: "#0a9a72" },
    { id: "violet", fill: "#7a5cff", glow: "#b4a6ff", deep: "#3a28a8" },
  ];

  var DIFFICULTY = {
    easy: { label: "Легко", badge: "easy", stars: 1 },
    medium: { label: "Средне", badge: "medium", stars: 2 },
    hard: { label: "Сложно", badge: "hard", stars: 3 },
    expert: { label: "Эксперт", badge: "expert", stars: 4 },
  };

  var SLOGANS = [
    "SORT WATER!",
    "ENJOY PUZZLES!",
    "RELIEVE STRESS!",
    "CHALLENGE YOURSELF!",
    "WIN EVENTS!",
    "MAGIC SORT!",
  ];

  var COLOR_BY_ID = PALETTE.reduce(function (map, color) {
    map[color.id] = color;
    return map;
  }, {});

  global.GameConfig = {
    CAPACITY: CAPACITY,
    LEVEL_TIME: LEVEL_TIME,
    PALETTE: PALETTE,
    COLOR_BY_ID: COLOR_BY_ID,
    DIFFICULTY: DIFFICULTY,
    SLOGANS: SLOGANS,
  };
})(typeof window !== "undefined" ? window : global);
