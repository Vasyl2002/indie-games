(function (global) {
  "use strict";

  var STORAGE_KEY = "magic-sort-lang";

  var LEVEL_NAMES = {
    1: { en: "First Drops", ru: "Первые капли" },
    2: { en: "Three Elements", ru: "Три стихии" },
    3: { en: "Rainbow Start", ru: "Радуга старт" },
    4: { en: "Bright Mix", ru: "Яркий микс" },
    5: { en: "Color Vortex", ru: "Цветной вихрь" },
    6: { en: "Five Fires", ru: "Пять огней" },
    7: { en: "Neon Tower", ru: "Неоновая башня" },
    8: { en: "Lab Night", ru: "Лаборатория" },
    9: { en: "Magic Storm", ru: "Магический шторм" },
    10: { en: "Seven Keys", ru: "Семь ключей" },
    11: { en: "Crystal Chaos", ru: "Хрустальный хаос" },
    12: { en: "Star Cocktail", ru: "Звездный коктейль" },
    13: { en: "Arcana", ru: "Аркана" },
    14: { en: "Last Flask", ru: "Последняя колба" },
    15: { en: "Grand Finale", ru: "Гранд-финал" },
    16: { en: "Sort Master", ru: "Мастер сортировки" },
  };

  var STRINGS = {
    en: {
      brandTag: "Bright color sorter",
      lead: "Pour neon colors between flasks until each one is a single color. 16 levels from easy to expert. Every level lasts 1:30.",
      howto: "Tap a flask with liquid, then tap another. You can pour only onto the same color or into an empty flask. The whole top run of one color moves at once. Finish the puzzle before the timer ends.",
      play: "Play",
      howToPlay: "How to play",
      back: "Back",
      levelsTitle: "Levels",
      levelPrefix: "Lv.",
      moves: "moves",
      undo: "Undo",
      restart: "Restart",
      menu: "Menu",
      winTitle: "Level complete!",
      winDetail: "{name} · {time} left · {moves} moves",
      loseTitle: "Time's up!",
      loseDetail: "Try again — every level gives you 1:30.",
      next: "Next",
      retry: "Retry",
      toLevels: "Levels",
      musicOn: "♪ Music",
      musicOff: "♪ Off",
      sfxOn: "🔊 Sounds",
      sfxOff: "🔇 Off",
      audioLabel: "Sound",
      langLabel: "Language",
      diffEasy: "Easy",
      diffMedium: "Medium",
      diffHard: "Hard",
      diffExpert: "Expert",
    },
    ru: {
      brandTag: "Яркий сортировщик",
      lead: "Переливай неоновые цвета по колбам, пока каждая не станет одноцветной. 16 уровней — от лёгких до экспертных. На каждом уровне ровно 1:30.",
      howto: "Нажми на колбу с жидкостью, затем на другую. Лить можно только на такой же цвет или в пустую колбу. Сразу переливается вся верхняя цепочка одного цвета. Успей разложить пазл до конца таймера.",
      play: "Играть",
      howToPlay: "Как играть",
      back: "Назад",
      levelsTitle: "Уровни",
      levelPrefix: "Ур.",
      moves: "ходов",
      undo: "Отмена",
      restart: "Заново",
      menu: "Меню",
      winTitle: "Уровень пройден!",
      winDetail: "{name} · {time} осталось · {moves} ходов",
      loseTitle: "Время вышло!",
      loseDetail: "Попробуй ещё раз — у тебя 1:30 на каждый уровень.",
      next: "Дальше",
      retry: "Ещё раз",
      toLevels: "К уровням",
      musicOn: "♪ Музыка",
      musicOff: "♪ Выкл",
      sfxOn: "🔊 Звуки",
      sfxOff: "🔇 Выкл",
      audioLabel: "Звук",
      langLabel: "Язык",
      diffEasy: "Легко",
      diffMedium: "Средне",
      diffHard: "Сложно",
      diffExpert: "Эксперт",
    },
  };

  var lang = "en";

  function loadLang() {
    try {
      var saved = global.localStorage && localStorage.getItem(STORAGE_KEY);
      if (saved === "ru" || saved === "en") {
        lang = saved;
      }
    } catch (err) {
      lang = "en";
    }
  }

  function saveLang() {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      return;
    }
  }

  function t(key, vars) {
    var table = STRINGS[lang] || STRINGS.en;
    var text = table[key] || STRINGS.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        text = text.split("{" + name + "}").join(String(vars[name]));
      });
    }
    return text;
  }

  function levelName(id) {
    var names = LEVEL_NAMES[id];
    if (!names) {
      return "";
    }
    return names[lang] || names.en;
  }

  function difficultyLabel(key) {
    var map = {
      easy: "diffEasy",
      medium: "diffMedium",
      hard: "diffHard",
      expert: "diffExpert",
    };
    return t(map[key] || key);
  }

  function setLang(next) {
    lang = next === "ru" ? "ru" : "en";
    saveLang();
    if (global.document && document.documentElement) {
      document.documentElement.lang = lang;
    }
    return lang;
  }

  loadLang();

  global.I18n = {
    t: t,
    levelName: levelName,
    difficultyLabel: difficultyLabel,
    setLang: setLang,
    getLang: function () {
      return lang;
    },
    LEVEL_NAMES: LEVEL_NAMES,
  };
})(typeof window !== "undefined" ? window : global);
