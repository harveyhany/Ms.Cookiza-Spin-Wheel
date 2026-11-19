(function () {
  "use strict";

  var cfg = window.COOKIZA_CONFIG;
  var STORE_KEY = "cookiza_prize";

  var prize = null;
  try { prize = JSON.parse(localStorage.getItem(STORE_KEY) || sessionStorage.getItem(STORE_KEY)); } catch (e) {}
  if (!prize) { try { prize = JSON.parse(sessionStorage.getItem(STORE_KEY)); } catch (e) {} }

  // No prize yet? Send the visitor to the wheel.
  if (!prize || !prize.title) { window.location.replace("index.html"); return; }

  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("prizeTitle").textContent = prize.title;
  document.getElementById("prizeDesc").textContent = prize.description || "";
  document.getElementById("couponCode").textContent = prize.code || "";
  document.getElementById("igLink").href = cfg.instagramUrl;
  document.getElementById("card").hidden = false;

  /* copy code */
  var copyBtn = document.getElementById("copyBtn");
  copyBtn.addEventListener("click", function () {
    var done = function () { copyBtn.textContent = "Copied ✓"; setTimeout(function () { copyBtn.textContent = "Copy"; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(prize.code).then(done, done);
    } else {
      var t = document.createElement("textarea");
      t.value = prize.code; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(t); done();
    }
  });

  /* confetti in the Omani flag colours */
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var cv = document.getElementById("confetti"), g = cv.getContext("2d");
  var colors = ["#DB161B", "#008000", "#FFFFFF", "#F2B84B", "#005C1F"];
  var W, H, parts = [], t0 = performance.now();
  function size() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
  size(); window.addEventListener("resize", size);
  for (var i = 0; i < 150; i++) {
    parts.push({
      x: Math.random() * W, y: -Math.random() * H * 0.8,
      w: 6 + Math.random() * 8, h: 8 + Math.random() * 10,
      vx: -1 + Math.random() * 2, vy: 2 + Math.random() * 3.5,
      rot: Math.random() * Math.PI, vr: -0.15 + Math.random() * 0.3,
      c: colors[i % colors.length]
    });
  }
  function frame(now) {
    g.clearRect(0, 0, W, H);
    var alive = false;
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      if (p.y < H + 20) alive = true;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
      g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      if (p.c === "#FFFFFF") { g.strokeStyle = "rgba(0,0,0,.25)"; g.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      g.restore();
    });
    if (alive && now - t0 < 9000) requestAnimationFrame(frame);
    else g.clearRect(0, 0, W, H);
  }
  requestAnimationFrame(frame);
})();
