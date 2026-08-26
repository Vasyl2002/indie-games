(function (global) {
  "use strict";

  var ready = false;
  var muteBound = false;
  var hooks = {
    onPause: function () {},
    onResume: function () {},
    onMute: function () {},
  };

  function sdk() {
    return global.CrazyGames && global.CrazyGames.SDK ? global.CrazyGames.SDK : null;
  }

  function gameModule() {
    var instance = sdk();
    return instance && instance.game ? instance.game : null;
  }

  function safeCall(fn, args) {
    try {
      return fn.apply(null, args || []);
    } catch (err) {
      return null;
    }
  }

  function queryMute() {
    try {
      var search = (global.location && global.location.search) || "";
      return /(?:^|[?&])muteAudio=true(?:&|$)/.test(search);
    } catch (err) {
      return false;
    }
  }

  function readMute() {
    if (queryMute()) {
      return true;
    }
    var game = gameModule();
    if (game && game.settings && game.settings.muteAudio) {
      return true;
    }
    return false;
  }

  function applyMute(value) {
    hooks.onMute(!!value);
  }

  function bindMute() {
    applyMute(readMute());
    var game = gameModule();
    if (!game || muteBound) {
      return;
    }
    muteBound = true;
    if (typeof game.addSettingsChangeListener === "function") {
      safeCall(game.addSettingsChangeListener.bind(game), [
        function (settings) {
          applyMute(queryMute() || !!(settings && settings.muteAudio));
        },
      ]);
    }
    if (typeof game.addEventListener === "function") {
      safeCall(game.addEventListener.bind(game), [
        "mute",
        function () {
          applyMute(true);
        },
      ]);
      safeCall(game.addEventListener.bind(game), [
        "unmute",
        function () {
          applyMute(queryMute());
        },
      ]);
    }
  }

  function init(options) {
    if (options) {
      hooks.onPause = options.onPause || hooks.onPause;
      hooks.onResume = options.onResume || hooks.onResume;
      hooks.onMute = options.onMute || hooks.onMute;
    }

    applyMute(readMute());

    var instance = sdk();
    if (!instance) {
      ready = true;
      bindMute();
      return Promise.resolve(null);
    }

    var startLoading = gameModule() && gameModule().sdkGameLoadingStart;
    if (typeof startLoading === "function") {
      safeCall(startLoading.bind(gameModule()));
    }

    var started = Promise.resolve();
    if (typeof instance.init === "function") {
      started = Promise.resolve(instance.init()).catch(function () {
        return instance;
      });
    }

    return started
      .then(function () {
        ready = true;
        var stopLoading = gameModule() && gameModule().sdkGameLoadingStop;
        if (typeof stopLoading === "function") {
          safeCall(stopLoading.bind(gameModule()));
        }
        bindMute();
        return instance;
      })
      .catch(function () {
        ready = true;
        bindMute();
        return null;
      });
  }

  function gameplayStart() {
    var game = gameModule();
    if (game && typeof game.gameplayStart === "function") {
      safeCall(game.gameplayStart.bind(game));
    }
  }

  function gameplayStop() {
    var game = gameModule();
    if (game && typeof game.gameplayStop === "function") {
      safeCall(game.gameplayStop.bind(game));
    }
  }

  function happytime() {
    var game = gameModule();
    if (game && typeof game.happytime === "function") {
      safeCall(game.happytime.bind(game));
    }
  }

  global.CrazySDK = {
    init: init,
    gameplayStart: gameplayStart,
    gameplayStop: gameplayStop,
    happytime: happytime,
    isAudioMuted: readMute,
    isReady: function () {
      return ready;
    },
  };
})(typeof window !== "undefined" ? window : global);
