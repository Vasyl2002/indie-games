(function (global) {
  "use strict";

  var CDN_SDK = "https://sdk.games.s3.yandex.net/sdk.js";
  var ysdk = null;
  var ready = false;
  var showingAd = false;
  var hooks = {
    onPause: function () {},
    onResume: function () {},
  };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = function () {
        resolve(src);
      };
      script.onerror = function () {
        reject(new Error("SDK load failed: " + src));
      };
      document.head.appendChild(script);
    });
  }

  function ensureSdkScript() {
    if (global.YaGames) {
      return Promise.resolve();
    }
    return loadScript("/sdk.js").catch(function () {
      return loadScript(CDN_SDK);
    });
  }

  function bindEvents(sdk) {
    if (!sdk || typeof sdk.on !== "function") {
      return;
    }
    sdk.on("game_api_pause", function () {
      hooks.onPause();
    });
    sdk.on("game_api_resume", function () {
      hooks.onResume();
    });
  }

  function init(options) {
    if (options) {
      hooks.onPause = options.onPause || hooks.onPause;
      hooks.onResume = options.onResume || hooks.onResume;
    }
    return ensureSdkScript()
      .then(function () {
        if (!global.YaGames || typeof global.YaGames.init !== "function") {
          return null;
        }
        return global.YaGames.init();
      })
      .then(function (sdk) {
        ysdk = sdk || null;
        ready = true;
        if (!ysdk) {
          return null;
        }
        bindEvents(ysdk);
        if (ysdk.features && ysdk.features.LoadingAPI && ysdk.features.LoadingAPI.ready) {
          ysdk.features.LoadingAPI.ready();
        }
        return ysdk;
      })
      .catch(function () {
        ready = true;
        ysdk = null;
        return null;
      });
  }

  function startGameplay() {
    if (ysdk && ysdk.features && ysdk.features.GameplayAPI && ysdk.features.GameplayAPI.start) {
      ysdk.features.GameplayAPI.start();
    }
  }

  function stopGameplay() {
    if (ysdk && ysdk.features && ysdk.features.GameplayAPI && ysdk.features.GameplayAPI.stop) {
      ysdk.features.GameplayAPI.stop();
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

    if (!ysdk || !ysdk.adv || typeof ysdk.adv.showFullscreenAdv !== "function") {
      done();
      return;
    }

    showingAd = true;
    stopGameplay();
    hooks.onPause();

    try {
      ysdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: function () {
            hooks.onPause();
          },
          onClose: function () {
            finish();
          },
          onError: function () {
            finish();
          },
        },
      });
    } catch (err) {
      finish();
    }
  }

  global.YandexSDK = {
    init: init,
    startGameplay: startGameplay,
    stopGameplay: stopGameplay,
    showInterstitial: showInterstitial,
    isReady: function () {
      return ready;
    },
    getSdk: function () {
      return ysdk;
    },
  };
})(typeof window !== "undefined" ? window : global);
