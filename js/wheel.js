(function () {
  "use strict";

  var cfg = window.COOKIZA_CONFIG;
  var prizes = cfg.prizes;
  var N = prizes.length;
  var SLICE = 360 / N;
  var STORE_KEY = "cookiza_prize";

  var canvas = document.getElementById("wheel");
  var ctx = canvas.getContext("2d");
  var spinBtn = document.getElementById("spinBtn");
  var statusEl = document.getElementById("status");
  var claimLink = document.getElementById("claimLink");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var RED = "#DB161B", GREEN = "#008000", WHITE = "#FFFFFF";
  var GREEN_DARK = "#005C1F", CHOC = "#3B1F14", GOLD = "#F2B84B";

  /* ---------- storage helpers (fail-safe) ---------- */
  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || sessionStorage.getItem(STORE_KEY)); }
    catch (e) { return null; }
  }
  function writeStore(obj) {
    var s = JSON.stringify(obj);
    try { localStorage.setItem(STORE_KEY, s); } catch (e) {}
    try { sessionStorage.setItem(STORE_KEY, s); } catch (e) {}
  }
  function clearStore() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    try { sessionStorage.removeItem(STORE_KEY); } catch (e) {}
  }

  /* ---------- randomness ---------- */
  function rand() {
    var a = new Uint32Array(1);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return a[0] / 4294967296;
  }
  function pickIndex() {
    var total = 0, i;
    for (i = 0; i < N; i++) total += prizes[i].weight;
    var r = rand() * total, acc = 0;
    for (i = 0; i < N; i++) {
      acc += prizes[i].weight;
      if (r < acc) return i;
    }
    return N - 1;
  }
  function makeCode(id) {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "";
    for (var i = 0; i < 5; i++) s += chars.charAt(Math.floor(rand() * chars.length));
    return "CKZ-" + id.toUpperCase() + "-" + s;
  }

  /* ---------- drawing ---------- */
  function sliceStyle(i) {
    // white slices alternate with red/green so the wheel never has two neighbours alike
    if (i % 2 === 1) return { bg: WHITE, fg: (Math.floor(i / 2) % 2 === 0) ? GREEN_DARK : RED };
    return (Math.floor(i / 2) % 2 === 0) ? { bg: RED, fg: WHITE } : { bg: GREEN, fg: WHITE };
  }

  function draw() {
    var size = canvas.clientWidth || 480;
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    var c = size / 2;
    var rimOuter = c;
    var r = c * 0.90;   // slices radius

    // chocolate rim
    ctx.beginPath(); ctx.arc(c, c, rimOuter, 0, Math.PI * 2); ctx.fillStyle = CHOC; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = GOLD; ctx.beginPath(); ctx.arc(c, c, rimOuter - 1, 0, Math.PI * 2); ctx.stroke();

    // rim "bulbs"
    var bulbs = N * 4;
    for (var b = 0; b < bulbs; b++) {
      var a = (b / bulbs) * Math.PI * 2;
      var br = (rimOuter + r) / 2;
      ctx.beginPath();
      ctx.arc(c + Math.cos(a) * br, c + Math.sin(a) * br, size * 0.011, 0, Math.PI * 2);
      ctx.fillStyle = b % 2 === 0 ? GOLD : WHITE;
      ctx.fill();
    }

    // slices
    var sliceRad = (Math.PI * 2) / N;
    for (var i = 0; i < N; i++) {
      var start = -Math.PI / 2 + i * sliceRad;
      var st = sliceStyle(i);
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, r, start, start + sliceRad);
      ctx.closePath();
      ctx.fillStyle = st.bg;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(59,31,20,.35)";
      ctx.stroke();

      // label
      var lines = prizes[i].label;
      var base = size * 0.042;
      var sizes = lines.map(function (ln) { return /^\d+%$/.test(ln) ? base * 1.75 : base; });
      var gap = base * 0.15;
      var total = sizes.reduce(function (s, v) { return s + v; }, 0) + gap * (lines.length - 1);
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(start + sliceRad / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = st.fg;
      var y = -total / 2;
      for (var j = 0; j < lines.length; j++) {
        ctx.font = "700 " + sizes[j] + 'px Fredoka, "Segoe UI", system-ui, sans-serif';
        ctx.fillText(lines[j], r * 0.93, y + sizes[j] / 2);
        y += sizes[j] + gap;
      }
      ctx.restore();
    }

    // inner ring behind the hub
    ctx.beginPath(); ctx.arc(c, c, size * 0.125, 0, Math.PI * 2);
    ctx.fillStyle = CHOC; ctx.fill();
  }

  /* ---------- UI bits ---------- */
  function renderPrizeList() {
    var ul = document.getElementById("prizeList");
    prizes.forEach(function (p, i) {
      var li = document.createElement("li");
      li.textContent = p.title;
      var bg = sliceStyle(i);
      li.style.setProperty("--c", bg.bg === WHITE ? bg.fg : bg.bg);
      ul.appendChild(li);
    });
  }

  function lockAlreadySpun(saved) {
    spinBtn.disabled = true;
    statusEl.textContent = "You've already spun the wheel. You won " + saved.title + "!";
    claimLink.hidden = false;
  }

  /* ---------- win log (Google Sheets via Apps Script) ---------- */
  function logWin(r) {
    if (!cfg.logEndpoint) return;
    try {
      fetch(cfg.logEndpoint, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,                                   // survives the redirect to the congrats page
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ code: r.code, prize: r.title, prizeId: r.id })
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- spin ---------- */
  var rotation = 0, spinning = false;

  function spin() {
    if (spinning || spinBtn.disabled) return;
    spinning = true;
    spinBtn.disabled = true;
    claimLink.hidden = true;
    statusEl.textContent = "Good luck… 🤞";

    var idx = pickIndex();
    var jitter = (rand() - 0.5) * SLICE * 0.7;          // land anywhere inside the slice, away from the edges
    var center = (idx + 0.5) * SLICE + jitter;           // degrees clockwise from the top, in the wheel's frame
    var current = ((rotation % 360) + 360) % 360;
    var delta = ((-center - current) % 360 + 360) % 360;
    var turns = reduceMotion ? 2 : 6;
    var duration = reduceMotion ? 1500 : 5600;
    rotation += turns * 360 + delta;

    canvas.style.transition = "transform " + duration + "ms cubic-bezier(.12,.6,.08,1)";
    canvas.style.transform = "rotate(" + rotation + "deg)";

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      var p = prizes[idx];
      var result = { id: p.id, title: p.title, description: p.description, code: makeCode(p.id), ts: Date.now() };
      if (cfg.oneSpinPerDevice) writeStore(result);
      else { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(result)); } catch (e) {} }
      logWin(result);
      statusEl.textContent = "You won " + p.title + "! 🎉";
      setTimeout(function () { window.location.href = "congrats.html"; }, 1500);
    }
    canvas.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, duration + 400);   // safety net
  }

  /* ---------- init ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
  if (/[?&]reset(=|&|$)/.test(location.search)) clearStore();

  renderPrizeList();
  spinBtn.addEventListener("click", spin);

  var saved = cfg.oneSpinPerDevice ? readStore() : null;
  if (saved && saved.title) lockAlreadySpun(saved);

  var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  ready.then(draw);
  draw();
  var resizeT;
  window.addEventListener("resize", function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(draw, 120);
  });
})();
