(function (global) {
  "use strict";

  function GameAds() {
    this.busy = false;
  }

  GameAds.prototype.showRewarded = function (onDone) {
    var self = this;
    var done = typeof onDone === "function" ? onDone : function () {};
    if (this.busy) {
      done(false);
      return;
    }
    this.busy = true;

    if (global.GameAdsSDK && typeof global.GameAdsSDK.showRewarded === "function") {
      global.GameAdsSDK.showRewarded(function (ok) {
        self.busy = false;
        done(!!ok);
      });
      return;
    }

    var overlay = document.getElementById("ad-overlay");
    overlay.classList.remove("hidden");
    var seconds = 3;
    var label = document.getElementById("ad-count");
    label.textContent = seconds;
    var timer = setInterval(function () {
      seconds -= 1;
      label.textContent = String(Math.max(0, seconds));
      if (seconds <= 0) {
        clearInterval(timer);
        overlay.classList.add("hidden");
        self.busy = false;
        done(true);
      }
    }, 1000);
  };

  global.GameAds = GameAds;
})(typeof window !== "undefined" ? window : global);
