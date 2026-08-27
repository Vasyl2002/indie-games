"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var scope = {
  window: { document: { documentElement: { lang: "en" } } },
  global: null,
  document: { documentElement: { lang: "en" } },
  localStorage: {
    getItem: function () {
      return null;
    },
    setItem: function () {},
  },
};
scope.global = scope;
scope.window = scope;

vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "js/i18n.js"), "utf8"), scope);

assert.strictEqual(scope.I18n.getLang(), "en");
assert.strictEqual(scope.I18n.t("play"), "Play");
assert.strictEqual(scope.I18n.levelName(1), "First Drops");
assert.strictEqual(scope.I18n.difficultyLabel("easy"), "Easy");
scope.I18n.setLang("ru");
assert.strictEqual(scope.I18n.getLang(), "ru");
assert.strictEqual(scope.I18n.t("play"), "Играть");
assert.strictEqual(scope.I18n.levelName(1), "Первые капли");
assert.strictEqual(scope.I18n.t("winDetail", { name: "A", time: "1:00", moves: 3 }).indexOf("A") >= 0, true);
console.log("i18n tests passed");
