(() => {
  const DISPLAY_MS = 5200;
  const COOLDOWN_MS = 1400;
  let ui = null;
  let lastAt = 0;
  let hideTimer = 0;

  const rows = [
    ["紹介状", "商会印あり"],
    ["封蝋", "破損なし"],
    ["保証元", "エドリック商会"],
    ["本人身元", "照合不可"],
    ["入城区分", "一時通行"],
    ["注意", "問題行動時は登録破棄"]
  ];

  function debug() { return window.__AURELIA_DEBUG__; }
  function state() { return debug()?.state || null; }
  function mini() { try { return window.__AURELIA_MINIMAP__?.() || null; } catch { return null; } }
  function done(id) { return !!state()?.quest?.some((q) => q.id === id && q.done); }

  function ensureUi() {
    if (ui) return ui;
    const panel = document.createElement("section");
    panel.id = "north-gate-check-panel";
    panel.className = "north-gate-check-panel";
    panel.setAttribute("aria-label", "北門検問演出");
    panel.innerHTML = `<p class="north-gate-check-kicker">NORTH GATE INSPECTION</p><h2 class="north-gate-check-title">紹介状確認: 条件付き入城</h2><ul class="north-gate-check-grid"></ul><p class="north-gate-check-note"></p>`;
    const seal = document.createElement("div");
    seal.id = "north-gate-seal";
    seal.className = "north-gate-seal";
    document.body.append(panel, seal);
    ui = {
      panel,
      seal,
      grid: panel.querySelector(".north-gate-check-grid"),
      note: panel.querySelector(".north-gate-check-note")
    };
    return ui;
  }

  function activeDialogue() {
    const m = mini();
    const s = state();
    if (!m || !s || !s.started || !s.loaded) return { map: "", dialogue: "" };
    const active = m.active || s.active || null;
    return { map: m.map || s.map || "", dialogue: active?.dialogue || active?.id || "" };
  }

  function hasLetter() {
    const s = state();
    const contract = String(s?.player?.contract || "");
    return done("merchant") || contract.includes("紹介状") || contract.includes("確認書") || !!s?.player?.items?.merchantLetter;
  }

  function shouldShow() {
    const { map, dialogue } = activeDialogue();
    if (map !== "forestRoad") return false;
    if (dialogue !== "north_gate" && dialogue !== "gate") return false;
    return hasLetter();
  }

  function show() {
    const now = Date.now();
    if (now - lastAt < COOLDOWN_MS) return;
    lastAt = now;
    const box = ensureUi();
    box.grid.innerHTML = rows.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join("");
    box.note.textContent = "紹介状は本物だ。だが、お前自身の身元が証明されたわけではない。王都では余計な魔法を使うな。";
    box.panel.classList.add("is-visible");
    box.seal.classList.remove("is-visible");
    void box.seal.offsetWidth;
    box.seal.classList.add("is-visible");
    document.body.classList.add("north-gate-check-focus");
    setTimeout(() => document.body.classList.remove("north-gate-check-focus"), 520);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => box.panel.classList.remove("is-visible"), DISPLAY_MS);
  }

  addEventListener("keydown", (e) => {
    if (e.code !== "KeyE") return;
    if (!shouldShow()) return;
    setTimeout(show, 140);
  }, true);

  window.__AURELIA_NORTH_GATE_CHECK__ = {
    show,
    active: activeDialogue,
    eligible: shouldShow
  };
})();
