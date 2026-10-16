(() => {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const ramp = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion.matches ? Math.min(ms, 120) : ms));
  const buzz = (ms = 12) => { try { navigator.vibrate?.(ms); } catch (e) {} };

  const PLAYERS = [
    { name: "Pink", emoji: "🦊", color: "pink" },
    { name: "Mango", emoji: "🐼", color: "mango" },
  ];

  const QUESTIONS = [
    ["How many bones are in an adult human body?", 206, 0, 400, 1, "Babies are born with around 270 bones. Many fuse together as they grow."],
    ["How many keys are on a standard piano?", 88, 0, 200, 1, "52 keys are white and 36 are black."],
    ["How many member states does the United Nations have?", 193, 0, 300, 1, "South Sudan, the newest member, joined in 2011."],
    ["What is a normal human body temperature in °C?", 37, 30, 45, 1, "In °F, that is about 98.6 degrees."],
    ["How many minutes are in one week?", 10080, 0, 20000, 10, "60 × 24 × 7 = 10,080."],
    ["How many teeth does an adult usually have, wisdom teeth included?", 32, 0, 60, 1, "Kids have 20 baby teeth."],
    ["How many hearts does an octopus have?", 3, 0, 10, 1, "Two hearts pump blood through the gills, and one pumps it through the body."],
    ["In what year did the first iPhone go on sale?", 2007, 1990, 2015, 1, "It went on sale in the US on June 29, 2007."],
    ["In what year did people first walk on the Moon?", 1969, 1950, 1990, 1, "Apollo 11 landed on July 20, 1969."],
    ["How long is a marathon, in kilometers? (Round it.)", 42, 0, 100, 1, "The exact distance is 42.195 km, or 26.2 miles."],
    ["How many squares are on a chessboard?", 64, 0, 150, 1, "It is an 8 × 8 grid. Count every size of square and you get 204."],
    ["How tall is Mount Everest, in meters?", 8849, 0, 15000, 10, "China and Nepal announced a joint measurement of 8,848.86 m in 2020."],
    ["How many hours are in a normal (non-leap) year?", 8760, 0, 20000, 10, "365 × 24 = 8,760."],
    ["How many time zones does Russia cover?", 11, 0, 24, 1, "That is more than any other country on one continuous landmass."],
    ["In what year did the Berlin Wall fall?", 1989, 1950, 2010, 1, "The border opened on November 9, 1989."],
    ["How many cards are in a standard deck, not counting jokers?", 52, 0, 100, 1, "It has 4 suits of 13 cards each."],
    ["How many elements are on the periodic table today?", 118, 0, 200, 1, "The last four got their official names in 2016."],
    ["How many minutes are in one day?", 1440, 0, 5000, 5, "60 × 24 = 1,440."],
    ["How many countries are in Africa?", 54, 0, 100, 1, "That counts the 54 countries recognized by the UN."],
    ["In what year did the Titanic sink?", 1912, 1850, 1960, 1, "It sank on its first voyage, in April 1912."],
    ["How many bones are in one human hand, wrist included?", 27, 0, 60, 1, "That is 8 in the wrist, 5 in the palm and 14 in the fingers."],
    ["How many players does one soccer team have on the field?", 11, 0, 30, 1, "That count includes the goalkeeper."],
    ["How many strings does a standard violin have?", 4, 0, 12, 1, "They are tuned G, D, A and E."],
    ["How many legs does a lobster have?", 10, 0, 30, 1, "Lobsters are decapods, which means 10 legs. The big claws count as the front pair."],
    ["How many US states are there?", 50, 0, 100, 1, "The newest are Alaska and Hawaii, which both joined in 1959."],
  ].map(([q, answer, min, max, step, fact]) => ({ q, answer, min, max, step, fact, year: /what year/i.test(q) }));

  const LOSER_LINES = [
    (n) => `${n}, rematch? I'll pretend I didn't see that.`,
    (n) => `Nice try, ${n}. Thumbs up for effort.`,
    (n) => `${n}, that was bold. Wrong, but bold.`,
    (n) => `I believed in you, ${n}. Mostly.`,
    (n) => `${n}, revenge round? I'm rooting for you. Quietly.`,
    (n) => `Don't worry, ${n}. Nobody saw. Except me.`,
  ];
  const TIE_LINE = "A tie. Nobody lost, so nobody gets teased. Rematch?";

  const fmt = (q, v) => (q.year ? String(v) : v.toLocaleString("en-US"));
  const avatar = (p, extra = "") => `<span class="avatar avatar-${p.color} ${extra}">${p.emoji}</span>`;

  /* ---------------- theme + lamps ---------------- */
  const root = document.documentElement;
  const systemNight = matchMedia("(prefers-color-scheme: dark)");
  const isNight = () => (root.dataset.theme ? root.dataset.theme === "night" : systemNight.matches);
  const metaTheme = $('meta[name="theme-color"]');

  function syncLamps() {
    const night = isNight();
    metaTheme.content = night ? "#0F3B2E" : "#FFFFFF";
    $$("[data-lamp]").forEach((b) => {
      b.setAttribute("aria-pressed", String(night));
      const label = $("[data-lamp-label]", b);
      if (label) label.textContent = night ? "Switch to day" : "Switch to night";
    });
  }
  function toggleTheme() {
    root.dataset.theme = isNight() ? "day" : "night";
    try { localStorage.setItem("tt-theme", root.dataset.theme); } catch (e) {}
    syncLamps();
    buzz(20);
  }
  systemNight.addEventListener?.("change", syncLamps);
  syncLamps();

  $$("[data-lamp]").forEach((lamp) => {
    lamp.addEventListener("click", () => {
      lamp.classList.add("is-pulled");
      setTimeout(() => lamp.classList.remove("is-pulled"), 260);
      toggleTheme();
    });
  });

  const pendant = $(".pendant");
  if (pendant) {
    let startY = null;
    pendant.addEventListener("pointerdown", (e) => {
      startY = e.clientY;
      pendant.classList.add("is-dragging");
      pendant.setPointerCapture?.(e.pointerId);
    });
    pendant.addEventListener("pointermove", (e) => {
      if (startY === null) return;
      pendant.style.setProperty("--pull", `${clamp(e.clientY - startY, 0, 70)}px`);
    });
    const release = () => {
      startY = null;
      pendant.classList.remove("is-dragging");
      pendant.style.setProperty("--pull", "0px");
    };
    pendant.addEventListener("pointerup", release);
    pendant.addEventListener("pointercancel", release);
  }

  /* ---------------- hero mascot ---------------- */
  const heroMascot = $(".hero-mascot");
  const hop = () => {
    if (!heroMascot || reduceMotion.matches) return;
    heroMascot.classList.remove("is-hop");
    void heroMascot.offsetWidth;
    heroMascot.classList.add("is-hop");
  };
  heroMascot?.addEventListener("click", hop);
  heroMascot?.addEventListener("animationend", (e) => { if (e.animationName === "mascot-hop") heroMascot.classList.remove("is-hop"); });

  /* ---------------- the playable round ---------------- */
  const stage = $("#stage");
  const padsScene = $(".stage-pads", stage);
  const ROUNDS = 3;
  let game = null;
  let padsDown = [false, false];
  let starting = false;

  const pads = $$("[data-pad]");
  const padTimers = [null, null];
  const want = [false, false];
  if (!finePointer.matches) $$("[data-key-hint]").forEach((k) => k.remove());

  function latch(i) {
    padsDown[i] = true;
    pads[i].setAttribute("aria-pressed", "true");
    buzz(15);
    if (padsDown[0] && padsDown[1]) {
      starting = true;
      heroGhost?.stop();
      setTimeout(startMatch, 260);
    }
  }
  function setPad(i, down) {
    if (starting || want[i] === down) return;
    want[i] = down;
    const pad = pads[i];
    clearTimeout(padTimers[i]);
    if (down) {
      pad.classList.remove("is-draining");
      pad.classList.add("is-filling");
      pad.style.setProperty("--fill", "1");
      buzz(8);
      padTimers[i] = setTimeout(() => latch(i), reduceMotion.matches ? 0 : 560);
    } else {
      pad.classList.remove("is-filling");
      pad.classList.add("is-draining");
      pad.style.setProperty("--fill", "0");
      padsDown[i] = false;
      pad.setAttribute("aria-pressed", "false");
    }
  }
  pads.forEach((pad, i) => {
    pad.addEventListener("pointerdown", (e) => { e.preventDefault(); heroGhost?.stop(); setPad(i, !want[i]); });
    pad.addEventListener("click", (e) => { if (e.detail === 0) { heroGhost?.stop(); setPad(i, !want[i]); } });
  });
  const KEYS = { f: 0, j: 1 };
  addEventListener("keydown", (e) => {
    const i = KEYS[e.key?.toLowerCase()];
    if (i === undefined || e.repeat || game || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/input|textarea|select/i.test(document.activeElement?.tagName || "")) return;
    const r = stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    heroGhost?.stop();
    setPad(i, true);
  });
  addEventListener("keyup", (e) => {
    const i = KEYS[e.key?.toLowerCase()];
    if (i !== undefined && !starting && !padsDown[i]) setPad(i, false);
  });

  /* ---------------- ghost touch: shows a tap instead of describing it ---------------- */
  function makeGhost(host) {
    const g = $(":scope > .ghost", host);
    let stopped = false;
    const at = (el, fy = 0.5) => {
      const h = host.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return [r.left - h.left + r.width / 2, r.top - h.top + r.height * fy];
    };
    return {
      get stopped() { return stopped; },
      async tap(el, { fy = 0.5, onPress, hold = 500 } = {}) {
        if (stopped || !el) return;
        const [x, y] = at(el, fy);
        g.style.transition = g.style.opacity === "1" ? "transform .7s cubic-bezier(.22,1,.36,1), opacity .25s" : "opacity .25s";
        g.style.transform = `translate(${x}px, ${y}px)`;
        g.style.opacity = "1";
        await wait(g.style.transition.includes("transform") ? 720 : 300);
        if (stopped) return;
        g.classList.remove("is-tap"); void g.offsetWidth; g.classList.add("is-tap");
        g.animate([{ scale: 1 }, { scale: 0.8 }, { scale: 1 }], { duration: 320 });
        onPress?.();
        await wait(hold);
      },
      hide() { g.style.opacity = "0"; },
      stop() { stopped = true; g.style.opacity = "0"; },
    };
  }
  function whenSeen(el, fn, threshold = 0.45) {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) { io.disconnect(); fn(); }
    }, { threshold });
    io.observe(el);
  }

  let heroGhost = null;
  whenSeen(stage, async () => {
    heroGhost = makeGhost(padsScene);
    await wait(1400);
    while (!heroGhost.stopped && !starting) {
      for (const i of [0, 1]) {
        await heroGhost.tap(pads[i], {
          fy: 0.42,
          hold: 650,
          onPress: () => {
            if (want[i]) return;
            pads[i].classList.add("is-filling");
            pads[i].style.setProperty("--fill", "0.5");
            setTimeout(() => { if (!want[i]) { pads[i].classList.replace("is-filling", "is-draining"); pads[i].style.setProperty("--fill", "0"); } }, 520);
          },
        });
      }
      heroGhost.hide();
      await wait(2200);
    }
  }, 0.6);

  function show(html, { night = false } = {}) {
    $$(":scope > :not(.stage-pads):not(noscript)", stage).forEach((n) => n.remove());
    padsScene.hidden = true;
    stage.classList.toggle("is-night", night);
    const wrap = document.createElement("div");
    wrap.className = "scene-in";
    wrap.innerHTML = html;
    stage.append(wrap);
    return wrap;
  }

  function dieFace(n) {
    const pips = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[n];
    return Array.from({ length: 9 }, (_, i) => `<i style="visibility:${pips.includes(i) ? "visible" : "hidden"}"></i>`).join("");
  }

  async function startMatch() {
    hop();
    const qs = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, ROUNDS);
    const first = Math.random() < 0.5 ? 0 : 1;
    game = { qs, round: 0, first, score: [0, 0], history: [] };
    const face = 1 + Math.floor(Math.random() * 6);
    const scene = show(`<div class="die-wrap"><div class="die is-rolling" aria-hidden="true">${dieFace(1 + ((face + 2) % 6))}</div><p class="first" aria-live="polite"></p></div>`);
    const die = $(".die", scene);
    let ticks = 0;
    const spin = setInterval(() => { die.innerHTML = dieFace(1 + Math.floor(Math.random() * 6)); if (++ticks > 7) clearInterval(spin); }, 120);
    buzz([20, 60, 20]);
    await wait(1150);
    clearInterval(spin);
    die.innerHTML = dieFace(face);
    $(".first", scene).innerHTML = `${avatar(PLAYERS[first])} ${PLAYERS[first].name} goes first!`;
    await wait(1100);
    playTurn(0);
  }

  function orderFor(round) { return round % 2 === 0 ? [game.first, 1 - game.first] : [1 - game.first, game.first]; }

  function scoreTop() {
    return `<div class="round-top">
      <span class="pill pill-pink" data-score="0">${avatar(PLAYERS[0])}${PLAYERS[0].name} ${game.score[0]}</span>
      <span class="round-cap">Round ${game.round + 1} of ${ROUNDS}<span class="cap-kind"> · Closest guess</span></span>
      <span class="pill pill-mango" data-score="1">${avatar(PLAYERS[1])}${PLAYERS[1].name} ${game.score[1]}</span>
    </div>`;
  }

  function playTurn(step) {
    const q = game.qs[game.round];
    const who = orderFor(game.round)[step];
    const p = PLAYERS[who];
    const mid = q.min + Math.round((q.max - q.min) / 2 / q.step) * q.step;
    const scene = show(`<div class="round">
      ${scoreTop()}
      <span class="turn turn-${p.color}">${avatar(p)}${p.name}'s turn</span>
      <div class="guess">
        <p class="question">${q.q}</p>
        <p class="guess-num" aria-hidden="true">${fmt(q, mid)}</p>
        <input class="range" type="range" min="${q.min}" max="${q.max}" step="${q.step}" value="${mid}" aria-label="${p.name}'s guess" style="--fill:var(--${p.color})">
        <div class="range-ends" aria-hidden="true"><span>${fmt(q, q.min)}</span><span>${fmt(q, q.max)}</span></div>
      </div>
      <button class="btn btn-${p.color}" type="button" data-lock>${p.name}, lock it in</button>
    </div>`);
    const range = $(".range", scene);
    const num = $(".guess-num", scene);
    const paint = () => {
      const v = Number(range.value);
      num.textContent = fmt(q, v);
      range.style.setProperty("--pct", `${((v - q.min) / (q.max - q.min)) * 100}%`);
      range.setAttribute("aria-valuetext", fmt(q, v));
    };
    range.addEventListener("input", () => { paint(); if (Number(range.value) % (q.step * 10) === 0) buzz(4); });
    paint();
    $("[data-lock]", scene).addEventListener("click", () => {
      buzz(18);
      game.guesses = game.guesses || [];
      game.guesses[who] = Number(range.value);
      if (step === 0) handoff(orderFor(game.round)[1], who);
      else reveal();
    });
    if (step > 0 || game.round > 0) $(".range", scene).focus({ preventScroll: true });
  }

  function handoff(nextIdx, prevIdx) {
    const next = PLAYERS[nextIdx];
    const prev = PLAYERS[prevIdx];
    const scene = show(`<div class="handoff">
      <img src="assets/mascot-peek.webp" alt="" width="170" height="141">
      <p class="handoff-title">${prev.name}'s locked in.<br>Hand it to ${next.name}.</p>
      <button class="btn btn-palm" type="button" data-me>That's me</button>
    </div>`);
    const btn = $("[data-me]", scene);
    btn.addEventListener("click", () => playTurn(1));
    btn.focus({ preventScroll: true });
  }

  function countUp(el, q, ms = 900) {
    if (reduceMotion.matches) { el.textContent = fmt(q, q.answer); return Promise.resolve(); }
    return new Promise((done) => {
      const t0 = performance.now();
      const from = q.min;
      const tick = (t) => {
        const k = clamp((t - t0) / ms, 0, 1);
        const e = 1 - Math.pow(1 - k, 3);
        const v = Math.round((from + (q.answer - from) * e) / q.step) * q.step;
        el.textContent = fmt(q, k === 1 ? q.answer : v);
        k < 1 ? requestAnimationFrame(tick) : done();
      };
      requestAnimationFrame(tick);
    });
  }

  async function reveal() {
    const q = game.qs[game.round];
    const [g0, g1] = game.guesses;
    const d0 = Math.abs(g0 - q.answer);
    const d1 = Math.abs(g1 - q.answer);
    const winner = d0 === d1 ? -1 : d0 < d1 ? 0 : 1;
    const pct = (v) => `${((v - q.min) / (q.max - q.min)) * 100}%`;
    const scene = show(`<div class="reveal">
      ${scoreTop()}
      <p class="question">${q.q}</p>
      <p class="answer" aria-label="The answer is ${fmt(q, q.answer)}">${fmt(q, q.min)}</p>
      <div class="line" aria-hidden="true">
        <span class="line-track"></span>
        <span class="line-flag" style="left:${pct(q.answer)}"></span>
        <span class="line-mark is-pink" style="left:${pct(q.min)}">${avatar(PLAYERS[0])}</span>
        <span class="line-mark is-mango" style="left:${pct(q.min)}">${avatar(PLAYERS[1])}</span>
      </div>
      <p class="verdict" hidden></p>
      <p class="offs" hidden><span>${PLAYERS[0].name}: ${fmt(q, g0)}${d0 ? `, off by ${d0.toLocaleString("en-US")}` : ", spot on"}</span><span>${PLAYERS[1].name}: ${fmt(q, g1)}${d1 ? `, off by ${d1.toLocaleString("en-US")}` : ", spot on"}</span></p>
      <p class="fact" hidden><b>Did you know</b>${q.fact}</p>
      <button class="btn btn-palm" type="button" data-next hidden>${game.round + 1 < ROUNDS ? "Next round" : "See who won"}</button>
    </div>`);
    await countUp($(".answer", scene), q);
    buzz([15, 40, 15]);
    requestAnimationFrame(() => {
      $(".line-mark.is-pink", scene).style.left = pct(g0);
      $(".line-mark.is-mango", scene).style.left = pct(g1);
    });
    await wait(700);
    const verdict = $(".verdict", scene);
    if (winner === -1) {
      verdict.textContent = "Dead even. No point.";
    } else {
      const w = PLAYERS[winner];
      const l = PLAYERS[1 - winner];
      game.score[winner] += 1;
      const pill = $(`[data-score="${winner}"]`, scene);
      pill.innerHTML = `${avatar(w)}${w.name} ${game.score[winner]}`;
      pill.classList.add("is-bump");
      verdict.textContent = (winner === 0 ? d0 : d1) === 0 ? `Spot on! ${w.name} takes it.` : `${w.name} takes it! ${l.name}, revenge round?`;
      confetti(stage, 40);
    }
    game.history.push({ q, guesses: [g0, g1], winner });
    ["verdict", "offs", "fact"].forEach((c) => { $(`.${c}`, scene).hidden = false; });
    const next = $("[data-next]", scene);
    next.hidden = false;
    next.focus({ preventScroll: true });
    next.addEventListener("click", () => {
      game.round += 1;
      game.guesses = [];
      game.round < ROUNDS ? playTurn(0) : recap();
    });
  }

  function recap() {
    const [a, b] = game.score;
    const tie = a === b;
    const w = a > b ? 0 : 1;
    const title = tie ? `All square, ${a}–${b}` : `${PLAYERS[w].name} wins ${Math.max(a, b)}–${Math.min(a, b)}`;
    const line = tie ? TIE_LINE : pick(LOSER_LINES)(PLAYERS[1 - w].name);
    const scene = show(`<div class="recap">
      ${tie ? `<div>${avatar(PLAYERS[0], "recap-avatar")} ${avatar(PLAYERS[1], "recap-avatar")}</div>` : avatar(PLAYERS[w], "recap-avatar")}
      <p class="recap-title">${title}</p>
      <div class="host"><img src="assets/${tie ? "mascot" : "mascot-giggle"}.webp" alt="" width="58" height="49"><p class="bubble">${line}</p></div>
      <div class="recap-actions">
        <button class="btn btn-mango" type="button" data-rematch>Rematch</button>
        <button class="btn btn-ghost" type="button" data-share>Share the score</button>
      </div>
      <a class="recap-link" href="https://testflight.apple.com/join/aw4fVYgR">The app has 15 games. Join the free beta →</a>
    </div>`, { night: true });
    if (!tie) confetti(stage, 90);
    $("[data-rematch]", scene).addEventListener("click", () => { game = null; starting = true; startMatch(); });
    $("[data-share]", scene).addEventListener("click", (e) => shareScore(e.currentTarget, title, line));
    $("[data-rematch]", scene).focus({ preventScroll: true });
  }

  function confetti(host, n) {
    if (reduceMotion.matches) return;
    const box = document.createElement("div");
    box.className = "confetti";
    const colors = ["#D42B63", "#FFB547", "#7BC74D", "#E7F2EC", "#256BE5"];
    for (let i = 0; i < n; i++) {
      const c = document.createElement("i");
      c.style.left = `${Math.random() * 100}%`;
      c.style.background = pick(colors);
      c.style.setProperty("--dx", `${(Math.random() - 0.5) * 160}px`);
      c.style.setProperty("--rot", `${(Math.random() - 0.5) * 900}deg`);
      c.style.animationDelay = `${Math.random() * 0.35}s`;
      box.append(c);
    }
    host.append(box);
    setTimeout(() => box.remove(), 2000);
  }

  /* ---------------- share card ---------------- */
  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }
  function wrapText(ctx, text, maxW) {
    const words = text.split(" ");
    const lines = [];
    let cur = "";
    words.forEach((w) => {
      const t = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  async function shareScore(btn, title, line) {
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Drawing it…";
    try {
      await document.fonts.load('800 80px "Bricolage"');
      await document.fonts.load('400 30px "Bricolage"');
      const W = 1080, H = 1350, pad = 84;
      const cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#0F3B2E"; ctx.fillRect(0, 0, W, H);
      const mascot = await loadImage("assets/mascot.png");
      ctx.fillStyle = "#FFFFFF";
      ctx.font = '800 40px "Bricolage"';
      ctx.textBaseline = "middle";
      ctx.fillText("two thumbs", pad, pad + 38);
      ctx.textBaseline = "alphabetic";
      ctx.drawImage(mascot, W - pad - 250, pad - 10, 250, 210);
      ctx.font = '800 112px "Bricolage"';
      let y = 360;
      wrapText(ctx, title, W - pad * 2).forEach((l) => { ctx.fillText(l, pad, y); y += 108; });
      ctx.font = '800 34px "Bricolage"';
      ctx.fillStyle = "#FFB547";
      wrapText(ctx, line, W - pad * 2).forEach((l) => { y += 8; ctx.fillText(l, pad, y); y += 40; });
      y += 40;
      game.history.forEach((h, i) => {
        ctx.fillStyle = "#164A3A";
        const boxH = 168;
        ctx.beginPath(); ctx.roundRect(pad, y, W - pad * 2, boxH, 28); ctx.fill();
        ctx.fillStyle = "#A9C2B8"; ctx.font = '800 26px "Bricolage"';
        ctx.fillText(`ROUND ${i + 1}`, pad + 32, y + 48);
        ctx.fillStyle = "#FFFFFF"; ctx.font = '400 30px "Bricolage"';
        const ql = wrapText(ctx, h.q.q, W - pad * 2 - 64)[0];
        ctx.fillText(ql + (wrapText(ctx, h.q.q, W - pad * 2 - 64).length > 1 ? "…" : ""), pad + 32, y + 92);
        ctx.font = '800 32px "Bricolage"';
        const parts = [`Answer ${fmt(h.q, h.q.answer)}`, `${PLAYERS[0].emoji} ${fmt(h.q, h.guesses[0])}`, `${PLAYERS[1].emoji} ${fmt(h.q, h.guesses[1])}`];
        let x = pad + 32;
        parts.forEach((t, k) => {
          ctx.fillStyle = k === 0 ? "#FFFFFF" : k - 1 === h.winner ? "#FFB547" : "#A9C2B8";
          ctx.fillText(t, x, y + 140);
          x += ctx.measureText(t).width + 44;
        });
        y += boxH + 22;
      });
      ctx.fillStyle = "#FFFFFF"; ctx.font = '800 38px "Bricolage"';
      ctx.fillText("Your turn: playtwothumbs.com", pad, H - pad);
      const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
      const file = new File([blob], "two-thumbs-score.png", { type: "image/png" });
      const text = `${title}. Beat us at playtwothumbs.com`;
      btn.textContent = label;
      btn.disabled = false;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text }).catch(() => {});
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "two-thumbs-score.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
    } catch (err) {
      btn.textContent = "Couldn't draw it";
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------------- couch scroll scene ---------------- */
  const POST_COLORS = ["#FFB547", "#7BC74D", "#256BE5", "#FF7A45", "#A9C2B8", "#D42B63"];
  $$(".feed-roll").forEach((roll, k) => {
    const posts = Array.from({ length: 6 }, (_, i) => {
      const c = POST_COLORS[(i * 2 + k) % POST_COLORS.length];
      const ar = [1, 0.8, 1.25][(i + k) % 3];
      return `<div class="post" style="--c:${c};--ar:${ar}"><div class="post-head"><i></i><b></b></div><div class="post-img"></div><div class="post-foot"><i></i><i></i><i></i></div></div>`;
    }).join("");
    roll.innerHTML = posts + posts;
  });
  const couch = $(".couch");
  const couchPin = $(".couch-pin");
  const couchText = $(".couch-text");
  const chips = $$(".couch-chips .chip");
  function paintCouch() {
    const r = couch.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight), 0, 1);
    const apart = 1 - ramp(p, 0.12, 0.5);
    const g = ramp(p, 0.42, 0.62);
    couchPin.style.setProperty("--apart", apart.toFixed(3));
    couchPin.style.setProperty("--game", g.toFixed(3));
    couchText.classList.toggle("is-game", p > 0.5);
    chips.forEach((c, i) => c.classList.toggle("is-on", p > 0.56 + i * 0.07));
    couchPin.classList.toggle("is-recap", p > 0.84);
  }

  /* ---------------- island ---------------- */
  const GAMES = [
    { id: "trivia", name: "Trivia night", group: "puzzle", meta: "Team play · 7 levels", blurb: "One team, up to 3 themes. Seven levels, from pub quiz to mastermind." },
    { id: "escape", name: "Escape room", group: "puzzle", meta: "Co-op · 5 worlds · 3 rooms each", blurb: "Escape every room in a world to open the next one. Talk it out." },
    { id: "casefile", name: "Case file", group: "puzzle", meta: "Co-op · 7 cases · 10 min each", blurb: "One busy scene, five questions. Close a case to open the next." },
    { id: "hunt", name: "Treasure hunt", group: "puzzle", meta: "Co-op · 7 levels · 3 min each", blurb: "A picture full of things, one riddle at a time. Seven levels, each one sneakier." },
    { id: "safecracker", name: "Safecracker", group: "puzzle", meta: "Co-op · 7 levels · 3 min each", blurb: "The phone hides a code. Guess together and read the clicks." },
    { id: "spotswap", name: "Spot the swap", group: "puzzle", meta: "Head to head · 7 levels · 2 rounds each", blurb: "Look at a picture, then the phone changes things. Find them, then swap." },
    { id: "tictactoe", name: "Tic-tac-toe", group: "classic", meta: "Classic · 2 min a game", blurb: "Three in a line wins. First to 3 games." },
    { id: "fourrow", name: "Four in a row", group: "classic", meta: "Classic · 4 min a game", blurb: "Drop discs, line up four. First to 3 games." },
    { id: "dots", name: "Dots and boxes", group: "classic", meta: "Classic · 5 min a game", blurb: "Close a box, go again. Most boxes wins." },
    { id: "sizeup", name: "Size up", group: "classic", meta: "Classic · 3 min a game", blurb: "Tic-tac-toe where big pieces swallow small ones." },
    { id: "pickpoison", name: "Pick your poison", group: "classic", meta: "Classic · 5 min a game", blurb: "You pick the piece the other player has to place. Four that match wins." },
    { id: "flipwars", name: "Flip wars", group: "classic", meta: "Classic · 4 min a game", blurb: "Trap a line to flip it. Most pieces wins." },
    { id: "seahunt", name: "Sea hunt", group: "classic", meta: "Classic · 4 min a game", blurb: "Find and sink the hidden fleet. Hit? Fire again." },
    { id: "mixed", name: "Mixed games", group: "party", meta: "16 rounds · about 20 min", blurb: "You each guess, bet and try to pick the same answer. Closest guess, the round at the top of this page, is one of them." },
    { id: "bottle", name: "Bottle spin", group: "party", meta: "Head to head · 10 min", blurb: "A bottle on the screen spins and lands on trivia or on a question like \"Pizza topping for life?\" One of you answers, and the other guesses what they said." },
  ];
  const GROUP_LABEL = { puzzle: "Puzzle", classic: "Classic", party: "Party" };
  const TWO_PHONES = new Set(["mixed", "tictactoe", "sizeup", "pickpoison", "fourrow", "flipwars", "seahunt", "dots"]);

  const ART = {"beach":{"w":426,"h":347,"bw":0.9977,"cx":0.4988},"bottle":{"w":600,"h":418,"bw":0.9983,"cx":0.4992},"casefile":{"w":411,"h":355,"bw":0.9367,"cx":0.5268},"dots":{"w":427,"h":321,"bw":0.9977,"cx":0.4988},"escape":{"w":404,"h":356,"bw":0.953,"cx":0.521},"flipwars":{"w":426,"h":294,"bw":0.9977,"cx":0.4988},"fourrow":{"w":426,"h":354,"bw":0.9977,"cx":0.4988},"grass":{"w":427,"h":300,"bw":0.9977,"cx":0.4988},"hunt":{"w":387,"h":328,"bw":0.9948,"cx":0.4974},"lamp1":{"w":273,"h":321,"bw":0.9963,"cx":0.4982},"lamp2":{"w":276,"h":332,"bw":0.9928,"cx":0.4964},"mixed":{"w":410,"h":336,"bw":0.9951,"cx":0.4976},"palms":{"w":319,"h":331,"bw":0.9937,"cx":0.4969},"pickpoison":{"w":426,"h":344,"bw":0.9977,"cx":0.4988},"safecracker":{"w":387,"h":342,"bw":0.9948,"cx":0.4974},"sea":{"w":426,"h":298,"bw":0.9977,"cx":0.4988},"seahunt":{"w":396,"h":285,"bw":0.9975,"cx":0.4987},"sign":{"w":284,"h":309,"bw":0.9965,"cx":0.4982},"sizeup":{"w":426,"h":346,"bw":0.9977,"cx":0.4988},"spotswap":{"w":387,"h":349,"bw":0.9948,"cx":0.5},"tictactoe":{"w":427,"h":300,"bw":0.9977,"cx":0.4988},"trivia":{"w":409,"h":359,"bw":0.9413,"cx":0.5244}};
  const SMALL = new Set(["lamp1", "lamp2", "sign", "palms"]);
  const FACE_FROM_BOTTOM = 0.412;
  const STEP_X = 0.5;
  const STEP_Y = 0.28;

  const LAYOUT_WIDE = [
    ["palms", 0, 0], ["tictactoe", 1, 0], ["fourrow", 2, 0], ["dots", 3, 0], ["lamp1", 4, 0], ["sea", 5, 0],
    ["trivia", 0, 1], ["sign", 1, 1], ["sizeup", 2, 1], ["pickpoison", 3, 1], ["flipwars", 4, 1], ["seahunt", 5, 1],
    ["escape", 0, 2], ["casefile", 1, 2], ["lamp2", 2, 2], ["grass", 3, 2], ["mixed", 4, 2], ["beach", 5, 2],
    ["hunt", 0, 3], ["safecracker", 1, 3], ["spotswap", 2, 3], ["palms", 3, 3], ["bottle", 4, 3], ["sea", 5, 3],
  ];
  const LAYOUT_NARROW = [
    ["mixed", 0, 0], ["bottle", 1, 0], ["palms", 0, 1],
    ["trivia", 1, 1], ["escape", 2, 1], ["casefile", 1, 2],
    ["hunt", 2, 2], ["safecracker", 3, 2], ["spotswap", 2, 3],
    ["lamp2", 3, 3],
    ["tictactoe", 4, 3], ["fourrow", 3, 4], ["dots", 4, 4],
    ["sizeup", 5, 4], ["pickpoison", 4, 5], ["flipwars", 5, 5],
    ["seahunt", 6, 5], ["beach", 5, 6],
  ];

  const map = $("#map");
  const byId = Object.fromEntries(GAMES.map((g) => [g.id, g]));
  let tiles = [];
  let layoutKey = "";
  const masks = {};

  function buildMask(id, img) {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    try {
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      const a = new Uint8Array(c.width * c.height);
      for (let i = 0; i < a.length; i++) a[i] = data[i * 4 + 3];
      masks[id] = { a, w: c.width, h: c.height };
    } catch (e) {}
  }

  function renderIsland() {
    const narrow = map.clientWidth < 760;
    const key = narrow ? "n" : "w";
    const layout = narrow ? LAYOUT_NARROW : LAYOUT_WIDE;
    const gap = narrow ? 1.22 : 1.2;
    const avail = map.clientWidth - (narrow ? 32 : 48);
    const us = layout.map(([, c, r]) => c - r);
    const span = Math.max(...us) - Math.min(...us);
    const W = Math.min(narrow ? 210 : 232, avail / (span * STEP_X * gap + 1));
    const minU = Math.min(...us);

    if (key !== layoutKey) {
      layoutKey = key;
      map.innerHTML = "";
      tiles = layout.map(([id, c, r]) => {
        const game = byId[id];
        const li = document.createElement("li");
        li.className = game ? "tile" : "tile tile-decor";
        if (game) li.dataset.group = game.group;
        li.dataset.id = id;
        const img = `<img class="tile-art" src="assets/island/${id}.webp" alt="" width="${ART[id].w}" height="${ART[id].h}" ${game ? "" : 'aria-hidden="true"'} decoding="async">`;
        li.innerHTML = game
          ? `<button class="tile-btn" type="button" aria-haspopup="dialog" aria-label="${game.name}: ${GROUP_LABEL[game.group]}">${img}<span class="tile-name">${game.name}</span></button>`
          : `${/lamp/.test(id) ? '<span class="tile-glow" aria-hidden="true"></span>' : ""}${img}`;
        li.style.setProperty("--delay", `${-Math.random() * 5}s`);
        li.style.setProperty("--bob", `${4.2 + Math.random() * 2}s`);
        map.append(li);
        const el = $("img", li);
        const ready = () => buildMask(id, el);
        el.complete && el.naturalWidth ? ready() : el.addEventListener("load", ready, { once: true });
        return { id, c, r, li, game };
      });
      $$(".tile-btn", map).forEach((b) => b.addEventListener("click", (e) => { if (e.detail === 0) openSheet(b.closest(".tile").dataset.id); }));
    }

    let minTop = Infinity, maxBottom = -Infinity;
    const placed = tiles.map((t) => {
      const art = ART[t.id];
      const base = SMALL.has(t.id) ? W * 0.66 : W;
      const cssW = base / art.bw;
      const cssH = cssW * (art.h / art.w);
      const fx = 24 + (t.c - t.r - minU) * STEP_X * W * gap + W / 2;
      const fy = (t.c + t.r) * STEP_Y * W * gap;
      const bottom = fy + FACE_FROM_BOTTOM * W;
      const left = fx - art.cx * cssW;
      const top = bottom - cssH;
      minTop = Math.min(minTop, top);
      maxBottom = Math.max(maxBottom, bottom);
      return { t, left, top, cssW, cssH, faceFromBottom: FACE_FROM_BOTTOM * W };
    });
    const totalW = (span * STEP_X * gap + 1) * W + 48;
    const offsetX = Math.max(0, (map.clientWidth - totalW) / 2);
    const padTop = narrow ? 40 : 56;
    placed.forEach(({ t, left, top, cssW, cssH, faceFromBottom }) => {
      Object.assign(t.li.style, {
        left: `${left + offsetX}px`, top: `${top - minTop + padTop}px`, width: `${cssW}px`, height: `${cssH}px`,
      });
      t.li.style.setProperty("--z", String((t.c + t.r) * 10 + (t.c - t.r)));
      t.li.style.setProperty("--face", String(Math.round(faceFromBottom * 0.55)));
      t.geom = { left: left + offsetX, top: top - minTop + padTop, w: cssW, h: cssH };
    });
    map.style.height = `${maxBottom - minTop + padTop + 30}px`;
  }

  function tileAt(x, y) {
    let best = null;
    tiles.forEach((t) => {
      if (!t.game || !t.geom) return;
      const { left, top, w, h } = t.geom;
      if (x < left || x > left + w || y < top || y > top + h) return;
      const m = masks[t.id];
      let hit = true;
      if (m) {
        const mx = Math.floor(((x - left) / w) * m.w);
        const my = Math.floor(((y - top) / h) * m.h);
        hit = m.a[my * m.w + mx] > 60;
      }
      const z = (t.c + t.r) * 10 + (t.c - t.r);
      if (hit && (!best || z > best.z)) best = { t, z };
    });
    return best?.t || null;
  }

  let hovered = null;
  function setHover(t) {
    if (hovered === t) return;
    hovered?.li.classList.remove("is-hover");
    hovered = t;
    hovered?.li.classList.add("is-hover");
    map.style.cursor = t ? "pointer" : "";
  }
  const localPoint = (e) => { const r = map.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  map.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") setHover(tileAt(...localPoint(e))); });
  map.addEventListener("pointerleave", () => setHover(null));
  map.addEventListener("click", (e) => {
    if (e.detail === 0) return;
    const t = tileAt(...localPoint(e));
    if (t) openSheet(t.id);
  });

  $$("[data-district]").forEach((b) => b.addEventListener("click", () => {
    $$("[data-district]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
    map.dataset.filter = b.dataset.district;
  }));

  /* sheet */
  const sheet = $("#game-sheet");
  let sheetIndex = 0;
  function fillSheet(i) {
    sheetIndex = (i + GAMES.length) % GAMES.length;
    const g = GAMES[sheetIndex];
    const art = $(".sheet-art", sheet);
    art.src = `assets/island/${g.id}.webp`;
    art.width = ART[g.id].w; art.height = ART[g.id].h;
    $(".sheet-group", sheet).textContent = `Game ${sheetIndex + 1} of ${GAMES.length}`;
    $(".sheet-name", sheet).textContent = g.name;
    $(".sheet-meta", sheet).textContent = g.meta;
    $(".sheet-blurb", sheet).textContent = g.blurb;
    const tags = [];
    tags.push(g.group === "puzzle" ? '<li class="is-pass">Level 1 free, then the Pass</li>' : '<li class="is-free">Free</li>');
    tags.push(TWO_PHONES.has(g.id) ? "<li>One phone or two</li>" : "<li>Plays on one phone</li>");
    tags.push("<li>Works offline</li>");
    $(".sheet-tags", sheet).innerHTML = tags.join("");
  }
  function openSheet(id) {
    fillSheet(GAMES.findIndex((g) => g.id === id));
    if (!sheet.open) sheet.showModal();
    buzz(10);
  }
  $$("[data-step]", sheet).forEach((b) => b.addEventListener("click", () => fillSheet(sheetIndex + Number(b.dataset.step))));
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
  sheet.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") fillSheet(sheetIndex + 1);
    if (e.key === "ArrowLeft") fillSheet(sheetIndex - 1);
  });

  /* clouds */
  const sea = $(".island-sea");
  function paintClouds() {
    const r = sea.getBoundingClientRect();
    const p = ramp(innerHeight - r.top, innerHeight * 0.1, innerHeight * 0.6);
    sea.style.setProperty("--part", p.toFixed(3));
  }

  /* ---------------- airplane mode ---------------- */
  const air = $("[data-air]");
  const airSwitch = $("[data-air-switch]");
  const airGames = $(".air-games", air);
  const airCount = $("[data-air-count]");
  const ICONS = ["mixed", "trivia", "escape", "casefile", "hunt", "spotswap", "safecracker", "bottle", "tictactoe", "sizeup", "pickpoison", "fourrow", "flipwars", "seahunt", "dots"];
  airGames.innerHTML = ICONS.map((id) => `<li><img src="assets/games/${id}.webp" alt="" width="64" height="64" loading="lazy"></li>`).join("");
  let airTimer = null;
  airSwitch.addEventListener("change", () => {
    clearInterval(airTimer);
    const on = airSwitch.checked;
    air.classList.toggle("is-offline", on);
    const items = $$("li", airGames);
    items.forEach((li) => li.classList.remove("is-on"));
    if (!on) { airCount.textContent = ""; return; }
    buzz(15);
    let n = 0;
    airCount.textContent = "Checking every game…";
    airTimer = setInterval(() => {
      items[n].classList.add("is-on");
      n += 1;
      airCount.textContent = `${n} of 15 games still play`;
      if (n === items.length) { clearInterval(airTimer); airCount.textContent = "All 15 games still play. ✈︎"; }
    }, reduceMotion.matches ? 10 : 110);
  });

  /* ---------------- one phone or two ---------------- */
  const pair = $("[data-pair]");
  const codes = $$("[data-code]");
  let codeTimer = null;
  $$("[data-phones]").forEach((b) => b.addEventListener("click", () => {
    $$("[data-phones]").forEach((o) => o.setAttribute("aria-checked", String(o === b)));
    pair.dataset.pair = b.dataset.phones;
    clearInterval(codeTimer);
    if (b.dataset.phones === "two") {
      let k = 0;
      codeTimer = setInterval(() => {
        const digits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join("");
        codes.forEach((c) => { c.textContent = digits; });
        if (++k > 8) clearInterval(codeTimer);
      }, 70);
    } else codes.forEach((c) => { c.textContent = "····"; });
  }));

  const FREE = ["mixed", "bottle", "tictactoe", "sizeup", "pickpoison", "fourrow", "flipwars", "seahunt", "dots"];
  const PUZZLES = [["trivia", 7], ["escape", 5], ["casefile", 7], ["hunt", 7], ["safecracker", 7], ["spotswap", 7]];
  const nameOf = Object.fromEntries(GAMES.map((g) => [g.id, g.name]));
  $('[data-fm="free"]').innerHTML = FREE.map((id) => `<li><img src="assets/games/${id}.webp" alt="${nameOf[id]}" width="64" height="64" loading="lazy"><span class="fm-check" aria-hidden="true">✓</span></li>`).join("");
  $('[data-fm="puzzle"]').innerHTML = PUZZLES.map(([id, n]) => `<li><img src="assets/games/${id}.webp" alt="${nameOf[id]}" width="64" height="64" loading="lazy"><span class="fm-levels" aria-hidden="true">${"<i></i>".repeat(n)}</span></li>`).join("");

  let mapTouched = false;
  ["pointerdown", "keydown"].forEach((ev) => sea.addEventListener(ev, () => { mapTouched = true; islandGhost?.stop(); }));
  map.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { mapTouched = true; islandGhost?.stop(); } });
  let islandGhost = null;
  whenSeen(map, async () => {
    islandGhost = makeGhost(sea);
    await wait(1200);
    const order = ["mixed", "fourrow", "escape", "bottle"];
    for (let k = 0; !islandGhost.stopped && k < 8; k++) {
      const t = tiles.find((x) => x.id === order[k % order.length]);
      if (!t) break;
      await islandGhost.tap(t.li, { fy: 0.72, hold: 1300, onPress: () => { if (!mapTouched) setHover(t); } });
      if (!mapTouched) setHover(null);
    }
    islandGhost.stop();
  }, 0.35);

  let airTouched = false;
  airSwitch.addEventListener("pointerdown", () => { airTouched = true; });
  whenSeen(air, async () => {
    const g = makeGhost(air);
    await wait(900);
    if (airTouched || airSwitch.checked) return;
    await g.tap(airSwitch, { hold: 300, onPress: () => { if (!airTouched && !airSwitch.checked) { airSwitch.checked = true; airSwitch.dispatchEvent(new Event("change")); } } });
    g.stop();
  }, 0.6);

  const pairScreen = $(".pair-screen");
  let pairTouched = false;
  $$("[data-phones]").forEach((b) => b.addEventListener("pointerdown", () => { pairTouched = true; }));
  whenSeen(pairScreen, async () => {
    const g = makeGhost(pairScreen);
    await wait(2600);
    if (pairTouched) return;
    await g.tap($('[data-phones="two"]'), { hold: 300, onPress: () => { if (!pairTouched) $('[data-phones="two"]').click(); } });
    g.stop();
  }, 0.6);

  /* ---------------- frame loop ---------------- */
  let ticking = false;
  function frame() {
    ticking = false;
    paintCouch();
    paintClouds();
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  let resizeTimer = null;
  addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { renderIsland(); frame(); }, 80); });
  renderIsland();
  frame();
})();
