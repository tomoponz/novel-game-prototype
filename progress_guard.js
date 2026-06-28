(() => {
  const RULES = [
    {
      id: "forest-gate-needs-merchant-letter",
      matches: (t, s) => s.map === "forestRoad" && (t.dialogue === "north_gate" || t.id === "gate"),
      allow: (_t, s) => done(s, "merchant") || hasContract(s, "紹介状") || hasContract(s, "確認書"),
      message: "北門の検問には、商人エドリックの紹介状が必要です。先に荷車襲撃現場を確認してください。"
    },
    {
      id: "guild-needs-letter",
      matches: (t) => ["guild", "guild_reception"].includes(t.dialogue || t.id),
      allow: (_t, s) => done(s, "merchant") || hasContract(s, "紹介状") || hasContract(s, "確認書"),
      message: "冒険者ギルドで登録するには、まず身元を保証する紹介状が必要です。"
    },
    {
      id: "crystal-needs-registration",
      matches: (t) => ["mana_measure", "crystal"].includes(t.dialogue || t.id),
      allow: (_t, s) => done(s, "guild_apply"),
      message: "魔力測定は登録申請後に受けられます。先に受付で登録申請をしてください。"
    },
    {
      id: "guildmaster-needs-mana-test",
      matches: (t) => ["guildmaster"].includes(t.dialogue || t.id),
      allow: (_t, s) => done(s, "mana_test"),
      message: "ギルドマスターの判断を聞くには、先に魔力測定を終える必要があります。"
    },
    {
      id: "training-needs-provisional-rank",
      matches: (t) => ["training", "training_gate"].includes(t.dialogue || t.id),
      allow: (_t, s) => done(s, "provisional") || hasRank(s, "F級仮登録") || hasRank(s, "F級冒険者"),
      message: "外門練習場の利用には、ギルドのF級仮登録が必要です。"
    },
    {
      id: "academy-needs-guild-result",
      matches: (t) => ["academy_gate", "academy_teacher", "academy"].includes(t.dialogue || t.id),
      allow: (_t, s) => done(s, "mock_battle") || hasRank(s, "F級冒険者") || hasContract(s, "学院"),
      message: "王立魔法学院に入るには、ギルドでの推薦・実績が必要です。先に模擬戦まで進めてください。"
    }
  ];

  let toastTimer = 0;

  function state() { return window.__AURELIA_DEBUG__?.state || null; }
  function activeTarget() { return state()?.active || null; }
  function done(s, id) { return !!s?.quest?.some((q) => q.id === id && q.done); }
  function hasContract(s, word) { return String(s?.player?.contract || "").includes(word); }
  function hasRank(s, word) { return String(s?.player?.rank || "").includes(word); }

  function blockedMessage(target, s) {
    if (!target || !s) return "";
    const rule = RULES.find((r) => r.matches(target, s) && !r.allow(target, s));
    return rule?.message || "";
  }

  function showToast(message) {
    let box = document.getElementById("progress-guard-toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "progress-guard-toast";
      box.className = "progress-guard-toast";
      box.setAttribute("role", "status");
      box.setAttribute("aria-live", "polite");
      box.innerHTML = "<strong>ACCESS DENIED</strong><span></span>";
      document.body.appendChild(box);
    }
    const span = box.querySelector("span");
    if (span) span.textContent = message;
    box.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove("is-visible"), 2700);
  }

  function interceptInteraction(event) {
    if (event.code !== "KeyE") return;
    const s = state();
    if (!s || s.inDialogue || s.menuOpen) return;
    const target = activeTarget();
    const message = blockedMessage(target, s);
    if (!message) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showToast(message);
  }

  function exposeDebug() {
    window.__AURELIA_PROGRESS_GATES__ = {
      rules: RULES.map((r) => r.id),
      check: () => blockedMessage(activeTarget(), state()) || "ok"
    };
  }

  addEventListener("keydown", interceptInteraction, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", exposeDebug, { once: true });
  else exposeDebug();
})();
