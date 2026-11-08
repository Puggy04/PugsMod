/* Couch TV — a tiny 10-foot launcher for Samsung Tizen TVs.
 * No frameworks, no build step. Runs as a Tizen web app on the TV, or in any
 * desktop browser for preview (arrow keys + Enter + Backspace/Escape). */
(function () {
  "use strict";

  var cfg = window.COUCH_CONFIG;
  var isTizen = typeof window.tizen !== "undefined";
  var COLS = 4;

  // Samsung remote key codes (Tizen TV)
  var KEY = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13,
    BACK: 10009, ESC: 27, BACKSPACE: 8,
    RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406
  };

  var tilesEl = document.getElementById("tiles");
  var stage = document.getElementById("stage");
  var saver = document.getElementById("saver");
  var saverClock = document.getElementById("saver-clock");
  var toastEl = document.getElementById("toast");

  var tiles = [];
  var focus = 0;
  var idleTimer = null;
  var saverMoveTimer = null;

  /* ---------- Remote keys ---------- */
  function registerKeys() {
    if (!isTizen || !tizen.tvinputdevice) return;
    ["ColorF0Red", "ColorF1Green", "ColorF2Yellow", "ColorF3Blue"].forEach(function (k) {
      try { tizen.tvinputdevice.registerKey(k); } catch (e) { /* key not supported */ }
    });
  }

  /* ---------- Resolve tiles against installed apps ---------- */
  function resolveApps(done) {
    if (!isTizen || !tizen.application || !tizen.application.getAppsInfo) {
      done([]);
      return;
    }
    tizen.application.getAppsInfo(function (apps) { done(apps || []); },
                                   function () { done([]); });
  }

  function buildTiles(installed) {
    tiles = cfg.tiles.map(function (t) {
      var appId = t.appId || null;
      if (!appId && t.match) {
        var m = t.match.toLowerCase();
        for (var i = 0; i < installed.length; i++) {
          var a = installed[i];
          if (a.show !== false && a.name && a.name.toLowerCase().indexOf(m) !== -1) {
            appId = a.id;
            break;
          }
        }
      }
      return { label: t.label, color: t.color, url: t.url, appId: appId };
    });

    tilesEl.innerHTML = "";
    tiles.forEach(function (t, i) {
      var el = document.createElement("div");
      el.className = "tile" + (isTizen && !t.appId ? " missing" : "");
      el.style.setProperty("--brand", t.color || "#444");
      el.textContent = t.label;
      el.addEventListener("click", function () { setFocus(i); open(i); });
      tilesEl.appendChild(el);
    });
    setFocus(0);
  }

  function setFocus(i) {
    var els = tilesEl.children;
    if (!els.length) return;
    focus = Math.max(0, Math.min(els.length - 1, i));
    for (var j = 0; j < els.length; j++) els[j].classList.toggle("focused", j === focus);
  }

  function open(i) {
    var t = tiles[i];
    if (!t) return;
    if (isTizen && t.appId) {
      tizen.application.launch(t.appId, null, function () {
        toast("Couldn't open " + t.label);
      });
      return;
    }
    if (t.url && t.url !== "about:blank") {
      if (isTizen) {
        // Hand the URL to the built-in Samsung Internet browser.
        try {
          var ctrl = new tizen.ApplicationControl(
            "http://tizen.org/appcontrol/operation/view", t.url);
          tizen.application.launchAppControl(ctrl, null, null,
            function () { toast(t.label + " isn't installed"); });
        } catch (e) { toast(t.label + " isn't installed"); }
      } else {
        window.open(t.url, "_blank");
      }
      return;
    }
    toast(t.label + " isn't installed");
  }

  function exitApp() {
    if (isTizen) {
      try { tizen.application.getCurrentApplication().exit(); } catch (e) {}
    }
  }

  /* ---------- Clock & greeting ---------- */
  function fmtTime(d) {
    var h = d.getHours(), m = d.getMinutes();
    var mm = (m < 10 ? "0" : "") + m;
    if (cfg.use24h) return (h < 10 ? "0" : "") + h + ":" + mm;
    return ((h % 12) || 12) + ":" + mm;
  }
  function tick() {
    var d = new Date();
    var t = fmtTime(d);
    document.getElementById("clock").textContent = t;
    saverClock.textContent = t;
    var h = d.getHours();
    var part = h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    document.getElementById("greeting").textContent = part + (cfg.name ? ", " + cfg.name : "");
  }

  /* ---------- OLED care ---------- */
  function pixelShift() {
    var max = cfg.pixelShiftMaxPx;
    var dx = Math.round((Math.random() * 2 - 1) * max);
    var dy = Math.round((Math.random() * 2 - 1) * max);
    stage.style.transform = "translate(" + dx + "px," + dy + "px)";
  }

  function moveSaverClock() {
    saverClock.style.left = Math.round(80 + Math.random() * 1500) + "px";
    saverClock.style.top = Math.round(80 + Math.random() * 840) + "px";
  }

  function showSaver() {
    if (!saver.hidden) return;
    saver.hidden = false;
    moveSaverClock();
    saverMoveTimer = setInterval(moveSaverClock, 20000);
  }

  function hideSaver() {
    if (saver.hidden) return false;
    saver.hidden = true;
    clearInterval(saverMoveTimer);
    return true;
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(showSaver, cfg.screensaverAfterSec * 1000);
  }

  /* ---------- UI helpers ---------- */
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2500);
  }

  /* ---------- Input ---------- */
  function onKey(e) {
    resetIdle();
    // Any key wakes the screensaver without triggering an action.
    if (hideSaver()) { e.preventDefault(); return; }

    switch (e.keyCode) {
      case KEY.LEFT:  setFocus(focus - 1); break;
      case KEY.RIGHT: setFocus(focus + 1); break;
      case KEY.UP:    if (focus - COLS >= 0) setFocus(focus - COLS); break;
      case KEY.DOWN:  if (focus + COLS < tiles.length) setFocus(focus + COLS); break;
      case KEY.ENTER: open(focus); break;
      case KEY.RED:   showSaver(); break;          // quick "screen off" for music etc.
      case KEY.BACK:
      case KEY.ESC:
      case KEY.BACKSPACE: exitApp(); break;
      default: return;
    }
    e.preventDefault();
  }

  /* ---------- Boot ---------- */
  document.addEventListener("keydown", onKey);
  document.addEventListener("mousemove", resetIdle);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { hideSaver(); resetIdle(); tick(); }
  });

  registerKeys();
  tick();
  setInterval(tick, 10000);
  setInterval(pixelShift, cfg.pixelShiftEverySec * 1000);
  resetIdle();
  resolveApps(buildTiles);
})();
