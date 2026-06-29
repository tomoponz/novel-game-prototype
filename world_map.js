(() => {
  // 魔導王国 ワールドマップUI(軽量DOM)。正典: docs/world/kingdom-overworld-plan.md
  //  - 王都アウレリア=中央ハブ / 4ブロックは王都中心部のみ / 魔法学院は王国内の一施設。
  //  - 解放判定は docs/world/region-access-rules.md と一致(progress_guard と非矛盾)。
  //  - 既存(permit_ledger=P / minimap=M / next_destination / record_update_toast)と非競合。Oキー＋メニューから開く。
  const GROUPS = [
    { key: "north", dir: "北", label: "王都外（北）" },
    { key: "west", dir: "西", label: "教会領（西）" },
    { key: "central", dir: "中央", label: "王都アウレリア — 中央ハブ（4ブロックは王都中心部のみ）" },
    { key: "east", dir: "東", label: "学院系（東・北東）※すべて王国内施設" },
    { key: "south", dir: "南", label: "港（南）" },
    { key: "mountain", dir: "山岳", label: "軍管理地（南東・山岳）" },
    { key: "outer", dir: "外縁", label: "危険地帯（外縁・要 調査許可）" }
  ];

  // map/spawn を持つ地域のみ fast-travel 可能。null は地域マップ実装予定。
  const REGIONS = [
    // 中央 / 王都アウレリア
    { g: "central", name: "王都アウレリア中心区", manage: "王権/ギルド/教会/学院/商会", cond: "北門一時通行", needs: "商会紹介状 または 正式身分証", map: "plaza", spawn: { x: 0, z: 40 }, note: "4ブロック構想の対象(王都中心部のみ)。中央ハブ", unlock: (c) => c.merchantLetter || c.done("gate") },
    { g: "central", name: "ギルド本部", manage: "冒険者ギルド", cond: "商会紹介状", needs: "商会紹介状", map: "guildHall", spawn: { x: 0, z: 4 }, unlock: (c) => c.merchantLetter },
    { g: "central", name: "魔法学院（キャンパス/講義棟）", manage: "王国学院局/学院教師", cond: "ギルド仮登録+魔力測定異常(実績到達)", needs: "学院観察対象", map: "academyCampus", spawn: { x: 0, z: 50 }, note: "王国内の一施設。独立地域ではない", unlock: (c) => c.fRank || c.academyObs },
    { g: "central", name: "大聖堂記録区", manage: "教会", cond: "北門一時通行", needs: "身分照会(早期可)", map: "churchGrounds", spawn: { x: 0, z: 48 }, unlock: (c) => c.merchantLetter || c.done("gate") },
    { g: "central", name: "王城区", manage: "王権", cond: "王城区からの行動許可", needs: "Crown Record", map: null, note: "第5章で正式化", unlock: (c) => c.crownRecord },
    { g: "central", name: "市場区／商会事務所", manage: "商会連合", cond: "北門一時通行", needs: "なし(信用で取引拡大)", map: "merchantOffice", spawn: { x: 0, z: 7 }, note: "商会事務所(帳簿/倉庫/依頼)。倉庫・奥部屋は商会信用でゲート", unlock: (c) => c.done("gate") || c.merchantLetter },
    { g: "central", name: "住宅街/路地", manage: "王都自治/裏社会", cond: "北門一時通行", needs: "なし", map: "backstreet", spawn: { x: 0, z: 18 }, note: "裏路地の小区画(生活感)", unlock: (c) => c.done("gate") || c.merchantLetter },
    // 北
    { g: "north", name: "北門 / 森の街道", manage: "王国軍/門衛", cond: "なし(開始地点)", needs: "なし", map: "forestRoad", spawn: { x: 0, z: 74 }, unlock: () => true },
    { g: "north", name: "外門練習場", manage: "ギルド訓練局", cond: "F級仮登録", needs: "F級仮登録", map: "trainingGround", spawn: { x: 0, z: 40 }, unlock: (c) => c.provisionalRank },
    { g: "north", name: "農村", manage: "王領", cond: "北門一時通行", needs: "なし", map: null, unlock: (c) => c.done("gate") },
    { g: "north", name: "商隊路", manage: "商会連合", cond: "商会信用", needs: "Merchant Trust 4以上", map: null, unlock: (c) => c.merchantTrust >= 4 },
    // 東・北東(学院系・王国内施設)
    { g: "east", name: "学院研究林", manage: "学院", cond: "学院観察対象", needs: "学院観察", map: null, unlock: (c) => c.academyObs },
    { g: "east", name: "魔法実験場", manage: "学院", cond: "学院観察対象", needs: "学院観察", map: null, unlock: (c) => c.academyObs },
    { g: "east", name: "魔導技術工房", manage: "学院/工房組合", cond: "ギルド+学院", needs: "ギルド申請+学院観察", map: null, unlock: (c) => c.guildApplication && c.academyObs },
    { g: "east", name: "禁書塔", manage: "学院/王権", cond: "学院観察+上位許可", needs: "学院観察+Crown Record", map: null, unlock: (c) => c.academyObs && c.crownRecord },
    // 西(教会領)
    { g: "west", name: "教会領 / 大聖堂都市", manage: "教会", cond: "北門一時通行", needs: "なし(照会で記録取得)", map: "churchGrounds", spawn: { x: 0, z: 48 }, unlock: (c) => c.done("gate") || c.merchantLetter },
    { g: "west", name: "墓地", manage: "教会", cond: "教会照会", needs: "教会照会", map: null, unlock: (c) => c.churchRecord },
    { g: "west", name: "地下記録室", manage: "教会", cond: "教会照会+高位許可", needs: "教会照会+Crown Record", map: null, unlock: (c) => c.churchRecord && c.crownRecord },
    // 南(港)
    { g: "south", name: "南港市場", manage: "商会連合/港湾管理局", cond: "商会信用 または 通行許可", needs: "Merchant Trust 3以上", map: null, unlock: (c) => c.merchantTrust >= 3 },
    { g: "south", name: "商会倉庫街", manage: "商会連合", cond: "商会信用", needs: "Merchant Trust 5以上", map: null, unlock: (c) => c.merchantTrust >= 5 },
    { g: "south", name: "外国人街", manage: "商会/自治", cond: "商会信用+教会照会", needs: "Merchant Trust 3以上 + 教会照会", map: null, unlock: (c) => c.merchantTrust >= 3 && c.churchRecord },
    { g: "south", name: "船着き場", manage: "港湾管理局", cond: "通行許可", needs: "Crown Record または Merchant Trust 5", map: null, unlock: (c) => c.crownRecord || c.merchantTrust >= 5 },
    // 南東・山岳(軍)
    { g: "mountain", name: "辺境砦", manage: "王国軍", cond: "王城区からの派遣許可", needs: "Crown Record", map: null, unlock: (c) => c.crownRecord },
    { g: "mountain", name: "山岳街道", manage: "王国軍", cond: "派遣許可", needs: "Crown Record", map: null, unlock: (c) => c.crownRecord },
    { g: "mountain", name: "国境監視塔", manage: "王国軍", cond: "Crown Record", needs: "Crown Record", map: null, unlock: (c) => c.crownRecord },
    { g: "mountain", name: "軍駐屯地", manage: "王国軍", cond: "Crown Record", needs: "Crown Record", map: null, unlock: (c) => c.crownRecord },
    // 外縁(危険)
    { g: "outer", name: "古代遺跡群", manage: "王権/学院/教会 共同封鎖", cond: "高危険度調査許可", needs: "学院観察 + 王権許可 + 教会照会", map: null, unlock: (c) => c.academyObs && c.crownRecord && c.churchRecord },
    { g: "outer", name: "呪われた森", manage: "共同封鎖", cond: "高危険度調査許可", needs: "学院観察 + Crown Record", map: null, unlock: (c) => c.academyObs && c.crownRecord },
    { g: "outer", name: "魔獣沼地", manage: "共同封鎖", cond: "調査許可", needs: "学院観察 または Crown Record", map: null, unlock: (c) => c.academyObs || c.crownRecord },
    { g: "outer", name: "召喚関連遺構", manage: "王権/学院/教会", cond: "全照会 + 章8フラグ", needs: "学院観察 + Crown Record + 教会照会", map: null, unlock: (c) => c.academyObs && c.crownRecord && c.churchRecord }
  ];

  let ui = null;
  let visible = false;

  function debug() { return window.__AURELIA_DEBUG__; }
  function state() { return debug()?.state || null; }
  function mini() { try { return window.__AURELIA_MINIMAP__?.() || null; } catch { return null; } }

  function ctx() {
    const s = state();
    const p = s?.player || {};
    const items = p.items || {};
    const contract = String(p.contract || ""), rank = String(p.rank || "");
    const trust = p.trust || {};
    const done = (id) => !!s?.quest?.some((q) => q.id === id && q.done);
    const academyObs = !!items.academyRecommendation || done("academy") || contract.includes("学院");
    return {
      started: !!s?.started,
      map: mini()?.map || s?.map || "",
      done,
      merchantLetter: !!items.merchantLetter || done("merchant") || contract.includes("紹介状"),
      guildApplication: !!items.guildApplication || done("guild_apply"),
      manaTested: !!items.manaTested || done("mana_test"),
      provisionalRank: !!items.provisionalRank || done("provisional") || rank.includes("F級"),
      fRank: !!items.fRank || done("mock_battle") || rank.includes("F級冒険者"),
      churchRecord: !!items.churchRecord || done("church_record") || contract.includes("確認書"),
      academyObs,
      merchantTrust: Number(trust.Merchant || 0),
      crownRecord: academyObs || Number(trust.Crown || 0) > 0
    };
  }

  function ensureUi() {
    if (ui) return ui;
    const backdrop = document.createElement("div");
    backdrop.id = "world-map-backdrop";
    backdrop.className = "world-map-backdrop";
    const panel = document.createElement("section");
    panel.id = "world-map-panel";
    panel.className = "world-map-panel";
    panel.setAttribute("aria-label", "魔導王国 王国図");
    panel.innerHTML = `<header class="world-map-head"><div><p class="world-map-kicker">MAGITECH KINGDOM / WORLD MAP ✶</p><h2 class="world-map-title">魔導王国 王国図</h2><p class="world-map-sub">王都アウレリアは中央ハブ。魔法学院は王国内の一施設。4ブロック構想は王都中心部だけの都市構造です。</p></div><button class="world-map-close" type="button" aria-label="閉じる">閉じる（Esc）</button></header><div class="world-map-body"></div><footer class="world-map-foot"></footer>`;
    document.body.append(backdrop, panel);
    ui = { backdrop, panel, body: panel.querySelector(".world-map-body"), foot: panel.querySelector(".world-map-foot"), close: panel.querySelector(".world-map-close") };
    ui.close.addEventListener("click", () => setVisible(false));
    ui.backdrop.addEventListener("click", () => setVisible(false));
    return ui;
  }

  function card(region, c) {
    const here = region.map && region.map === c.map;
    const unlocked = here || !!region.unlock(c); // 現在そのマップに居るなら(デバッグ入域含め)解放扱い
    const stateClass = !unlocked ? "is-locked" : region.map ? "is-open" : "is-planned";
    const badge = !unlocked ? "未解放" : region.map ? (here ? "現在地" : "解放") : "解放（実装予定）";
    const note = region.note ? `<p class="world-map-card-note">${region.note}</p>` : "";
    const status = !unlocked
      ? `<p class="world-map-card-lock">未解放：${region.cond} が必要</p>`
      : region.map
        ? (here ? `<span class="world-map-here">ここにいます</span>` : `<button class="world-map-travel" type="button" data-map="${region.map}" data-x="${region.spawn?.x || 0}" data-z="${region.spawn?.z || 0}">この地域へ移動</button>`)
        : `<p class="world-map-card-plan">地域マップは実装予定（解放条件は達成）</p>`;
    return `<article class="world-map-card ${stateClass}"><div class="world-map-card-top"><h4>${region.name}</h4><span class="world-map-badge">${badge}</span></div><dl><div><dt>管理</dt><dd>${region.manage}</dd></div><div><dt>入域</dt><dd>${region.cond}</dd></div><div><dt>必要記録</dt><dd>${region.needs}</dd></div></dl>${note}${status}</article>`;
  }

  function render() {
    const box = ensureUi();
    const c = ctx();
    let html = "";
    for (const grp of GROUPS) {
      const regions = REGIONS.filter((r) => r.g === grp.key);
      if (!regions.length) continue;
      const openCount = regions.filter((r) => r.unlock(c)).length;
      html += `<section class="world-map-group"><h3 class="world-map-group-head"><span class="world-map-dir">${grp.dir}</span>${grp.label}<span class="world-map-count">${openCount}/${regions.length} 解放</span></h3><div class="world-map-cards">${regions.map((r) => card(r, c)).join("")}</div></section>`;
    }
    box.body.innerHTML = html;
    box.body.querySelectorAll(".world-map-travel").forEach((btn) => {
      btn.addEventListener("click", () => travel(btn.dataset.map, Number(btn.dataset.x), Number(btn.dataset.z)));
    });
    const totalOpen = REGIONS.filter((r) => r.unlock(c)).length;
    box.foot.innerHTML = `<span>解放済み ${totalOpen}/${REGIONS.length} 地域</span><span class="world-map-legend"><i class="lg-open"></i>解放　<i class="lg-plan"></i>実装予定　<i class="lg-lock"></i>未解放</span><span>記録されるほど便利になり、逃げにくくなる。</span>`;
  }

  function travel(map, x, z) {
    const s = state();
    if (!s?.started || s.inDialogue) return;
    setVisible(false);
    try { debug()?.jump?.(map, x || 0, z || 0); } catch {}
  }

  function setVisible(next) {
    const box = ensureUi();
    visible = next;
    if (visible) { try { window.__AURELIA_PERMIT_LEDGER__?.hide?.(); } catch {} render(); }
    box.panel.classList.toggle("is-visible", visible);
    box.backdrop.classList.toggle("is-visible", visible);
  }
  function toggle() { setVisible(!visible); }

  function injectMenuButton() {
    const body = document.querySelector("#menu .menu-body");
    if (!body || document.getElementById("world-map-open")) return;
    const sec = document.createElement("section");
    sec.className = "menu-sec";
    sec.innerHTML = `<h3>WORLD</h3><button id="world-map-open" class="world-map-menu-btn" type="button">王国図を開く（O）</button>`;
    body.appendChild(sec);
    sec.querySelector("#world-map-open").addEventListener("click", () => {
      document.getElementById("menu-close")?.click();
      setTimeout(() => setVisible(true), 10);
    });
  }

  addEventListener("keydown", (e) => {
    if (e.code === "Escape" && visible) { e.preventDefault(); e.stopImmediatePropagation(); setVisible(false); return; }
    if (e.code !== "KeyO") return;
    const s = state();
    if (!s?.started) return;
    if (!visible && (s.inDialogue || s.menuOpen)) return; // 会話・メニュー中は新規に開かない(競合回避)
    e.preventDefault();
    toggle();
  }, true);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectMenuButton, { once: true });
  else injectMenuButton();

  window.__AURELIA_WORLD_MAP__ = { show: () => setVisible(true), hide: () => setVisible(false), toggle, ctx, regions: () => REGIONS.map((r) => ({ name: r.name, group: r.g, unlocked: !!r.unlock(ctx()), travelable: !!r.map })) };
})();
