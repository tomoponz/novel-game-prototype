(() => {
  let ui = null;
  let visible = false;

  function debug() { return window.__AURELIA_DEBUG__; }
  function state() { return debug()?.state || null; }
  function mini() { try { return window.__AURELIA_MINIMAP__?.() || null; } catch { return null; } }
  function done(id) { return !!state()?.quest?.some((q) => q.id === id && q.done); }
  function text(v, fallback = "未登録") { return String(v || "").trim() || fallback; }

  function ensureUi() {
    if (ui) return ui;
    const backdrop = document.createElement("div");
    backdrop.id = "permit-ledger-backdrop";
    backdrop.className = "permit-ledger-backdrop";
    const panel = document.createElement("section");
    panel.id = "permit-ledger-panel";
    panel.className = "permit-ledger-panel";
    panel.setAttribute("aria-label", "許可証・信用台帳");
    panel.innerHTML = `<header><div><p class="permit-ledger-kicker">PERMIT LEDGER / AURELIA CIVIC RECORD</p><h2 class="permit-ledger-title">許可証・信用台帳</h2></div><button class="permit-ledger-close" type="button">閉じる</button></header><div class="permit-ledger-grid"></div><p class="permit-ledger-note"></p>`;
    document.body.append(backdrop, panel);
    ui = {
      backdrop,
      panel,
      grid: panel.querySelector(".permit-ledger-grid"),
      note: panel.querySelector(".permit-ledger-note"),
      close: panel.querySelector(".permit-ledger-close")
    };
    ui.close.addEventListener("click", () => setVisible(false));
    ui.backdrop.addEventListener("click", () => setVisible(false));
    return ui;
  }

  function statusRows() {
    const s = state();
    const m = mini();
    const player = s?.player || {};
    const contract = text(player.contract, "なし");
    const rank = text(player.rank, done("provisional") ? "F級仮登録" : "未登録");
    const hasLetter = done("merchant") || contract.includes("紹介状") || !!player.items?.merchantLetter;
    const gate = done("gate") ? "北門通過済み" : hasLetter ? "北門一時通行候補" : "通行不可";
    const guild = done("guild_apply") ? rank : hasLetter ? "紹介状により申請可能" : "申請不可";
    const mana = done("mana_test") ? "未登録波形 / 測定済み" : done("guild_apply") ? "測定待ち" : "未測定";
    const training = done("mock_battle") ? "模擬戦記録済み" : done("training") ? "訓練済み / 模擬戦待ち" : done("provisional") ? "外門訓練対象" : "未受験";
    const academy = done("academy") ? "学院記録あり" : done("mock_battle") ? "観察対象 / 呼出候補" : "未呼出";
    const trust = player.trust || {};
    return [
      ["現在地", text(m?.map || s?.map, "不明"), ""],
      ["身元", "照合不可", "risk"],
      ["保証元", hasLetter ? "エドリック商会" : "なし", hasLetter ? "active" : "risk"],
      ["契約/書類", contract, hasLetter ? "active" : ""],
      ["通行", gate, done("gate") || hasLetter ? "active" : "risk"],
      ["ギルド登録", guild, done("guild_apply") || done("provisional") ? "active" : ""],
      ["魔力測定", mana, done("mana_test") ? "risk" : ""],
      ["訓練査定", training, done("training") || done("mock_battle") ? "active" : ""],
      ["学院扱い", academy, done("mock_battle") || done("academy") ? "risk" : ""],
      ["Merchant Trust", String(trust.Merchant ?? 0), (trust.Merchant || 0) > 0 ? "active" : ""],
      ["Guild Trust", String(trust.Guild ?? 0), (trust.Guild || 0) > 0 ? "active" : ""],
      ["Crown Record", done("academy") ? "共有可能性あり" : "未登録", done("academy") ? "risk" : ""]
    ];
  }

  function render() {
    const box = ensureUi();
    box.grid.innerHTML = statusRows().map(([label, value, tone]) => `<div class="permit-ledger-item ${tone ? `is-${tone}` : ""}"><span class="permit-ledger-label">${label}</span><span class="permit-ledger-value">${value}</span></div>`).join("");
    box.note.textContent = "これは強さの一覧ではない。王都アウレリアが、あなたをどの制度に仮置きしているかの記録である。Pキーで閉じる。";
  }

  function setVisible(next) {
    visible = next;
    const box = ensureUi();
    if (visible) render();
    box.panel.classList.toggle("is-visible", visible);
    box.backdrop.classList.toggle("is-visible", visible);
  }

  function toggle() { setVisible(!visible); }

  addEventListener("keydown", (e) => {
    if (e.code !== "KeyP") return;
    const s = state();
    if (!s?.started) return;
    e.preventDefault();
    toggle();
  }, true);

  window.__AURELIA_PERMIT_LEDGER__ = { show: () => setVisible(true), hide: () => setVisible(false), toggle, rows: statusRows };
})();
