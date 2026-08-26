(function (global) {
  "use strict";

  var ready = false;
  var muteBound = false;
  var windowMuteBound = false;
  var lastMute = null;
  var pollTimer = 0;
  var hooks = {
    onPause: function () {},
    onResume: function () {},
    onMute: function () {},
  };

  function sdk() {
    return global.CrazyGames && global.CrazyGames.SDK ? global.CrazyGames.SDK : null;
  }

  function gameModule() {
    try {
      var instance = sdk();
      if (!instance) {
        return null;
      }
      return instance.game || null;
    } catch (err) {
      return null;
    }
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
    try {
      if (game && game.settings && game.settings.muteAudio) {
        return true;
      }
    } catch (err) {
      return false;
    }
    return false;
  }

  function applyMute(value) {
    value = !!value;
    if (lastMute === value) {
      return;
    }
    lastMute = value;
    hooks.onMute(value);
  }

  function muteFromMessage(data) {
    if (!data || typeof data !== "object") {
      return;
    }
    var payload = data.data && typeof data.data === "object" ? data.data : data;
    var type = data.type || payload.type;
    var muted = payload.muteAudio;
    if (typeof muted !== "boolean") {
      muted = data.muteAudio;
    }
    if (type === "audioChanged" && typeof muted === "boolean") {
      applyMute(queryMute() || muted);
    }
  }

  function bindWindowMute() {
    if (windowMuteBound || typeof global.addEventListener !== "function") {
      return;
    }
    windowMuteBound = true;
    global.addEventListener("message", function (event) {
      muteFromMessage(event && event.data);
    });
  }

  function startPolling() {
    if (pollTimer || typeof global.document === "undefined") {
      return;
    }
    pollTimer = global.setInterval(function () {
      applyMute(readMute());
    }, 400);
  }

  function callGameFn(names) {
    var game = gameModule();
    var i;
    var fn;
    if (!game) {
      return;
    }
    for (i = 0; i < names.length; i += 1) {
      fn = game[names[i]];
      if (typeof fn === "function") {
        safeCall(fn.bind(game));
        return;
      }
    }
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

  function finishInit(instance) {
    ready = true;
    callGameFn(["loadingStop", "sdkGameLoadingStop"]);
    bindMute();
    startPolling();
    return instance;
  }

  function init(options) {
    if (options) {
      hooks.onPause = options.onPause || hooks.onPause;
      hooks.onResume = options.onResume || hooks.onResume;
      hooks.onMute = options.onMute || hooks.onMute;
    }

    lastMute = null;
    bindWindowMute();
    applyMute(readMute());

    var instance = sdk();
    if (!instance) {
      return Promise.resolve(finishInit(null));
    }

    var started = Promise.resolve();
    if (typeof instance.init === "function") {
      try {
        started = Promise.resolve(instance.init()).catch(function () {
          return instance;
        });
      } catch (err) {
        started = Promise.resolve(instance);
      }
    }

    return started
      .then(function () {
        callGameFn(["loadingStart", "sdkGameLoadingStart"]);
        return finishInit(instance);
      })
      .catch(function () {
        return finishInit(null);
      });
  }

  function gameplayStart() {
    callGameFn(["gameplayStart"]);
  }

  function gameplayStop() {
    callGameFn(["gameplayStop"]);
  }

  function happytime() {
    callGameFn(["happytime"]);
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
