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

  function happytime() {
    var game = gameModule();
    if (game && typeof game.happytime === "function") {
      safeCall(game.happytime.bind(game));
    }
  }

  function requestAd(kind, onDone, reward) {
    var done = typeof onDone === "function" ? onDone : function () {};
    var finished = false;

    function finish(ok) {
      if (finished) {
        return;
      }
      finished = true;
      showingAd = false;
      hooks.onResume();
      done(!!ok);
    }

    if (showingAd) {
      done(false);
      return;
    }

    var ads = adModule();
    if (!ads || typeof ads.requestAd !== "function") {
      done(!reward);
      return;
    }

    showingAd = true;
    gameplayStop();
    hooks.onPause();

    try {
      ads.requestAd(kind, {
        adStarted: function () {
          hooks.onPause();
        },
        adFinished: function () {
          finish(true);
        },
        adError: function () {
          finish(false);
        },
      });
    } catch (err) {
      finish(false);
    }
  }

  function showInterstitial(onDone) {
    requestAd("midgame", function () {
      if (typeof onDone === "function") {
        onDone();
      }
    }, false);
  }

  function showRewarded(onDone) {
    requestAd("rewarded", onDone, true);
  }

  global.CrazySDK = {
    init: init,
    gameplayStart: gameplayStart,
    gameplayStop: gameplayStop,
    happytime: happytime,
    showInterstitial: showInterstitial,
    showRewarded: showRewarded,
    isReady: function () {
      return ready;
    },
  };
})(typeof window !== "undefined" ? window : global);
