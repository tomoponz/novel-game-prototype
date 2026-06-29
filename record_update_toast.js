(() => {
  const WATCH = {
    merchant: ["商会紹介状", "商人救助が記録され、北門一時通行の根拠が発生した。"],
    gate: ["北門一時通行", "商会紹介状により、条件付きで王都への通行が許可された。"],
    guild_apply: ["ギルド仮申請", "身元照合不可のまま、例外処理として受付記録に追加された。"],
    mana_test: ["魔力測定", "未登録波形として、ギルド記録へ送付された。"],
    provisional: ["F級仮登録", "正式登録ではなく、監督付きの仮登録として扱われる。"],
    training: ["外門訓練", "火球制御と回避行動が、ギルド査定簿に追記された。"],
    mock_battle: ["模擬戦査定", "危険度判定として、学院・教会・王権へ共有される可能性が生じた。"],
    academy: ["学院記録", "未登録魔法体系の観察対象として、学院側の記録に接続された。"]
  };

  let baselineReady = false;
  let seen = new Set();
  let stack = null;

  function debug() { return window.__AURELIA_DEBUG__; }
  function state() { return debug()?.state || null; }

  function ensureStack() {
    if (stack) return stack;
    stack = document.createElement("div");
    stack.id = "record-update-stack";
    stack.className = "record-update-stack";
    document.body.appendChild(stack);
    return stack;
  }

  function completedSet() {
    const quests = state()?.quest || [];
    return new Set(quests.filter((q) => q && q.done).map((q) => q.id));
  }

  function pulse() {
    document.body.classList.add("record-update-pulse");
    setTimeout(() => document.body.classList.remove("record-update-pulse"), 360);
  }

  function notify(id) {
    const def = WATCH[id];
    if (!def) return;
    const [title, body] = def;
    const toast = document.createElement("section");
    toast.className = "record-update-toast";
    toast.innerHTML = `<span class="record-update-kicker">RECORD UPDATED</span><h3 class="record-update-title"></h3><p class="record-update-body"></p>`;
    toast.querySelector(".record-update-title").textContent = title;
    toast.querySelector(".record-update-body").textContent = body;
    ensureStack().appendChild(toast);
    pulse();
    setTimeout(() => toast.remove(), 4700);
  }

  function tick() {
    const s = state();
    if (!s?.started || !s.loaded) return;
    const current = completedSet();
    if (!baselineReady) {
      seen = current;
      baselineReady = true;
      return;
    }
    current.forEach((id) => {
      if (!seen.has(id)) notify(id);
    });
    seen = current;
  }

  // 正式なイベント発火を優先(即時)。700ms pollingは保険として残す。seenで二重通知を防止。
  addEventListener("aurelia:record", (e) => {
    const id = e.detail?.id;
    if (!id || !WATCH[id]) return;
    if (!baselineReady) { seen.add(id); return; }
    if (seen.has(id)) return;
    notify(id);
    seen.add(id);
  });

  setInterval(tick, 700);

  window.__AURELIA_RECORD_UPDATE__ = {
    notify,
    seen: () => [...seen],
    watch: () => Object.keys(WATCH)
  };
})();
