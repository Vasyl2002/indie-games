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

    function finish(ok) {
      self.busy = false;
      done(!!ok);
    }

    if (global.CrazyGames && global.CrazyGames.SDK && global.CrazyGames.SDK.ad && global.CrazySDK) {
      global.CrazySDK.showRewarded(finish);
      return;
    }

    var overlay = document.getElementById("ad-overlay");
    if (!overlay) {
      finish(false);
      return;
    }
    overlay.classList.remove("hidden");
    var seconds = 3;
    var label = document.getElementById("ad-count");
    if (label) {
      label.textContent = seconds;
    }
    var timer = setInterval(function () {
      seconds -= 1;
      if (label) {
        label.textContent = String(Math.max(0, seconds));
      }
      if (seconds <= 0) {
        clearInterval(timer);
        overlay.classList.add("hidden");
        finish(true);
      }
    }, 1000);
  };

  global.GameAds = GameAds;
})(typeof window !== "undefined" ? window : global);
