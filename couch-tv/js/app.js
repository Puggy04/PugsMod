/* Couch TV — a tiny 10-foot launcher for Samsung Tizen TVs.
 * No frameworks, no build step. Runs as a Tizen web app on the TV, or in any
 * desktop browser for preview (arrow keys + Enter + Backspace/Escape, G = next photo). */
(function () {
  "use strict";

  var cfg = window.COUCH_CONFIG;
  var isTizen = typeof window.tizen !== "undefined";
  var COLS = cfg.columns || 4;

  // Samsung remote key codes (Tizen TV)
  var KEY = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13,
    BACK: 10009, ESC: 27, BACKSPACE: 8,
    RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406
  };

  var root = document.documentElement;
  var body = document.body;
  var tilesEl = document.getElementById("tiles");
  var stage = document.getElementById("stage");
  var saver = document.getElementById("saver");
  var saverClock = document.getElementById("saver-clock");
  var toastEl = document.getElementById("toast");

  var tiles = [];
  var focus = 0;
  var idleTimer = null;
  var saverMoveTimer = null;
  var inHdmi = false;

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
      return { label: t.label, color: t.color, url: t.url, appId: appId, hdmi: t.hdmi || 0 };
    });

    // Size tiles so the row always spans the same safe-area width (1680px).
    var tileW = Math.floor((1680 - (COLS - 1) * 48) / COLS);
    tilesEl.style.setProperty("--cols", COLS);
    root.style.setProperty("--tile-w", tileW + "px");
    root.style.setProperty("--tile-h", Math.round(tileW * 0.45) + "px");
    tilesEl.innerHTML = "";
    tiles.forEach(function (t, i) {
      var el = document.createElement("div");
      var cls = "tile";
      if (t.hdmi) cls += " input";
      else if (isTizen && !t.appId) cls += " missing";
      el.className = cls;
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
    if (t.hdmi) { showHdmi(t); return; }
    if (isTizen && t.appId) {
      tizen.application.launch(t.appId, null, function () {
        toast("Couldn't open " + t.label);
      });
      return;
    }
    if (t.url) {
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

  /* ---------- HDMI input (e.g. Xbox) ----------
   * Uses Samsung's TV Window API to show the HDMI input full screen behind the
   * (now transparent) page. Back returns to Couch TV. If the API isn't
   * available, Anynet+/HDMI-CEC still switches inputs when the Xbox turns on. */
  function showHdmi(t) {
    var fallback = "Turn on the " + t.label + " — the TV switches to HDMI " + t.hdmi +
                   " by itself when Anynet+ is on";
    if (!isTizen || !tizen.tvwindow) { toast(fallback); return; }
    try {
      tizen.tvwindow.setSource({ type: "HDMI", number: t.hdmi }, function () {
        tizen.tvwindow.show(function () {
          inHdmi = true;
          root.classList.add("hdmi");
          clearTimeout(idleTimer);          // no screensaver over the game
        }, function () { toast(fallback); },
        ["0px", "0px", "1920px", "1080px"], "MAIN");
      }, function () { toast(fallback); }, "MAIN");
    } catch (e) { toast(fallback); }
  }

  function hideHdmi() {
    inHdmi = false;
    root.classList.remove("hdmi");
    try { tizen.tvwindow.hide(function () {}, function () {}, "MAIN"); } catch (e) {}
    resetIdle();
  }

  function exitApp() {
    if (isTizen) {
      try { tizen.application.getCurrentApplication().exit(); } catch (e) {}
    }
  }

  /* ---------- Photo wallpapers ---------- */
  var walls = [document.getElementById("wall-a"), document.getElementById("wall-b")];
  var wallFront = 0;
  var wallList = [];
  var wallIndex = -1;
  var wallTimer = null;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var x = a[i]; a[i] = a[j]; a[j] = x;
    }
    return a;
  }

  function loadWallpapers(done) {
    var list = (window.COUCH_WALLPAPERS || []).concat(cfg.wallpapers || []);
    if (!cfg.wallpaperFeed) { done(list); return; }
    // Optional remote list (NAS, Immich share, etc.) so photos change without reinstalling.
    var xhr = new XMLHttpRequest();
    xhr.open("GET", cfg.wallpaperFeed);
    xhr.timeout = 8000;
    xhr.onload = function () {
      try {
        var extra = JSON.parse(xhr.responseText);
        if (Array.isArray(extra)) list = list.concat(extra);
      } catch (e) { /* ignore bad feed */ }
      done(list);
    };
    xhr.onerror = xhr.ontimeout = function () { done(list); };
    xhr.send();
  }

  function nextWallpaper(tries) {
    if (!wallList.length) return;
    tries = tries || 0;
    if (tries >= wallList.length) return;           // every image failed to load
    wallIndex = (wallIndex + 1) % wallList.length;
    if (wallIndex === 0 && cfg.wallpaperShuffle && wallList.length > 2) shuffle(wallList);
    var src = wallList[wallIndex];
    var img = new Image();
    img.onload = function () {
      var back = walls[1 - wallFront];
      back.style.backgroundImage = 'url("' + src.replace(/"/g, '\\"') + '")';
      back.classList.add("on");
      walls[wallFront].classList.remove("on");
      wallFront = 1 - wallFront;
    };
    img.onerror = function () { nextWallpaper(tries + 1); };
    img.src = src;
  }

  function startWallpapers(list) {
    wallList = cfg.wallpaperShuffle ? shuffle(list.slice()) : list.slice();
    if (!wallList.length) return;
    body.classList.add("has-wall");
    root.style.setProperty("--wall-dim", cfg.wallpaperDim);
    nextWallpaper();
    restartWallTimer();
  }

  function restartWallTimer() {
    clearInterval(wallTimer);
    if (wallList.length > 1) wallTimer = setInterval(nextWallpaper, cfg.wallpaperEverySec * 1000);
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

  // `black` forces an all-black screen (red button), otherwise follow config.
  function showSaver(black) {
    if (!saver.hidden || inHdmi) return;
    var photos = !black && cfg.screensaverMode === "photos" && wallList.length;
    body.classList.toggle("saver-photos", !!photos);
    body.classList.add("saving");
    saver.hidden = false;
    moveSaverClock();
    saverMoveTimer = setInterval(moveSaverClock, 20000);
  }

  function hideSaver() {
    if (saver.hidden) return false;
    saver.hidden = true;
    body.classList.remove("saving", "saver-photos");
    clearInterval(saverMoveTimer);
    return true;
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    if (!inHdmi) idleTimer = setTimeout(function () { showSaver(false); }, cfg.screensaverAfterSec * 1000);
  }

  /* ---------- UI helpers ---------- */
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3500);
  }

  /* ---------- Input ---------- */
  function onKey(e) {
    if (inHdmi) {
      // Only Back leaves the HDMI input; everything else is ignored.
      if (e.keyCode === KEY.BACK || e.keyCode === KEY.ESC || e.keyCode === KEY.BACKSPACE) {
        hideHdmi();
        e.preventDefault();
      }
      return;
    }

    resetIdle();
    // Any key wakes the screensaver without triggering an action.
    if (hideSaver()) { e.preventDefault(); return; }

    switch (e.keyCode) {
      case KEY.LEFT:  setFocus(focus - 1); break;
      case KEY.RIGHT: setFocus(focus + 1); break;
      case KEY.UP:    if (focus - COLS >= 0) setFocus(focus - COLS); break;
      case KEY.DOWN:  if (focus + COLS < tiles.length) setFocus(focus + COLS); break;
      case KEY.ENTER: open(focus); break;
      case KEY.RED:   showSaver(true); break;               // quick "screen off" for music etc.
      case KEY.GREEN:
      case 71: /* G, for browser preview */
        if (wallList.length > 1) { nextWallpaper(); restartWallTimer(); }
        else toast("No wallpapers yet — see README");
        break;
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
  loadWallpapers(startWallpapers);
})();
