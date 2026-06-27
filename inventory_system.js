(() => {
  const ITEM_DEFS = {
    potion_small: { name: "小ポーション", type: "consumable", stack: 99, desc: "HPを50回復する簡易薬。まだ試作品なので使用効果はログ表示のみ。" },
    black_pelt: { name: "黒毛の毛皮", type: "material", stack: 99, desc: "黒毛の噛み犬から取れる毛皮。ギルドで少額買い取れる。" },
    merchant_letter: { name: "商人の紹介状", type: "key", stack: 1, desc: "王都ギルドで身元を保証するための紹介状。" },
    guild_temp_card: { name: "F級仮登録証", type: "key", stack: 1, desc: "ギルドが発行した仮登録証。正式登録前の身分証。" },
    coin_copper: { name: "銅貨", type: "material", stack: 999, desc: "王都で最もよく使われる小銭。" }
  };

  const state = {
    open: false,
    selectedType: "all",
    selectedIndex: 0,
    picked: new Set(JSON.parse(localStorage.getItem("aureliaPickedItems") || "[]")),
    inventory: loadInventory(),
    log: []
  };

  function loadInventory() {
    try {
      const saved = JSON.parse(localStorage.getItem("aureliaInventory") || "null");
      if (Array.isArray(saved)) return saved;
    } catch (_) {}
    return [
      { id: "potion_small", count: 3 },
      { id: "merchant_letter", count: 1 }
    ];
  }

  function save() {
    localStorage.setItem("aureliaInventory", JSON.stringify(state.inventory));
    localStorage.setItem("aureliaPickedItems", JSON.stringify([...state.picked]));
  }

  function itemDef(id) { return ITEM_DEFS[id] || { name: id, type: "material", stack: 99, desc: "未定義アイテム。" }; }
  function hasItem(id, count = 1) { return state.inventory.filter((it) => it.id === id).reduce((n, it) => n + it.count, 0) >= count; }
  function addItem(id, count = 1) {
    const def = itemDef(id);
    let rest = count;
    for (const slot of state.inventory) {
      if (slot.id !== id || slot.count >= def.stack) continue;
      const add = Math.min(rest, def.stack - slot.count);
      slot.count += add;
      rest -= add;
      if (rest <= 0) break;
    }
    while (rest > 0 && state.inventory.length < 20) {
      const add = Math.min(rest, def.stack);
      state.inventory.push({ id, count: add });
      rest -= add;
    }
    toast(`${def.name} x${count} を手に入れた`);
    save();
    renderInventory();
    return rest <= 0;
  }
  function removeItem(id, count = 1) {
    if (!hasItem(id, count)) return false;
    let rest = count;
    for (let i = state.inventory.length - 1; i >= 0; i--) {
      const slot = state.inventory[i];
      if (slot.id !== id) continue;
      const take = Math.min(rest, slot.count);
      slot.count -= take;
      rest -= take;
      if (slot.count <= 0) state.inventory.splice(i, 1);
      if (rest <= 0) break;
    }
    save();
    renderInventory();
    return true;
  }

  window.AURELIA_INVENTORY = { state, ITEM_DEFS, hasItem, addItem, removeItem, itemDef };

  function buildUI() {
    const app = document.getElementById("app") || document.body;
    const panel = document.createElement("section");
    panel.id = "inventory-panel";
    panel.className = "inventory-panel is-hidden";
    panel.innerHTML = `
      <div class="inventory-window" role="dialog" aria-modal="true" aria-label="インベントリ">
        <header class="inventory-header">
          <div><p class="label">INVENTORY</p><h2>所持品と装備</h2></div>
          <button id="inventory-close" type="button">閉じる</button>
        </header>
        <div class="inventory-body">
          <aside class="equipment-box">
            <p class="inventory-heading">装備</p>
            <div class="equip-slot"><span>右手</span><strong>訓練用ピック</strong></div>
            <div class="equip-slot"><span>左手</span><strong>空き</strong></div>
            <div class="equip-slot"><span>防具</span><strong>旅の外套</strong></div>
            <div class="equip-slot"><span>装飾</span><strong>商人の紹介状</strong></div>
            <p class="inventory-note">I：開閉 / Esc：閉じる。開いている間は移動と火球を止めます。</p>
          </aside>
          <main class="items-box">
            <div class="inventory-tabs">
              <button data-tab="all" class="is-active">全て</button>
              <button data-tab="consumable">消耗</button>
              <button data-tab="material">素材</button>
              <button data-tab="key">貴重</button>
            </div>
            <div id="inventory-grid" class="inventory-grid"></div>
            <div id="inventory-detail" class="inventory-detail"></div>
          </main>
        </div>
      </div>`;
    app.appendChild(panel);

    const log = document.createElement("div");
    log.id = "item-log";
    log.className = "item-log";
    app.appendChild(log);

    document.getElementById("inventory-close")?.addEventListener("click", closeInventory);
    panel.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => {
      state.selectedType = b.dataset.tab;
      state.selectedIndex = 0;
      panel.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("is-active", x === b));
      renderInventory();
    }));
    renderInventory();
  }

  function filteredItems() {
    return state.inventory.filter((it) => state.selectedType === "all" || itemDef(it.id).type === state.selectedType);
  }

  function renderInventory() {
    const grid = document.getElementById("inventory-grid");
    const detail = document.getElementById("inventory-detail");
    if (!grid || !detail) return;
    const items = filteredItems();
    grid.innerHTML = "";
    for (let i = 0; i < 20; i++) {
      const slot = document.createElement("button");
      slot.className = "item-slot";
      const item = items[i];
      if (item) {
        const def = itemDef(item.id);
        slot.innerHTML = `<span class="item-icon">${iconFor(def.type)}</span><strong>${def.name}</strong><small>x${item.count}</small>`;
        slot.classList.toggle("is-selected", i === state.selectedIndex);
        slot.addEventListener("click", () => { state.selectedIndex = i; renderInventory(); });
      } else {
        slot.innerHTML = `<span class="empty-slot">空き</span>`;
        slot.disabled = true;
      }
      grid.appendChild(slot);
    }
    const selected = items[state.selectedIndex] || items[0];
    if (!selected) {
      detail.innerHTML = `<p class="inventory-heading">詳細</p><p class="inventory-note">この分類の所持品はありません。</p>`;
      return;
    }
    const def = itemDef(selected.id);
    detail.innerHTML = `
      <p class="inventory-heading">詳細</p>
      <h3>${def.name} <small>x${selected.count}</small></h3>
      <p>${def.desc}</p>
      <div class="inventory-actions">
        <button id="use-item" type="button">使う</button>
        <button id="deliver-pelt" type="button">毛皮を納品</button>
      </div>`;
    document.getElementById("use-item")?.addEventListener("click", () => {
      if (def.type === "consumable" && removeItem(selected.id, 1)) toast(`${def.name}を使った。今は試作品なので効果は簡易ログのみ。`);
      else toast("これは今は使えません。NPCへの納品や会話条件に使います。");
    });
    document.getElementById("deliver-pelt")?.addEventListener("click", deliverPelt);
  }

  function iconFor(type) { return { consumable: "✚", material: "◆", key: "▣" }[type] || "□"; }

  function toggleInventory() { state.open ? closeInventory() : openInventory(); }
  function openInventory() {
    if (document.getElementById("dialogue") && !document.getElementById("dialogue").classList.contains("is-hidden")) return;
    state.open = true;
    document.getElementById("inventory-panel")?.classList.remove("is-hidden");
    renderInventory();
  }
  function closeInventory() {
    state.open = false;
    document.getElementById("inventory-panel")?.classList.add("is-hidden");
  }

  function toast(text) {
    state.log.unshift(text);
    state.log = state.log.slice(0, 4);
    const log = document.getElementById("item-log");
    if (!log) return;
    log.innerHTML = state.log.map((l) => `<div>${l}</div>`).join("");
    log.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => log.classList.remove("is-visible"), 3800);
  }

  function deliverPelt() {
    if (!hasItem("black_pelt")) {
      toast("黒毛の毛皮を持っていない。買い取りには現物が必要です。噂話だけでは帳簿に載せられません。");
      return;
    }
    removeItem("black_pelt", 1);
    addItem("coin_copper", 6);
    toast("市場の商人：状態は悪くありません。少額ですが買い取れます。銅貨6枚を受け取った。");
  }

  function tryPickupTestItem() {
    const debug = window.__AURELIA_DEBUG__;
    const map = debug?.state?.map;
    if (!map) return false;
    const id = map === "forestRoad" ? "forest_black_pelt" : map === "plaza" ? "plaza_small_potion" : null;
    if (!id || state.picked.has(id)) return false;
    state.picked.add(id);
    addItem(map === "forestRoad" ? "black_pelt" : "potion_small", 1);
    toast(map === "forestRoad" ? "街道脇の焦げ跡から黒毛の毛皮を拾った。" : "噴水近くの落とし物から小ポーションを拾った。");
    save();
    return true;
  }

  function addAmbientChatter() {
    const box = document.createElement("aside");
    box.id = "ambient-chatter";
    box.className = "ambient-chatter";
    document.getElementById("app")?.appendChild(box);
    const lines = [
      "市場の商人：薬草は足りてるかい？命をケチって銀貨を残しても、墓場じゃ使えないよ。",
      "新米冒険者：最初はパーティを組め。ソロで街道の魔物とやれるなんて、おとぎ話だ。",
      "門番：街中で魔法は使うなよ。罰金で済めば安い方だ。",
      "信徒：名前を記録に残すことは、この街で生きる足場になります。",
      "荷運び人：どいたどいた、荷車が通るよ！",
      "スラムの少年：同情するなら銅貨をくれよ。……半分は冗談だって。"
    ];
    setInterval(() => {
      const debug = window.__AURELIA_DEBUG__;
      if (!debug || debug.state?.map !== "plaza" || state.open) return;
      const sample = [...lines].sort(() => Math.random() - .5).slice(0, 3);
      box.innerHTML = sample.map((l) => `<p>${l}</p>`).join("");
      box.classList.add("is-visible");
      clearTimeout(addAmbientChatter._t);
      addAmbientChatter._t = setTimeout(() => box.classList.remove("is-visible"), 5200);
    }, 9000);
  }

  document.addEventListener("keydown", (e) => {
    if (e.code === "KeyI") { e.preventDefault(); e.stopImmediatePropagation(); toggleInventory(); return; }
    if (state.open) {
      if (e.code === "Escape") closeInventory();
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (e.code === "KeyE" && tryPickupTestItem()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  addEventListener("DOMContentLoaded", () => { buildUI(); addAmbientChatter(); });
})();
