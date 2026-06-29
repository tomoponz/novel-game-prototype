(() => {
  const textOf = (el) => (el?.textContent || "").trim();
  const MAP_BOUNDS = {
    plaza: { minX: -680, maxX: 680, minZ: -680, maxZ: 680, label: "CITY" },
    forestRoad: { minX: -95, maxX: 95, minZ: -135, maxZ: 135, label: "FOREST" },
    trainingGround: { minX: -60, maxX: 60, minZ: -70, maxZ: 70, label: "TRAINING" },
    guildHall: { minX: -8, maxX: 8, minZ: -7, maxZ: 7, label: "GUILD" },
    church: { minX: -7, maxX: 7, minZ: -7, maxZ: 7, label: "CHURCH" },
    academy: { minX: -9, maxX: 9, minZ: -8, maxZ: 8, label: "ACADEMY" },
    academyCampus: { minX: -68, maxX: 68, minZ: -92, maxZ: 66, label: "ACADEMY CAMPUS" },
    churchGrounds: { minX: -60, maxX: 60, minZ: -90, maxZ: 70, label: "CATHEDRAL" },
    inn: { minX: -11, maxX: 11, minZ: -9, maxZ: 9, label: "INN" },
    backstreet: { minX: -22, maxX: 22, minZ: -30, maxZ: 22, label: "BACK STREET" }
  };

  const MARKERS = {
    plaza: [
      { x: 0, z: 610, label: "北門" }, { x: 0, z: 0, label: "広場" },
      { x: 135, z: -70, label: "ギルド" }, { x: 285, z: 85, label: "市場" },
      { x: -185, z: -85, label: "教会" }, { x: -300, z: -60, label: "学院" },
      { x: 380, z: 330, label: "訓練" }, { x: 0, z: -620, label: "王城" }
    ],
    forestRoad: [{ x: 6, z: 15, label: "荷車" }, { x: 0, z: -108, label: "北門" }],
    guildHall: [{ x: 0, z: -3.3, label: "受付" }, { x: 3.6, z: -3.4, label: "水晶" }, { x: 0, z: 6.7, label: "出口" }],
    trainingGround: [{ x: -8, z: 12, label: "教官" }, { x: 10, z: -8, label: "模擬" }, { x: 0, z: 52, label: "出口" }],
    academy: [{ x: 0, z: -3.7, label: "教師" }, { x: 0, z: 7.2, label: "出口" }],
    academyCampus: [{ x: 0, z: -52, label: "講義棟" }, { x: 42, z: -52, label: "塔" }, { x: 46, z: 24, label: "練習場" }, { x: 0, z: 62, label: "正門" }],
    church: [{ x: 0, z: -2.5, label: "記録" }, { x: 0, z: 6.4, label: "出口" }],
    churchGrounds: [{ x: 0, z: -66, label: "大聖堂" }, { x: 0, z: -52, label: "記録所" }, { x: 0, z: 60, label: "正門" }],
    inn: [{ x: 0, z: -3.4, label: "女将" }, { x: 8.6, z: -3, label: "噂" }, { x: 0, z: 8.4, label: "出口" }],
    backstreet: [{ x: 0, z: -10, label: "情報屋" }, { x: -4, z: -8, label: "井戸" }, { x: 0, z: 20, label: "出口" }]
  };

  const TARGET_RULES = [
    { keys: ["荷車", "襲撃"], target: { map: "forestRoad", x: 6, z: 15, label: "荷車襲撃" } },
    { keys: ["北門", "検問"], target: { map: "forestRoad", x: 0, z: -108, label: "北門" } },
    { keys: ["中央広場", "王都の構造"], target: { map: "plaza", x: 0, z: 0, label: "中央広場" } },
    { keys: ["ギルド", "登録申請"], target: { map: "plaza", x: 135, z: -70, label: "ギルド" } },
    { keys: ["測定台", "水晶", "魔力測定"], target: { map: "guildHall", x: 3.6, z: -3.4, label: "測定水晶" } },
    { keys: ["ギルドマスター"], target: { map: "guildHall", x: -3.8, z: -3.4, label: "ギルドマスター" } },
    { keys: ["外門練習場", "訓練", "火球制御"], target: { map: "plaza", x: 380, z: 330, label: "訓練場" } },
    { keys: ["模擬戦"], target: { map: "trainingGround", x: 10, z: -8, label: "模擬戦" } },
    { keys: ["教会", "身分", "確認書"], target: { map: "plaza", x: -185, z: -85, label: "教会" } },
    { keys: ["市場", "盗難"], target: { map: "plaza", x: 285, z: 85, label: "市場" } },
    { keys: ["路地裏", "情報屋"], target: { map: "plaza", x: -390, z: 235, label: "路地裏" } },
    { keys: ["講義棟", "キャンパス"], target: { map: "academyCampus", x: 0, z: -52, label: "講義棟" } },
    { keys: ["魔法学院", "学院", "入学相談"], target: { map: "plaza", x: -300, z: -60, label: "魔法学院" } },
    { keys: ["宿屋", "休ん"], target: { map: "plaza", x: 55, z: 150, label: "宿屋" } }
  ];

  function bindNextDestinationPanel() {
    const panel = document.getElementById("next-destination-panel");
    const objective = document.getElementById("play-objective");
    const area = document.getElementById("play-area");
    const next = document.getElementById("next-destination-label");
    const nextArea = document.getElementById("next-destination-area");
    const canvas = document.getElementById("mini-map-canvas");
    const caption = document.getElementById("mini-map-caption");
    if (!objective || !next) return;

    const update = () => {
      const objectiveText = textOf(objective);
      const areaText = textOf(area);
      next.textContent = objectiveText || "現在の目的を確認中";
      if (nextArea) nextArea.textContent = areaText || "AURELIA";
    };

    const observer = new MutationObserver(update);
    observer.observe(objective, { childList: true, characterData: true, subtree: true });
    if (area) observer.observe(area, { childList: true, characterData: true, subtree: true });
    update();
    bindExpandToggle(panel, canvas);

    if (canvas) startMiniMap(canvas, caption, objective);
  }

  function bindExpandToggle(panel, canvas) {
    if (!panel || !canvas) return;
    addEventListener("keydown", (e) => {
      if (e.code !== "KeyM") return;
      if (document.body.classList.contains("ui-dialogue") || document.body.classList.contains("ui-menu")) return;
      panel.classList.toggle("is-expanded");
      e.preventDefault();
    });
  }

  function startMiniMap(canvas, caption, objective) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let last = 0;
    const loop = (now) => {
      if (now - last > 120) {
        drawMiniMap(ctx, canvas, caption, objective);
        last = now;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function currentTarget(objective) {
    const text = textOf(objective);
    if (!text) return null;
    const rule = TARGET_RULES.find((r) => r.keys.some((k) => text.includes(k)));
    return rule?.target || null;
  }

  function readPlayer() {
    try {
      const get = window.__AURELIA_MINIMAP__;
      if (typeof get === "function") return get();
      const debug = window.__AURELIA_DEBUG__;
      const state = debug?.state;
      const peek = debug?.peek?.();
      const cam = peek?.cam;
      if (!state || !cam) return null;
      const yaw = state.yaw || 0;
      const pitch = state.pitch || 0;
      if (state.cameraMode === "first") return { map: state.map, x: cam[0], z: cam[2], yaw };
      const radius = state.map === "plaza" ? 18 : 8.8;
      return {
        map: state.map,
        x: cam[0] - Math.sin(yaw) * radius,
        z: cam[2] - Math.cos(yaw) * radius,
        yaw,
        approx: true,
        pitch
      };
    } catch {}
    return null;
  }

  function drawMiniMap(ctx, canvas, caption, objective) {
    const info = readPlayer();
    const target = currentTarget(objective);
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(8,10,16,.92)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(216,179,107,.35)";
    ctx.strokeRect(.5, .5, w - 1, h - 1);

    if (!info) {
      ctx.fillStyle = "rgba(246,239,225,.65)";
      ctx.font = "12px ui-monospace, Consolas, monospace";
      ctx.fillText("waiting for player...", 14, h / 2);
      if (caption) caption.textContent = "Start後に現在地を表示 / Mで拡大";
      return;
    }

    const bounds = MAP_BOUNDS[info.map] || MAP_BOUNDS.forestRoad;
    const toCanvas = (x, z) => ({
      x: 10 + (x - bounds.minX) / (bounds.maxX - bounds.minX) * (w - 20),
      y: 10 + (z - bounds.minZ) / (bounds.maxZ - bounds.minZ) * (h - 20)
    });

    drawGrid(ctx, w, h);
    drawMarkers(ctx, toCanvas, MARKERS[info.map] || []);

    const playerPoint = toCanvas(info.x, info.z);
    if (target && target.map === info.map) drawTarget(ctx, toCanvas, playerPoint, target);
    else if (target) drawOffMapTarget(ctx, w, h, target);

    drawPlayerArrow(ctx, playerPoint, info.yaw || 0);

    ctx.fillStyle = "rgba(246,239,225,.78)";
    ctx.font = "10px ui-monospace, Consolas, monospace";
    ctx.fillText(bounds.label || info.map, 10, 14);
    if (caption) {
      const targetText = target ? `  target:${target.label}${target.map !== info.map ? "@" + target.map : ""}` : "";
      caption.textContent = `${info.map}  x:${info.x.toFixed(0)} z:${info.z.toFixed(0)}${targetText}${info.approx ? " approx" : ""}`;
    }
  }

  function drawGrid(ctx, w, h) {
    ctx.strokeStyle = "rgba(255,255,255,.06)";
    ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 20; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }

  function drawMarkers(ctx, toCanvas, markers) {
    ctx.font = "9px ui-monospace, Consolas, monospace";
    for (const m of markers) {
      const p = toCanvas(m.x, m.z);
      ctx.fillStyle = "rgba(118,190,255,.9)";
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(246,239,225,.56)";
      ctx.fillText(m.label, p.x + 4, p.y - 4);
    }
  }

  function drawTarget(ctx, toCanvas, playerPoint, target) {
    const p = toCanvas(target.x, target.z);
    ctx.strokeStyle = "rgba(255,208,107,.45)";
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(playerPoint.x, playerPoint.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,96,96,.96)";
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.85)";
    ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,230,190,.92)";
    ctx.font = "10px ui-monospace, Consolas, monospace";
    ctx.fillText(target.label, p.x + 8, p.y - 8);
  }

  function drawOffMapTarget(ctx, w, h, target) {
    ctx.fillStyle = "rgba(255,208,107,.9)";
    ctx.font = "10px ui-monospace, Consolas, monospace";
    ctx.fillText(`TARGET: ${target.label} @ ${target.map}`, 10, h - 10);
  }

  function drawPlayerArrow(ctx, p, ang) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-ang);
    ctx.fillStyle = "#ffd06b";
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindNextDestinationPanel, { once: true });
  } else {
    bindNextDestinationPanel();
  }
})();
