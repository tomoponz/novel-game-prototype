(() => {
  const BEAST = { x: 10.35, z: 14.1 };
  const MAX_HP = 3;
  const ACTIVE_RANGE = 34;
  const HIT_RANGE = 32;
  const HIT_DOT = 0.54;
  const COST = { fire: 3, burst: 8 };

  const combat = {
    hp: MAX_HP,
    phase: "idle",
    timer: 1.0,
    visible: false,
    defeated: false,
    dodging: 0,
    damageLock: 0,
    message: "黒毛の噛み犬の突進を避け、火球を3発当てる。"
  };

  let lastTick = performance.now();
  let ui = null;

  function debug() { return window.__AURELIA_DEBUG__; }
  function state() { return debug()?.state || null; }
  function mini() { try { return window.__AURELIA_MINIMAP__?.() || null; } catch { return null; } }
  function done(id) { return !!state()?.quest?.some((q) => q.id === id && q.done); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function ensureUi() {
    if (ui) return ui;
    const panel = document.createElement("section");
    panel.id = "caravan-combat-panel";
    panel.className = "caravan-combat-panel";
    panel.setAttribute("aria-label", "荷車襲撃戦闘");
    panel.innerHTML = `<div class="caravan-combat-head"><span class="caravan-combat-title">⚠ TARGET / BLACK BITE-HOUND</span><span class="caravan-combat-phase"></span></div><div class="caravan-combat-hp"><i></i></div><p class="caravan-combat-message"></p>`;
    const warning = document.createElement("div");
    warning.id = "caravan-combat-warning";
    warning.className = "caravan-combat-warning";
    const bolt = document.createElement("div");
    bolt.id = "caravan-combat-bolt";
    bolt.className = "caravan-combat-bolt";
    document.body.append(panel, warning, bolt);
    ui = {
      panel,
      phase: panel.querySelector(".caravan-combat-phase"),
      hp: panel.querySelector(".caravan-combat-hp > i"),
      message: panel.querySelector(".caravan-combat-message"),
      warning,
      bolt
    };
    return ui;
  }

  function activeInfo() {
    const info = mini();
    const s = state();
    if (!info || !s || !s.started || !s.loaded || info.map !== "forestRoad" || done("merchant") || combat.defeated) return null;
    const d = dist(info, BEAST);
    if (d > ACTIVE_RANGE) return null;
    return { info, state: s, d };
  }

  function setObjective(text) {
    if (window.GAME_DATA) window.GAME_DATA.objective = text;
    try { debug()?.complete?.(); } catch {}
  }

  function setPhase(phase, timer, message) {
    combat.phase = phase;
    combat.timer = timer;
    if (message) combat.message = message;
  }

  function updateUi() {
    const box = ensureUi();
    const active = Boolean(activeInfo());
    combat.visible = active;
    box.panel.classList.toggle("is-visible", active);
    box.warning.classList.toggle("is-visible", active && combat.phase === "telegraph");
    if (!active) return;
    const phaseLabel = {
      idle: "WATCHING",
      telegraph: "CHARGE WARNING",
      charge: "CHARGING",
      cooldown: "OPENING",
      stagger: "STAGGER",
      defeated: "DEFEATED"
    }[combat.phase] || combat.phase.toUpperCase();
    box.phase.textContent = `${phaseLabel} / HP ${combat.hp}/${MAX_HP}`;
    box.hp.style.transform = `scaleX(${clamp(combat.hp / MAX_HP, 0, 1)})`;
    box.message.textContent = combat.message;
  }

  function facingScore(info) {
    const vx = BEAST.x - info.x;
    const vz = BEAST.z - info.z;
    const len = Math.hypot(vx, vz) || 1;
    const fx = -Math.sin(info.yaw || 0);
    const fz = -Math.cos(info.yaw || 0);
    return (vx / len) * fx + (vz / len) * fz;
  }

  function flash(cls, ms = 160) {
    document.body.classList.add(cls);
    setTimeout(() => document.body.classList.remove(cls), ms);
  }

  function fireBolt() {
    const box = ensureUi();
    box.bolt.classList.remove("is-visible");
    void box.bolt.offsetWidth;
    box.bolt.classList.add("is-visible");
  }

  function spendMp(kind) {
    const s = state();
    const cost = COST[kind] || COST.fire;
    if (!s || s.player.mp < cost) {
      combat.message = "MPが足りない。距離を取り、少し回復を待て。";
      updateUi();
      return false;
    }
    s.player.mp = Math.max(0, s.player.mp - cost);
    if (kind === "burst") s.burstCooldown = Math.max(s.burstCooldown || 0, .55);
    else s.fireCooldown = Math.max(s.fireCooldown || 0, .24);
    try { debug()?.complete?.(); } catch {}
    return true;
  }

  function hitThreat(kind) {
    const info = activeInfo()?.info;
    if (!info) return;
    if (!spendMp(kind)) return;
    const score = facingScore(info);
    const d = dist(info, BEAST);
    const assisted = d < 10 || (d < HIT_RANGE && score > HIT_DOT);
    fireBolt();
    if (!assisted) {
      combat.message = "火球が外れた。TARGETを正面に入れて撃て。";
      setPhase("cooldown", .5);
      updateUi();
      return;
    }
    const damage = kind === "burst" ? 2 : 1;
    combat.hp = Math.max(0, combat.hp - damage);
    flash("caravan-combat-hit", 150);
    setPhase("stagger", .62, combat.hp > 0 ? `命中。あと${combat.hp}発分で退けられる。` : "黒毛の噛み犬が崩れた。商人を救助した。");
    setObjective(combat.hp > 0 ? `黒毛の噛み犬の突進を避け、火球をあと${combat.hp}発分当てる` : "商人エドリックの紹介状を持って北門へ向かう");
    if (combat.hp <= 0) defeat();
    updateUi();
  }

  function defeat() {
    if (combat.defeated) return;
    combat.defeated = true;
    combat.phase = "defeated";
    const dbg = debug();
    const s = state();
    if (s?.player) {
      s.player.contract = "商会の紹介状";
      s.player.trust ??= { Guild: 0, Church: 0, Crown: 0, Merchant: 0 };
      s.player.trust.Merchant = Math.max(s.player.trust.Merchant || 0, (s.player.trust.Merchant || 0) + 5);
      s.player.items ??= {};
      s.player.items.merchantLetter = true;
    }
    if (window.GAME_DATA) window.GAME_DATA.objective = "商人エドリックの紹介状を持って北門へ向かう";
    try { dbg?.complete?.("caravan", "merchant"); } catch {}
    showResultToast();
    const p = mini();
    setTimeout(() => {
      try { if (p && state()?.map === "forestRoad") dbg?.jump?.("forestRoad", p.x, p.z); } catch {}
    }, 850);
    setTimeout(() => ensureUi().panel.classList.remove("is-visible"), 2600);
  }

  function showResultToast() {
    let box = document.getElementById("caravan-combat-result");
    if (!box) {
      box = document.createElement("div");
      box.id = "caravan-combat-result";
      box.className = "progress-guard-toast";
      box.innerHTML = "<strong>RESCUE COMPLETE</strong><span></span>";
      document.body.appendChild(box);
    }
    const span = box.querySelector("span");
    if (span) span.textContent = "助かった……だが、今の魔法は何だ？　紹介状は渡す。門では余計なことを話すな。";
    box.classList.add("is-visible");
    setTimeout(() => box.classList.remove("is-visible"), 3800);
  }

  function damagePlayer() {
    if (combat.damageLock > 0 || combat.dodging > 0) return;
    const s = state();
    if (!s?.player) return;
    s.player.hp = Math.max(1, (s.player.hp || 100) - 18);
    combat.damageLock = 1.2;
    combat.message = "突進を受けた。予兆が出たら横移動かKキー回避。";
    flash("caravan-combat-damaged", 220);
    try { debug()?.complete?.(); } catch {}
  }

  function updateCombat(dt) {
    const active = activeInfo();
    if (!active) { updateUi(); return; }
    combat.dodging = Math.max(0, combat.dodging - dt);
    combat.damageLock = Math.max(0, combat.damageLock - dt);
    combat.timer -= dt;
    if (combat.timer <= 0) {
      if (combat.phase === "idle") setPhase("telegraph", .95, "赤い予兆が見えた。突進を横に避けろ。Kキー回避も使える。");
      else if (combat.phase === "telegraph") setPhase("charge", .34, "噛み犬が突進してくる。横へ逃げろ。"), maybeDamage(active.info, true);
      else if (combat.phase === "charge") setPhase("cooldown", .82, "突進後の隙だ。TARGETを正面に入れて火球を撃て。"), maybeDamage(active.info, false);
      else if (combat.phase === "cooldown") setPhase("idle", 1.15, "距離を取り、予兆を見てから火球を当てる。" );
      else if (combat.phase === "stagger") setPhase("cooldown", .75, "怯んだ。次の突進前にもう一発狙える。" );
    }
    setObjective(`黒毛の噛み犬の突進を避け、火球をあと${combat.hp}発分当てる`);
    updateUi();
  }

  function maybeDamage(info, forgiving) {
    const d = dist(info, BEAST);
    if (d < (forgiving ? 5.2 : 3.8)) damagePlayer();
  }

  addEventListener("keydown", (e) => {
    const active = activeInfo();
    if (!active) return;
    if (e.code === "KeyK") { combat.dodging = .55; return; }
    if (e.code !== "KeyJ" && e.code !== "KeyL") return;
    e.preventDefault();
    e.stopImmediatePropagation();
    hitThreat(e.code === "KeyL" ? "burst" : "fire");
  }, true);

  function loop(now) {
    const dt = Math.min((now - lastTick) / 1000, .08);
    lastTick = now;
    updateCombat(dt);
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(loop), { once: true });
  else requestAnimationFrame(loop);
})();
