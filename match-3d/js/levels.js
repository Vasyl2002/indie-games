(function (global) {
  "use strict";

  function level(id, time, goals, extras) {
    return { id: id, time: time, goals: goals, extras: extras || {} };
  }

  global.MATCH_LEVELS = [
    level(1, 50, { duck: 8, ball: 8 }, { burger: 4, donut: 4 }),
    level(2, 55, { apple: 8, star: 8 }, { duck: 4, donut: 4 }),
    level(3, 60, { donut: 8, gem: 6 }, { ball: 4, burger: 4 }),
    level(4, 60, { cat: 8, candy: 6, balloon: 6 }),
    level(5, 70, { cupcake: 8, heart: 8 }, { star: 6, ball: 4 }),
    level(6, 80, { burger: 8, fish: 8, duck: 6 }, { ball: 6 }),
    level(7, 90, { rocket: 8, gem: 8, apple: 8 }, { donut: 6 }),
    level(8, 95, { bell: 10, cube: 8, candy: 8 }, { cat: 6 }),
    level(9, 105, { balloon: 10, heart: 8, star: 8, duck: 6 }),
    level(10, 115, { burger: 10, star: 8, fish: 8, donut: 8 }, { apple: 6, ball: 6 }),
    level(11, 125, { cat: 10, cupcake: 10, gem: 8, rocket: 8 }, { candy: 8 }),
    level(12, 135, { duck: 12, balloon: 10, star: 10, cube: 8 }, { heart: 8 }),
    level(13, 145, { apple: 12, donut: 10, fish: 10, bell: 8, ball: 8 }),
    level(14, 150, { burger: 12, cat: 10, rocket: 10, candy: 8, gem: 8 }),
    level(15, 160, { heart: 12, cupcake: 10, balloon: 10, star: 10, cube: 8 }, { duck: 8 }),
    level(16, 170, { fish: 12, apple: 12, donut: 10, bell: 10, ball: 10 }, { cat: 8, gem: 6 }),
    level(17, 175, { rocket: 14, burger: 12, candy: 10, cupcake: 10, heart: 8 }, { star: 10 }),
    level(18, 180, { duck: 14, balloon: 12, cube: 10, fish: 10, gem: 10, apple: 8 }),
    level(19, 180, { cat: 14, donut: 12, star: 12, bell: 10, ball: 10, candy: 8 }, { heart: 8 }),
    level(20, 180, { burger: 14, rocket: 12, cupcake: 12, balloon: 10, cube: 10, fish: 10, gem: 8 }, { duck: 10, apple: 8 }),
  ];

  global.MATCH_LEVELS.forEach(function (entry) {
    Object.keys(entry.goals).forEach(function (key) {
      if (!entry.goals[key]) {
        delete entry.goals[key];
      }
    });
  });
})(typeof window !== "undefined" ? window : global);
