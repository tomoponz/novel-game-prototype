(() => {
  "use strict";

  const SAVE_KEY = "shikkoku-web-novel-save-v1";
  const story = window.STORY;
  const $ = (id) => document.getElementById(id);

  const elements = {
    stage: $("stage"),
    title: $("scene-title"),
    backlog: $("backlog"),
    speaker: $("speaker"),
    line: $("line"),
    choices: $("choices"),
    save: $("save-btn"),
    load: $("load-btn"),
    reset: $("reset-btn"),
    statName: $("stat-name"),
    statHp: $("stat-hp"),
    statMp: $("stat-mp"),
    statRank: $("stat-rank"),
    statContract: $("stat-contract"),
  };

  let state = newGameState();

  function newGameState() {
    return {
      sceneId: story.start,
      lineIndex: 0,
      player: structuredClone(story.player),
      flags: {},
      history: [],
    };
  }

  function currentScene() {
    return story.scenes[state.sceneId];
  }

  function setDeepValue(path, value) {
    const keys = path.split(".");
    let target = state;
    while (keys.length > 1) {
      const key = keys.shift();
      if (target[key] == null || typeof target[key] !== "object") target[key] = {};
      target = target[key];
    }
    target[keys[0]] = value;
  }

  function applyChoice(choice) {
    if (choice.set) {
      Object.entries(choice.set).forEach(([path, value]) => setDeepValue(path, value));
    }
    if (choice.stat) {
      Object.entries(choice.stat).forEach(([key, delta]) => {
        const current = Number(state.player[key] ?? 0);
        state.player[key] = current + Number(delta);
      });
    }
    goTo(choice.to);
  }

  function goTo(sceneId) {
    if (!story.scenes[sceneId]) {
      console.error(`Scene not found: ${sceneId}`);
      return;
    }
    state.sceneId = sceneId;
    state.lineIndex = 0;
    state.history = [];
    save(true);
    render();
  }

  function advance() {
    const scene = currentScene();
    if (!scene) return;
    if (state.lineIndex < scene.lines.length - 1) {
      state.history.push(scene.lines[state.lineIndex]);
      state.history = state.history.slice(-4);
      state.lineIndex += 1;
      save(true);
      render();
      return;
    }
    if (scene.choices && scene.choices.length === 1) {
      applyChoice(scene.choices[0]);
    }
  }

  function render() {
    const scene = currentScene();
    if (!scene) return;

    elements.stage.className = `stage bg-${scene.bg || "room-dark"}`;
    elements.title.textContent = scene.title || story.title;
    elements.speaker.textContent = scene.speaker || "";
    elements.line.textContent = scene.lines[state.lineIndex] || "";
    elements.backlog.innerHTML = state.history.map(escapeHtml).join("<br>");

    const atEnd = state.lineIndex >= scene.lines.length - 1;
    elements.choices.innerHTML = "";
    if (atEnd && scene.choices) {
      for (const choice of scene.choices) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = choice.text;
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          applyChoice(choice);
        });
        elements.choices.appendChild(button);
      }
    }

    elements.statName.textContent = state.player.name;
    elements.statHp.textContent = `${state.player.hp}/${state.player.maxHp}`;
    elements.statMp.textContent = `${state.player.mp}/${state.player.maxMp}`;
    elements.statRank.textContent = state.player.rank;
    elements.statContract.textContent = state.player.contract;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function save(silent = false) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (!silent) toast("セーブしました");
  }

  function load() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) {
      toast("セーブデータがありません");
      return;
    }
    try {
      state = JSON.parse(saved);
      toast("ロードしました");
      render();
    } catch (error) {
      console.error(error);
      toast("ロードに失敗しました");
    }
  }

  function reset() {
    if (!confirm("最初から始めますか？")) return;
    state = newGameState();
    save(true);
    render();
  }

  function toast(message) {
    elements.line.dataset.toast = message;
    const old = elements.line.textContent;
    elements.line.textContent = `【${message}】
${old}`;
    window.setTimeout(() => render(), 650);
  }

  elements.stage.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    advance();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      advance();
    }
    if (event.key === "Escape") save();
  });
  elements.save.addEventListener("click", (event) => { event.stopPropagation(); save(); });
  elements.load.addEventListener("click", (event) => { event.stopPropagation(); load(); });
  elements.reset.addEventListener("click", (event) => { event.stopPropagation(); reset(); });

  render();
})();
