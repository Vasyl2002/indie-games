(function (global) {
  "use strict";

  var ready = false;
  var showingAd = false;
  var hooks = {
    onPause: function () {},
    onResume: function () {},
  };

  function sdk() {
    return global.CrazyGames && global.CrazyGames.SDK ? global.CrazyGames.SDK : null;
  }

  function gameModule() {
    var instance = sdk();
    return instance && instance.game ? instance.game : null;
  }

  function adModule() {
    var instance = sdk();
    return instance && instance.ad ? instance.ad : null;
  }

  function safeCall(fn, args) {
    try {
      return fn.apply(null, args || []);
    } catch (err) {
      return null;
    }
  }

  function init(options) {
    if (options) {
      hooks.onPause = options.onPause || hooks.onPause;
      hooks.onResume = options.onResume || hooks.onResume;
    }

    var instance = sdk();
    if (!instance) {
      ready = true;
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
        return instance;
      })
      .catch(function () {
        ready = true;
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

  function showInterstitial(onDone) {
    var done = typeof onDone === "function" ? onDone : function () {};
    var finished = false;

    function finish() {
      if (finished) {
        return;
      }
      finished = true;
      showingAd = false;
      hooks.onResume();
      done();
    }

    if (showingAd) {
      done();
      return;
    }

    var ads = adModule();
    if (!ads || typeof ads.requestAd !== "function") {
      done();
      return;
    }

    showingAd = true;
    gameplayStop();
    hooks.onPause();

    try {
      ads.requestAd("midgame", {
        adStarted: function () {
          hooks.onPause();
        },
        adFinished: function () {
          finish();
        },
        adError: function () {
          finish();
        },
      });
    } catch (err) {
      finish();
    }
  }

  global.CrazySDK = {
    init: init,
    gameplayStart: gameplayStart,
    gameplayStop: gameplayStop,
    showInterstitial: showInterstitial,
    isReady: function () {
      return ready;
    },
  };
})(typeof window !== "undefined" ? window : global);
