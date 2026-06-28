(() => {
  const textOf = (el) => (el?.textContent || "").trim();
  const MAP_BOUNDS = {
    plaza: { minX: -680, maxX: 680, minZ: -680, maxZ: 680, label: "CITY" },
    forestRoad: { minX: -95, maxX: 95, minZ: -135, maxZ: 135, label: "FOREST" },
    trainingGround: { minX: -60, maxX: 60, minZ: -70, maxZ: 70, label: "TRAINING" },
    guildHall: { minX: -8, maxX: 8, minZ: -7, maxZ: 7, label: "GUILD" },
    church: { minX: -7, maxX: 7, minZ: -7, maxZ: 7, label: "CHURCH" },
    academy: { minX: -9, maxX: 9, minZ: -8, maxZ: 8, label: "ACADEMY" },
    inn: { minX: -7, maxX: 7, minZ: -6, maxZ: 6, label: "INN" }
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
    church: [{ x: 0, z: -2.5, label: "記録" }, { x: 0, z: 5.5, label: "出口" }],
    inn: [{ x: 0, z: -2.7, label: "女将" }, { x: 0, z: 5.4, label: "出口" }]
  };

  function bindNextDestinationPanel() {
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

    if (canvas) startMiniMap(canvas, caption);
  }

  function startMiniMap(canvas, caption) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let last = 0;
    const loop = (now) => {
      if (now - last > 120) {
        drawMiniMap(ctx, canvas, caption);
        last = now;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function readPlayer() {
    try {
      const get = window.__AURELIA_MINIMAP__;
      if (typeof get === "function") return get();
    } catch {}
    return null;
  }

  function drawMiniMap(ctx, canvas, caption) {
    const info = readPlayer();
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
      if (caption) caption.textContent = "Start後に現在地を表示";
      return;
    }

    const bounds = MAP_BOUNDS[info.map] || MAP_BOUNDS.forestRoad;
    const toCanvas = (x, z) => ({
      x: 10 + (x - bounds.minX) / (bounds.maxX - bounds.minX) * (w - 20),
      y: 10 + (z - bounds.minZ) / (bounds.maxZ - bounds.minZ) * (h - 20)
    });

    drawGrid(ctx, w, h);
    drawMarkers(ctx, toCanvas, MARKERS[info.map] || []);

    const p = toCanvas(info.x, info.z);
    const ang = info.yaw || 0;
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

    ctx.fillStyle = "rgba(246,239,225,.78)";
    ctx.font = "10px ui-monospace, Consolas, monospace";
    ctx.fillText(bounds.label || info.map, 10, 14);
    if (caption) caption.textContent = `${info.map}  x:${info.x.toFixed(0)} z:${info.z.toFixed(0)}`;
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindNextDestinationPanel, { once: true });
  } else {
    bindNextDestinationPanel();
  }
})();
