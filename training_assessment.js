(() => {
  const DISPLAY_MS = 5200;
  const COOLDOWN_MS = 1400;
  let ui = null;
  let lastKey = "";
  let lastAt = 0;
  let hideTimer = 0;

  const cards = {
    training: {
      kicker: "FIELD TRAINING / CONTROL TEST",
      title: "外門練習場: 制御査定",
      rows: [
        ["目的", "火球制御"],
        ["監督", "ギルド訓練官"],
        ["判定", "暴発なし / 命中精度"],
        ["回避", "Kキー・横移動"],
        ["注意", "勝利ではなく制御を見る"],
        ["記録先", "ギルド査定簿"]
      ],
      note: "ここで見られているのは強さではない。力を出した後、止められるかどうかだ。"
    },
    mock_battle: {
      kicker: "PROVISIONAL MOCK BATTLE / RISK CHECK",
      title: "模擬戦予告: 生存と一撃",
      rows: [
        ["条件", "3回回避 / 1回命中 / 生存"],
        ["目的", "危険度判定"],
        ["相手", "上位者またはギルド査定官"],
        ["勝利条件", "撃破ではなく制御証明"],
        ["共有先", "学院・教会・王権"],
        ["扱い", "合格者ではなく観察対象"]
      ],
      note: "勝てば自由になるわけではない。記録できない力ほど、より大きな制度へ送られる。"
    },
    academy: {
      kicker: "ACADEMY SUMMONS / OBSERVATION ORDER",
      title: "学院呼出: 未登録魔法体系の観察",
      rows: [
        ["理由", "戦闘力ではなく詠唱体系"],
        ["照合", "王国式に該当なし"],
        ["処分", "推薦ではなく監督付き案内"],
        ["記録", "学院・教会・王権へ共有"],
        ["目的", "教育と監視"],
        ["次段階", "学院キャンパスへ"]
      ],
      note: "学院は才能を歓迎する場所であり、同時に危険な例外を保管する場所でもある。"
    }
  };

  function debug() { return window.__AURELIA_DEBUG__; }
  function state() { return debug()?.state || null; }
  function mini() { try { return window.__AURELIA_MINIMAP__?.() || null; } catch { return null; } }
  function done(id) { return !!state()?.quest?.some((q) => q.id === id && q.done); }

  function ensureUi() {
    if (ui) return ui;
    const panel = document.createElement("section");
    panel.id = "training-assessment-panel";
    panel.className = "training-assessment-panel";
    panel.setAttribute("aria-label", "外門訓練と模擬戦の査定演出");
    panel.innerHTML = `<p class="training-assessment-kicker"></p><h2 class="training-assessment-title"></h2><ul class="training-assessment-grid"></ul><p class="training-assessment-note"></p>`;
    const ring = document.createElement("div");
    ring.id = "training-assessment-ring";
    ring.className = "training-assessment-ring";
    document.body.append(panel, ring);
    ui = {
      panel,
      ring,
      kicker: panel.querySelector(".training-assessment-kicker"),
      title: panel.querySelector(".training-assessment-title"),
      grid: panel.querySelector(".training-assessment-grid"),
      note: panel.querySelector(".training-assessment-note")
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

  function cardKey({ map, dialogue }) {
    if (map === "trainingGround") {
      if (/mock/i.test(dialogue) || dialogue === "mock_battle") return "mock_battle";
      if (dialogue === "training" || dialogue === "training_gate" || dialogue === "trainer") return "training";
      if (done("training") && !done("mock_battle")) return "mock_battle";
      return "training";
    }
    if ((map === "academy" || map === "academyCampus") && (dialogue === "academy_teacher" || dialogue === "academy_campus" || dialogue === "academy_gate")) return "academy";
    if (dialogue === "academy_teacher" || dialogue === "academy_rec") return "academy";
    return "";
  }

  function show(key) {
    const card = cards[key];
    if (!card) return;
    const now = Date.now();
    if (lastKey === key && now - lastAt < COOLDOWN_MS) return;
    lastKey = key;
    lastAt = now;
    const box = ensureUi();
    box.kicker.textContent = card.kicker;
    box.title.textContent = card.title;
    box.grid.innerHTML = card.rows.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join("");
    box.note.textContent = card.note;
    box.panel.classList.add("is-visible");
    box.ring.classList.remove("is-visible");
    void box.ring.offsetWidth;
    box.ring.classList.add("is-visible");
    document.body.classList.add("training-assessment-focus");
    setTimeout(() => document.body.classList.remove("training-assessment-focus"), 520);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => box.panel.classList.remove("is-visible"), DISPLAY_MS);
  }

  addEventListener("keydown", (e) => {
    if (e.code !== "KeyE") return;
    const key = cardKey(activeDialogue());
    if (!key) return;
    setTimeout(() => show(key), 140);
  }, true);

  window.__AURELIA_TRAINING_ASSESSMENT__ = {
    show,
    active: activeDialogue,
    current: () => cardKey(activeDialogue())
  };
})();
