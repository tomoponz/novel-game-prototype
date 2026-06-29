(() => {
  const DISPLAY_MS = 4800;
  const COOLDOWN_MS = 1400;
  let ui = null;
  let lastKey = "";
  let lastAt = 0;
  let hideTimer = 0;

  const events = {
    guild_reception: {
      kicker: "GUILD REGISTRATION / EXCEPTION FLOW",
      title: "仮登録照会: 身元記録なし",
      lines: [
        ["出身地", "該当なし"],
        ["保証人", "なし"],
        ["紹介状", "商会印あり"],
        ["滞在許可", "未発行"],
        ["処理区分", "例外承認"],
        ["登録等級", "F級 仮登録"]
      ],
      note: "受付の声が一段低くなる。歓迎ではない。制度の外から来た者を、制度の中へ仮置きしている。"
    },
    mana_measure: {
      kicker: "MANA MEASUREMENT / UNREGISTERED WAVEFORM",
      title: "測定値: ERROR",
      lines: [
        ["魔力波形", "未登録"],
        ["詠唱形式", "不明"],
        ["王国式照合", "該当なし"],
        ["水晶反応", "異常発光"],
        ["処理権限", "受付外"],
        ["次処理", "ギルドマスター確認"]
      ],
      note: "水晶の色が変わった。周囲の会話が止まり、受付は記録板から目を離せなくなる。"
    },
    guildmaster: {
      kicker: "GUILD MASTER REVIEW / RISK JUDGEMENT",
      title: "判定: 登録者ではなく観察対象",
      lines: [
        ["戦闘適性", "未判定"],
        ["魔法体系", "照合不能"],
        ["信用元", "商会のみ"],
        ["監督責任", "ギルド預かり"],
        ["仮処分", "F級仮登録"],
        ["次処理", "外門訓練"]
      ],
      note: "強いかどうかではない。記録できない力は、まず危険として扱われる。"
    }
  };

  function debug() { return window.__AURELIA_DEBUG__; }
  function state() { return debug()?.state || null; }
  function mini() { try { return window.__AURELIA_MINIMAP__?.() || null; } catch { return null; } }
  function done(id) { return !!state()?.quest?.some((q) => q.id === id && q.done); }

  function ensureUi() {
    if (ui) return ui;
    const panel = document.createElement("section");
    panel.id = "guild-anomaly-panel";
    panel.className = "guild-anomaly-panel";
    panel.setAttribute("aria-label", "ギルド記録演出");
    panel.innerHTML = `<p class="guild-anomaly-kicker"></p><h2 class="guild-anomaly-title"></h2><ul class="guild-anomaly-lines"></ul><p class="guild-anomaly-note"></p>`;
    const flash = document.createElement("div");
    flash.id = "guild-anomaly-flash";
    flash.className = "guild-anomaly-flash";
    document.body.append(panel, flash);
    ui = {
      panel,
      flash,
      kicker: panel.querySelector(".guild-anomaly-kicker"),
      title: panel.querySelector(".guild-anomaly-title"),
      lines: panel.querySelector(".guild-anomaly-lines"),
      note: panel.querySelector(".guild-anomaly-note")
    };
    return ui;
  }

  function activeDialogue() {
    const m = mini();
    const s = state();
    if (!m || !s || !s.started || !s.loaded || m.map !== "guildHall") return "";
    const active = m.active || s.active || null;
    return active?.dialogue || active?.id || "";
  }

  function eligible(dialogue) {
    if (dialogue === "guild_reception" || dialogue === "reception") return !done("guild_apply");
    if (dialogue === "mana_measure" || dialogue === "crystal") return done("guild_apply") && !done("mana_test");
    if (dialogue === "guildmaster") return done("mana_test") && !done("provisional");
    return false;
  }

  function eventKey(dialogue) {
    if (dialogue === "reception") return "guild_reception";
    if (dialogue === "crystal") return "mana_measure";
    if (events[dialogue]) return dialogue;
    return "";
  }

  function show(key) {
    const def = events[key];
    if (!def) return;
    const now = Date.now();
    if (lastKey === key && now - lastAt < COOLDOWN_MS) return;
    lastKey = key;
    lastAt = now;
    const box = ensureUi();
    box.kicker.textContent = def.kicker;
    box.title.textContent = def.title;
    box.lines.innerHTML = def.lines.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join("");
    box.note.textContent = def.note;
    box.panel.classList.add("is-visible");
    if (key === "mana_measure") {
      box.flash.classList.remove("is-visible");
      void box.flash.offsetWidth;
      box.flash.classList.add("is-visible");
      document.body.classList.add("guild-anomaly-error");
      setTimeout(() => document.body.classList.remove("guild-anomaly-error"), 420);
    }
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => box.panel.classList.remove("is-visible"), DISPLAY_MS);
  }

  addEventListener("keydown", (e) => {
    if (e.code !== "KeyE") return;
    const dialogue = activeDialogue();
    const key = eventKey(dialogue);
    if (!key || !eligible(dialogue)) return;
    setTimeout(() => show(key), 120);
  }, true);

  window.__AURELIA_GUILD_ANOMALY__ = {
    show,
    active: activeDialogue,
    eligible: () => eligible(activeDialogue())
  };
})();
