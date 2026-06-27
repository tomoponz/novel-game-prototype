import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $ = (id) => document.getElementById(id);
const data = window.GAME_DATA || {};
const params = new URLSearchParams(location.search);
const ui = {
  canvas: $("game-canvas"), loading: $("loading"), title: $("title-screen"), start: $("start-btn"),
  hint: $("interact-hint"), hintText: $("interact-text"), dialog: $("dialogue"), speaker: $("speaker"), line: $("line"), choices: $("choices"),
  objective: $("objective"), area: $("area-name"), map: $("mini-map-text"), quests: $("quest-list"),
  stat: { name: $("stat-name"), hp: $("stat-hp"), mp: $("stat-mp"), stamina: $("stat-stamina"), rank: $("stat-rank"), contract: $("stat-contract") },
  cooldowns: { fire: $("fire-cooldown"), burst: $("burst-cooldown") }
};

const QUALITY = {
  low: { pixelRatio: 1, houses: 0.65, props: 0.55, npcs: 0.55, carts: 3, shadow: false, fog: 560 },
  medium: { pixelRatio: 1.25, houses: 1, props: 0.8, npcs: 0.85, carts: 5, shadow: true, fog: 760 },
  high: { pixelRatio: 1.5, houses: 1.2, props: 1, npcs: 1, carts: 7, shadow: true, fog: 980 }
};
const qualityName = QUALITY[params.get("render")] ? params.get("render") : "medium";
const quality = QUALITY[qualityName];
const basePlayer = data.player || { name: "ユウジ・サトウ", hp: 200, maxHp: 200, mp: 25, maxMp: 25, rank: "未登録", contract: "未契約" };
const questSeed = [
  ...(data.quests || []),
  { id: "gate", text: "北門で検問を通過する", done: false },
  { id: "plaza", text: "中央広場で王都の構造を確認する", done: false },
  { id: "market", text: "市場通りの盗難騒ぎを確認する", done: false },
  { id: "church_record", text: "教会で身分記録の手続きを聞く", done: false },
  { id: "training", text: "外門練習場で火球を試射する", done: false },
  { id: "alley", text: "怪しい路地裏で情報屋に接触する", done: false }
];
const quests = [...new Map(questSeed.map((q) => [q.id, { ...q }])).values()];

const dialogues = {
  wake_after: { speaker: "ユウジ", lines: ["石畳ではなく、湿った街道の土。ここは王都の外側だ。", "王都門と荷車の現場を確認する。"] },
  caravan_after: { speaker: "ユウジ", lines: ["黒毛の噛み犬はもう動かない。焦げ跡と散らばった木箱だけが残っている。", "紹介状を持って王都へ向かう。"] },
  north_gate: { speaker: "北門衛兵", lines: ["止まれ。王都アウレリアに入る者は、名と目的を言え。", "紹介状があるなら冒険者ギルドへ。大通りを南へ進み、噴水を越えろ。"], choices: [{ text: "王都へ入る", done: ["gate"], targetMap: "plaza", spawn: { x: 0, z: 610 }, objective: "中央広場を抜けて冒険者ギルドへ向かう" }] },
  plaza: { speaker: "ユウジ", lines: ["城壁の内側に家が押し込まれている。大通りには馬車、脇道には市場、遠くには王城。", "ここはただの背景ではなく、身分と信用で動く都市だ。"], choices: [{ text: "地図感覚を整理する", done: ["plaza"], objective: "冒険者ギルドで紹介状を出す" }] },
  guild: { speaker: "ギルド案内係", lines: ["登録なら中だ。紹介状があるなら受付へ。", "王都の中では力より先に紙が物を言う。"], choices: [{ text: "ギルド内部へ入る", targetMap: "guildHall", spawn: { x: 0, z: 6.4 }, done: ["guild"], objective: "受付で登録と魔力測定を受ける" }] },
  market: { speaker: "市場の商人", lines: ["おい、旅人。薬草束がひとつ消えた。", "犯人を決めつけると商売が壊れる。見たなら教えてくれ。"], choices: [{ text: "盗難騒ぎを記録する", done: ["market"], objective: "教会かギルドで身分確認を進める" }, { text: "路地裏の噂を聞く", objective: "怪しい路地裏で情報屋に接触する" }] },
  church: { speaker: "教会記録係", lines: ["洗礼記録、出生記録、移住記録。この街では記録がない人は“いない人”に近い扱いです。", "紹介状があるなら仮の確認書は作れます。"], choices: [{ text: "確認書を頼む", done: ["church_record", "church"], set: { "player.contract": "教会確認書" }, objective: "ギルドへ戻って仮登録を進める" }] },
  training: { speaker: "訓練教官", lines: ["街中で火球を撃つな。試すならここだ。", "的を見ろ。恥ずかしい詠唱でも、出るなら使え。"], choices: [{ text: "火球を試射する", done: ["training"], objective: "ギルドに戻り、模擬戦の準備をする" }] },
  alley: { speaker: "路地裏の男", lines: ["よそ者だな。ここでは金より身元が高く売れる。", "黒い羽を見たら拾うな。割れた水晶を見ても触るな。"], choices: [{ text: "情報だけ覚えて戻る", done: ["alley"], objective: "ギルドか教会で正式な足場を作る" }] },
  blacksmith: { speaker: "鍛冶職人", lines: ["登録前の客に刃物は売れない。腕より先に信用を持ってこい。"] },
  inn: { speaker: "宿屋の女将", lines: ["部屋はあるよ。長逗留ならギルド証か教会の確認書を見せておくれ。"] },
  generic: { speaker: "通行人", lines: ["王都は広い。看板と鐘楼を目印にしな。"] }
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1600);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, quality.pixelRatio));
renderer.shadowMap.enabled = quality.shadow;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const world = new THREE.Group();
scene.add(world);
const clock = new THREE.Clock();
const mats = new Map();
const player = createPerson("player", 0x24395d);
scene.add(player);

const state = {
  started: false, loaded: false, map: null, keys: new Set(), yaw: 0, pitch: 0.08, cameraMode: "third", debug: params.has("debug"),
  player: { stamina: 100, maxStamina: 100, ...basePlayer }, quest: quests,
  active: null, inDialogue: false, dialogueId: null, lineIndex: 0, selected: 0, choiceCooldown: 0, padButtons: [],
  fireCooldown: 0, burstCooldown: 0, isDashing: false, drag: false, lastX: 0, lastY: 0, shake: 0, hitStop: 0
};
let bounds = { minX: -95, maxX: 95, minZ: -135, maxZ: 135 };
let colliders = [], locations = [], npcs = [], movers = [], cullables = [], projectiles = [], bursts = [];

initLights();
bindStartEarly();
updateHud();
ui.loading?.classList.add("is-hidden");
requestAnimationFrame(loop);

function bindStartEarly() {
  const start = () => {
    if (state.started) return;
    state.started = true;
    ui.title?.classList.add("is-hidden");
    ui.loading?.classList.remove("is-hidden");
    setTimeout(() => {
      const map = params.get("map") || data.startMap || "forestRoad";
      loadMap(map, initialSpawn(map));
      state.loaded = true;
      ui.loading?.classList.add("is-hidden");
    }, 30);
  };
  ui.start?.addEventListener("click", start);
  ui.start?.addEventListener("pointerup", (e) => { e.preventDefault(); start(); });
}
function initLights() {
  scene.add(new THREE.HemisphereLight(0xf7eddb, 0x263647, 2.6));
  const sun = new THREE.DirectionalLight(0xfff0ce, 3.1);
  sun.position.set(80, 120, 60);
  sun.castShadow = quality.shadow;
  sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { near: .5, far: 620, left: -390, right: 390, top: 390, bottom: -390 });
  scene.add(sun);
}
function initialSpawn(map) { return ({ forestRoad: { x: 0, z: 74 }, plaza: { x: 0, z: 610 }, guildHall: { x: 0, z: 6.2 }, church: { x: 0, z: 5.5 }, trainingGround: { x: 0, z: 48 } })[map] || { x: 0, z: 74 }; }
function mat(color, rough = .82, em = 0x000000, pow = 0) { const k = `${color}:${rough}:${em}:${pow}`; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, emissive: em, emissiveIntensity: pow, flatShading: true })); return mats.get(k); }
function add(geo, material, parent = world, cast = false, receive = true) { const m = new THREE.Mesh(geo, material); m.castShadow = Boolean(cast && quality.shadow); m.receiveShadow = receive; parent.add(m); return m; }
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(a) { return a[Math.floor(rand(0, a.length))]; }
function done(id) { return state.quest.some((q) => q.id === id && q.done); }
function setEnv(color, near, far) { scene.background = new THREE.Color(color); scene.fog = new THREE.Fog(color, near, far); }
function addCollider(x, z, w, d, label = "") { colliders.push({ x, z, w, d, label }); }
function blocked(x, z, r = .58) { for (const c of colliders) if (x > c.x - c.w / 2 - r && x < c.x + c.w / 2 + r && z > c.z - c.d / 2 - r && z < c.z + c.d / 2 + r) return true; for (const m of movers) if (Math.hypot(x - m.obj.position.x, z - m.obj.position.z) < (m.r || .7) + r) return true; return false; }
function cull(obj, x, z, range = 340) { cullables.push({ obj, x, z, range }); return obj; }
function box(x, y, z, w, h, d, color, label = "", parent = world, important = false) { const m = add(new THREE.BoxGeometry(w, h, d), mat(color), parent, important); m.position.set(x, y, z); if (parent === world && label) addCollider(x, z, w, d, label); if (parent === world) cull(m, x, z, important ? 900 : 350); return m; }
function cyl(x, y, z, r, h, color, label = "", parent = world, important = false) { const m = add(new THREE.CylinderGeometry(r, r, h, 12), mat(color), parent, important); m.position.set(x, y, z); if (parent === world && label) addCollider(x, z, r * 2, r * 2, label); if (parent === world) cull(m, x, z, important ? 900 : 350); return m; }
function ground(w, d, color) { const g = add(new THREE.PlaneGeometry(w, d), mat(color, .95), world, false, true); g.rotation.x = -Math.PI / 2; return g; }
function road(x, z, w, d, color = 0x766b5b) { return box(x, .025, z, w, .05, d, color, "", world, true); }

function loadMap(id, spawn) {
  state.map = id;
  world.clear(); npcs.forEach((n) => scene.remove(n)); npcs = []; movers = []; locations = []; colliders = []; cullables = []; projectiles = []; bursts = [];
  ({ forestRoad: buildForestRoad, plaza: buildCity, guildHall: buildGuildHall, church: buildChurch, trainingGround: buildTrainingGround }[id] || buildForestRoad)();
  player.position.set(spawn.x, spawn.y || 0, spawn.z);
  updateHud(); updateCulling(true);
}
function buildForestRoad() {
  setEnv(0x6f91a1, 40, quality.fog); bounds = { minX: -95, maxX: 95, minZ: -135, maxZ: 135 }; ground(210, 290, 0x35513d); road(0, 0, 9, 260, 0x746756);
  for (let z = -120; z <= 120; z += 18) { road(-15, z, 20, 3, 0x665b4f); road(16, z + 8, 18, 2.8, 0x665b4f); }
  for (let i = 0; i < Math.floor(180 * quality.houses); i++) addTree((Math.random() < .5 ? -1 : 1) * rand(12, 86), rand(-128, 128), rand(.8, 1.4), true);
  for (let i = 0; i < Math.floor(60 * quality.props); i++) addRock(rand(-85, 85), rand(-125, 125), rand(.3, .8));
  addGate(0, -112); addCaravan(6, 15); addSign(7, -90, "ROYAL CAPITAL");
  locations.push({ id: "gate", name: "北門の検問を受ける", x: 0, z: -108, r: 6, dialogue: "north_gate" }, { id: "caravan", name: "荷車襲撃現場を見る", x: 6, z: 15, r: 6, dialogue: done("merchant") ? "caravan_after" : "wake_after" });
  locations.forEach(addMarker);
  for (let i = 0; i < 5; i++) addNpc("guard", rand(-8, 8), rand(-70, 45), 0xb77954, "北門衛兵", "north_gate");
}
function buildCity() {
  setEnv(0x9db9c5, 80, quality.fog + 260); bounds = { minX: -680, maxX: 680, minZ: -680, maxZ: 680 }; ground(1420, 1420, 0x4d634d);
  cityWall(); road(0, 0, 24, 1240, 0x817767); road(0, 0, 1240, 24, 0x817767);
  for (const z of [-430, -330, -130, 130, 330, 430]) road(0, z, 980, 9, 0x6f6657);
  for (const x of [-430, -330, -130, 130, 330, 430]) road(x, 0, 9, 980, 0x6f6657);
  castle(0, -535); centralPlaza(); guildDistrict(135, -70); churchDistrict(-185, -85); marketDistrict(285, 85); craftDistrict(350, -125); nobleDistrict(-250, -350); slumDistrict(-410, 245); trainingDistrict(380, 330); gateDistrict(0, 610); denseBlocks(); traffic(); pedestrians(); props();
  addSign(0, 610, "NORTH GATE"); addSign(135, -38, "GUILD"); addSign(-185, -48, "CHURCH"); addSign(285, 125, "MARKET"); addSign(-390, 235, "ALLEY"); addSign(0, -445, "CASTLE");
  locations.push(
    { id: "plaza", name: "中央広場を見渡す", x: 0, z: 40, r: 12, dialogue: "plaza" },
    { id: "gateback", name: "北門へ戻る", x: 0, z: 610, r: 12, map: "forestRoad", spawn: { x: 0, z: -96 } },
    { id: "guild", name: "冒険者ギルドに入る", x: 135, z: -60, r: 10, dialogue: "guild" },
    { id: "market", name: "市場の盗難騒ぎを見る", x: 260, z: 95, r: 13, dialogue: "market" },
    { id: "church", name: "教会記録所で相談する", x: -185, z: -70, r: 12, dialogue: "church" },
    { id: "training", name: "外門練習場で魔法を試す", x: 360, z: 330, r: 13, dialogue: "training" },
    { id: "alley", name: "怪しい路地裏に入る", x: -390, z: 235, r: 12, dialogue: "alley" },
    { id: "blacksmith", name: "鍛冶屋に近づく", x: 330, z: -110, r: 9, dialogue: "blacksmith" },
    { id: "inn", name: "宿屋を見る", x: 92, z: 82, r: 9, dialogue: "inn" }
  );
  locations.forEach(addMarker);
}
function buildGuildHall() { setEnv(0x1f1711, 12, 36); bounds = { minX: -8, maxX: 8, minZ: -7, maxZ: 7 }; ground(16, 15, 0x4c3727); room(16, 15, 3.2, 0x3a281c); box(0, .55, -4.5, 6.4, 1.1, .9, 0x6b4a2f, "counter", world, true); box(0, 1.2, -6.2, 5.6, 2.4, .5, 0x5a3d27, "shelf", world, true); addQuestBoard(-5.6, -4.4); addNpc("receptionist", 0, -3.3, 0xd8b36b, "受付", "generic"); addNpc("adventurer", -3.8, .9, 0x8c6f4f, "冒険者", "generic"); }
function buildChurch() { setEnv(0x151823, 12, 36); bounds = { minX: -7, maxX: 7, minZ: -7, maxZ: 7 }; ground(14, 14, 0x5b5a55); room(14, 14, 4, 0x44434a); box(0, .55, -4.4, 3.8, 1.05, 1.25, 0xddd1ae, "altar", world, true); for (let i = 0; i < 4; i++) { box(-2.6, .28, -1.2 + i * 1.45, 2.4, .35, .55, 0x5d4129, "bench"); box(2.6, .28, -1.2 + i * 1.45, 2.4, .35, .55, 0x5d4129, "bench"); } addNpc("priest", 0, -2.5, 0xc9c4ad, "司祭", "church"); }
function buildTrainingGround() { setEnv(0x88a6b4, 25, 180); bounds = { minX: -60, maxX: 60, minZ: -70, maxZ: 70 }; ground(130, 150, 0x556c4c); road(0, 0, 18, 130, 0x776b5a); for (let i = 0; i < 16; i++) cyl(rand(-35, 35), .85, rand(-40, 40), .25, 1.7, 0x7a5635, "target"); addSign(0, 48, "TO CAPITAL"); }

function cityWall() { for (const [x, z, w, d] of [[0, -675, 1320, 10], [0, 675, 1320, 10], [-675, 0, 10, 1320], [675, 0, 10, 1320]]) box(x, 5, z, w, 10, d, 0x6d6c64, "wall", world, true); for (let i = -620; i <= 620; i += 75) { box(i, 10, -675, 10, 18, 10, 0x74736b, "tower", world, true); box(i, 10, 675, 10, 18, 10, 0x74736b, "tower", world, true); box(-675, 10, i, 10, 18, 10, 0x74736b, "tower", world, true); box(675, 10, i, 10, 18, 10, 0x74736b, "tower", world, true); } }
function addGate(x, z) { box(x, 4, z, 38, 8, 7, 0x6d6c64, "gate", world, true); box(x - 15, 11, z, 7, 18, 10, 0x74736b, "tower", world, true); box(x + 15, 11, z, 7, 18, 10, 0x74736b, "tower", world, true); }
function gateDistrict(x, z) { addGate(x, z + 55); for (let i = -2; i <= 2; i++) addNpc("guard", x + i * 6, z - 8, 0xb77954, "衛兵", "north_gate"); box(x - 22, 2, z - 25, 20, 4, 14, 0x6a5e52, "checkpoint", world, true); box(x + 22, 2, z - 25, 20, 4, 14, 0x6a5e52, "checkpoint", world, true); }
function castle(x, z) { box(x, 9, z, 92, 18, 64, 0x8b8a82, "castle", world, true); box(x, 20, z - 24, 54, 22, 30, 0x989790, "castle", world, true); for (const [sx, sz] of [[-45, -30], [45, -30], [-45, 30], [45, 30], [0, -58]]) { box(x + sx, 18, z + sz, 15, 36, 15, 0x7e7d76, "castle", world, true); const roof = add(new THREE.ConeGeometry(11, 16, 4), mat(0x394456), world, true); roof.position.set(x + sx, 44, z + sz); roof.rotation.y = Math.PI / 4; cull(roof, x + sx, z + sz, 900); } }
function centralPlaza() { road(0, 0, 86, 86, 0x8e8370); fountain(0, 0, 3.2); box(0, 3.2, -22, 5, 6, 5, 0x7c7a72, "statue", world, true); for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) lamp(Math.cos(a) * 38, Math.sin(a) * 38); }
function guildDistrict(x, z) { house(x, z, 36, 24, 15, 0x6a5036, "GUILD", true); box(x, 3, z + 13, 9, 6, .7, 0x201610, "guild", world, true); addQuestBoard(x - 22, z + 4); for (let i = 0; i < 8; i++) addNpc("adventurer", x + rand(-28, 28), z + rand(18, 36), pick([0x8c6f4f, 0x58718d, 0x5f7b55]), "冒険者", "generic"); }
function churchDistrict(x, z) { house(x, z, 34, 26, 18, 0x7c7a76, "CHURCH", true); const sp = add(new THREE.ConeGeometry(7, 24, 4), mat(0x2f3541), world, true); sp.position.set(x, 32, z); sp.rotation.y = Math.PI / 4; cull(sp, x, z, 900); for (let i = 0; i < 8; i++) addNpc("faithful", x + rand(-35, 35), z + rand(18, 45), 0xc9c4ad, "信徒", "church"); }
function marketDistrict(x, z) { for (let i = 0; i < 52 * quality.props; i++) { const px = x + rand(-75, 75), pz = z + rand(-55, 55); stall(px, pz, pick([0xb43d46, 0x2f6f9f, 0xd8b36b, 0x3f815a])); if (i % 5 === 0) addNpc("merchant", px, pz + 4, 0x9a6f54, "商人", "market"); } }
function craftDistrict(x, z) { house(x, z, 24, 18, 9, 0x70482c, "SMITH", true); box(x + 18, 1.1, z + 5, 8, 2.2, 5, 0x3a2a21, "forge", world, true); box(x + 10, .8, z - 5, 4, 1.6, 2.2, 0x3d3d40, "anvil"); addNpc("blacksmith", x + 22, z + 8, 0x6f4b32, "鍛冶職人", "blacksmith"); for (let i = 0; i < 16; i++) house(x + rand(-85, 85), z + rand(-58, 58), rand(8, 13), rand(7, 12), rand(5, 9), pick([0x6d5237, 0x70482c, 0x5e5142]), pick(["TOOLS", "BOW", "LEATHER", null])); }
function nobleDistrict(x, z) { for (let i = 0; i < 26 * quality.houses; i++) { const px = x + rand(-110, 110), pz = z + rand(-90, 90); house(px, pz, rand(14, 24), rand(12, 22), rand(9, 15), pick([0x8b806d, 0x90785e, 0x7a776f]), null, true); if (i % 4 === 0) addNpc("guard", px + rand(-10, 10), pz + rand(-10, 10), 0xb77954, "衛兵", "generic"); } }
function slumDistrict(x, z) { for (let i = 0; i < 75 * quality.houses; i++) slumHouse(x + rand(-120, 120), z + rand(-90, 90)); for (let i = 0; i < 10; i++) addNpc("slum", x + rand(-100, 100), z + rand(-80, 80), 0x4f4238, "路地の住人", "alley"); alleyDetails(x + 20, z - 10); }
function trainingDistrict(x, z) { box(x, .06, z, 90, .12, 55, 0x746b56, "yard", world, true); for (let i = 0; i < 18; i++) cyl(x + rand(-38, 38), 1, z + rand(-22, 22), .28, 2, 0x8a5d38, "target"); addNpc("guard", x - 36, z + 20, 0xb77954, "訓練教官", "training"); }
function denseBlocks() { const zones = [[-360, 80, -80, 570, "slum"], [-520, -120, -520, -150, "noble"], [-60, 520, -500, -180, "res"], [-560, 560, 150, 560, "res"], [-560, -260, -120, 120, "res"], [160, 560, -60, 280, "market"], [160, 560, -300, -130, "craft"]]; for (const [x1, x2, z1, z2, type] of zones) for (let x = x1; x <= x2; x += 38) for (let z = z1; z <= z2; z += 34) { if (Math.abs(x) < 55 && Math.abs(z) < 55) continue; if (Math.random() > quality.houses * .72) continue; type === "slum" ? slumHouse(x + rand(-5, 5), z + rand(-4, 4)) : house(x + rand(-4, 4), z + rand(-4, 4), rand(8, 15), rand(8, 13), rand(5, 10), pick([0x7b5a3d, 0x83684d, 0x6d5d4a, 0x8d6542]), Math.random() < .16 ? pick(["INN", "FOOD", "HERB", "BAKER", null]) : null); } }
function props() { for (let i = 0; i < 140 * quality.props; i++) Math.random() < .65 ? crates(rand(-590, 590), rand(-590, 590), Math.floor(rand(2, 5))) : addRock(rand(-590, 590), rand(-590, 590), rand(.25, .6)); for (let i = 0; i < 70 * quality.props; i++) lamp(rand(-600, 600), rand(-600, 600)); }
function traffic() { const routes = [[[-610, 15], [-220, 15], [80, 15], [610, 15]], [[15, 620], [15, 260], [15, -40], [15, -610]], [[-15, -610], [-15, -300], [-15, 40], [-15, 620]], [[240, 260], [350, 90], [420, -120], [260, -260]]]; for (let i = 0; i < quality.carts; i++) { const obj = cart(); const path = routes[i % routes.length]; obj.position.set(path[0][0], 0, path[0][1] + i * 4); world.add(obj); movers.push({ type: "cart", obj, path, index: 1, speed: rand(2.4, 4.2), wait: 0, r: 2.4 }); } }
function pedestrians() { const routes = [[[-580, 8], [-280, 8], [0, 8], [280, 8], [580, 8]], [[8, 600], [8, 260], [8, -80], [8, -580]], [[-390, 260], [-420, 230], [-360, 180], [-300, 210]], [[230, 100], [300, 110], [350, 80], [280, 40]], [[130, -55], [0, 0], [-185, -75]]]; for (let i = 0; i < 45 * quality.npcs; i++) { const path = JSON.parse(JSON.stringify(pick(routes))); const obj = createPerson(pick(["traveler", "merchant", "adventurer", "faithful", "slum"]), pick([0x7f9fbd, 0x8c6f4f, 0x6f8aa6, 0x8c7b5b, 0x9a6f54])); obj.position.set(path[0][0] + rand(-4, 4), 0, path[0][1] + rand(-4, 4)); scene.add(obj); npcs.push(obj); movers.push({ type: "ped", obj, path, index: 1, speed: rand(1.1, 2.2), wait: rand(0, 1), r: .7 }); } }

function house(x, z, w, d, h, color, sign = null, important = false) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rand(-.025, .025); world.add(g); box(0, 1.1, 0, w * .95, 2.2, d * .95, 0x76614a, "", g); box(0, 2.4 + (h - 2.2) / 2, 0, w, h - 2.2, d, color, "", g); const roof = add(new THREE.ConeGeometry(Math.max(w, d) * .75, 3.2, 4), mat(pick([0x3b2a1e, 0x2c4256, 0x742831, 0x4d2f28])), g, important); roof.position.set(0, h + 1.6, 0); roof.rotation.y = Math.PI / 4; for (const sx of [-w * .29, w * .29]) for (const yy of [1.8, 3.0]) box(sx, yy, d / 2 + .08, .7, .8, .08, 0x83a4b6, "", g); box(0, 1.05, d / 2 + .1, 1.4, 1.9, .14, 0x201610, "", g); if (sign) { const lab = label(sign); lab.position.set(0, 2.9, d / 2 + .45); lab.scale.set(1.2, .3, 1); g.add(lab); } addCollider(x, z, w, d, important ? "major" : "house"); cull(g, x, z, important ? 900 : 360); }
function slumHouse(x, z) { const w = rand(5, 10), d = rand(5, 9), h = rand(3, 6); const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rand(-.12, .12); world.add(g); box(0, h / 2, 0, w, h, d, pick([0x4f4238, 0x5d4b39, 0x6d5237]), "", g); const roof = box(0, h + .45, 0, w * 1.1, .8, d * 1.05, pick([0x2d2520, 0x3b2a1e, 0x4d2f28]), "", g); roof.rotation.z = rand(-.08, .08); addCollider(x, z, w, d, "slumHouse"); cull(g, x, z, 340); }
function stall(x, z, color) { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); box(0, .35, 0, 3, .7, 1.7, 0x6a4d35, "", g); box(0, 1.35, 0, 3.5, .14, 2.3, color, "", g); for (let i = 0; i < 4; i++) { const item = add(new THREE.DodecahedronGeometry(.16, 0), mat(pick([0xbf5545, 0xd8b36b, 0x5f9056, 0x8f6b3f])), g); item.position.set(rand(-1.1, 1.1), .85, rand(-.5, .5)); } addCollider(x, z, 3.5, 2.3, "stall"); cull(g, x, z, 340); }
function addCaravan(x, z) { const g = cart(); g.position.set(x, 0, z); g.rotation.y = -.22; world.add(g); addNpc("merchant", x + .8, z + 1.4, 0x6f8aa6, "商人", "caravan_after"); const beast = createBeast(); beast.position.set(x + 2.1, 0, z - .6); beast.rotation.y = -Math.PI / 2; world.add(beast); addCollider(x, z, 4.2, 3.4, "caravan"); cull(g, x, z, 500); }
function cart() { const g = new THREE.Group(); box(0, .55, 0, 2.8, .8, 1.6, 0x70482c, "", g); const h = createHorse(); h.position.set(0, 0, -1.55); g.add(h); for (const sx of [-1.3, 1.3]) for (const sz of [-.7, .7]) { const w = add(new THREE.TorusGeometry(.36, .07, 8, 18), mat(0x2c2018), g); w.position.set(sx, .35, sz); w.rotation.y = Math.PI / 2; } return g; }
function createHorse() { const g = new THREE.Group(); box(0, .78, 0, 1.15, .55, .38, 0x5b3a28, "", g); const neck = box(.5, 1.05, 0, .25, .55, .22, 0x5b3a28, "", g); neck.rotation.z = -.35; box(.75, 1.25, 0, .35, .25, .25, 0x5b3a28, "", g); for (const x of [-.38, .38]) for (const z of [-.14, .14]) box(x, .34, z, .12, .65, .12, 0x3b281d, "", g); return g; }
function createBeast() { const g = new THREE.Group(); box(0, .62, 0, .95, .42, .36, 0x111015, "", g); box(-.58, .72, 0, .36, .28, .32, 0x09090d, "", g); box(-.76, .61, 0, .22, .1, .28, 0x3a0c0c, "", g); return g; }
function addNpc(variant, x, z, color, name, dialogue) { const n = createPerson(variant, color); n.position.set(x, 0, z); n.userData = { kind: "npc", name, dialogue, r: .8 }; const lab = label(name); lab.position.set(0, 2.55, 0); lab.scale.set(1.6, .4, 1); n.add(lab); scene.add(n); npcs.push(n); return n; }
function createPerson(variant = "traveler", color = 0x6f8aa6) { const g = new THREE.Group(); const skin = 0xd8ad84, hair = variant === "receptionist" ? 0xf1dbc5 : variant === "priest" || variant === "faithful" ? 0xd5cfbc : variant === "merchant" ? 0x5a392a : 0x2e2218; body(g, color, variant === "priest" || variant === "faithful" ? 0xcfc8b4 : null); head(g, skin, hair, variant === "priest" ? "hood" : "short"); limbs(g, color, 0x252d3c, 0x39281c, skin); if (variant === "guard") { box(0, 1, .28, .62, .58, .18, 0xa8acb6, "", g); const spear = cyl(-.42, 1.05, 0, .03, 2.2, 0x6e5134, "", g); spear.rotation.z = .1; } if (variant === "adventurer") { const blade = box(.43, 1.02, -.28, .08, .8, .08, 0xc8cbd0, "", g); blade.rotation.z = .45; } return g; }
function body(g, color, robe) { box(0, 1.02, 0, .74, .92, .38, color, "", g); if (robe) { const rb = add(new THREE.ConeGeometry(.5, .95, 6), mat(robe), g); rb.position.set(0, .55, -.03); rb.rotation.x = Math.PI; } else box(0, .86, -.31, .62, .55, .12, 0x1b2740, "", g); box(0, .74, 0, .82, .11, .46, 0x8c6740, "", g); }
function head(g, skin, hair, style) { cyl(0, 1.49, 0, .08, .14, skin, "", g); add(new THREE.SphereGeometry(.29, 16, 12), mat(skin), g).position.set(0, 1.78, 0); const cap = add(new THREE.SphereGeometry(.335, 14, 10), mat(hair), g); cap.scale.set(1.05, style === "hood" ? .9 : .54, 1.03); cap.position.set(0, style === "hood" ? 1.82 : 1.95, -.035); for (const x of [-.17, 0, .17]) box(x, 1.87, .295, .11, .24, .055, hair, "", g); }
function limbs(g, sleeve, leg, boot, skin) { for (const s of [-1, 1]) { const a = box(s * .46, 1.05, 0, .17, .52, .17, sleeve, "", g); a.rotation.z = s * .16; add(new THREE.SphereGeometry(.085, 8, 6), mat(skin), g).position.set(s * .52, .72, .03); box(s * .15, .38, 0, .19, .62, .19, leg, "", g); box(s * .15, .07, .08, .22, .16, .34, boot, "", g); } }
function room(w, d, h, color) { for (const [x, z, ww, dd] of [[0, -d / 2, w, .35], [-w / 2, 0, .35, d], [w / 2, 0, .35, d], [-w * .3, d / 2, w * .4, .35], [w * .3, d / 2, w * .4, .35]]) box(x, h / 2, z, ww, h, dd, color, "wall"); }
function addQuestBoard(x, z) { box(x, 1.25, z, .18, 2.2, 2.2, 0x4a301c, "questBoard", world, true); }
function crates(x, z, n) { for (let i = 0; i < n; i++) box(x + (i % 2) * .75, .35 + Math.floor(i / 2) * .38, z + Math.floor(i / 2) * .75, .7, .7, .7, 0x735334, "crate"); }
function addRock(x, z, s) { const r = add(new THREE.DodecahedronGeometry(s, 0), mat(0x6b6b62), world); r.position.set(x, .2, z); r.scale.y = .55; addCollider(x, z, s * 1.2, s * 1.2, "rock"); cull(r, x, z, 300); }
function addTree(x, z, s, solid) { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); cyl(0, .75 * s, 0, .18 * s, 1.5 * s, 0x5b3a24, "", g); const l1 = add(new THREE.DodecahedronGeometry(s, 0), mat(0x2f6f45), g); l1.position.y = 1.8 * s; const l2 = add(new THREE.DodecahedronGeometry(.65 * s, 0), mat(0x3d8a59), g); l2.position.set(.35 * s, 2.35 * s, -.12 * s); if (solid) addCollider(x, z, .9 * s, .9 * s, "tree"); cull(g, x, z, 360); }
function lamp(x, z) { cyl(x, 1.4, z, .08, 2.8, 0x3d342f); const l = add(new THREE.SphereGeometry(.18, 10, 8), mat(0xe7c56f, .4, 0xe7c56f, .8), world); l.position.set(x + .35, 2.5, z); cull(l, x, z, 300); }
function fountain(x, z, s) { cyl(x, .4 * s, z, 1.8 * s, .8 * s, 0x6f7a80, "fountain", world, true); const w = add(new THREE.CylinderGeometry(1.35 * s, 1.35 * s, .08, 24), mat(0x69a7d2, .25, 0x69a7d2, .12), world); w.position.set(x, .85 * s, z); cull(w, x, z, 700); }
function addSign(x, z, text) { cyl(x, .75, z, .08, 1.5, 0x332315); const s = label(text); s.scale.set(1.55, .42, 1); s.position.set(x, 1.75, z); world.add(s); cull(s, x, z, 700); }
function alleyDetails(x, z) { for (let i = 0; i < 12; i++) { crates(x + rand(-25, 25), z + rand(-20, 20), 2); lamp(x + rand(-35, 35), z + rand(-35, 35)); } const circle = add(new THREE.TorusGeometry(3, .08, 8, 30), mat(0x7446aa, .45, 0x5c28ff, .6), world); circle.position.set(x, .08, z); circle.rotation.x = Math.PI / 2; cull(circle, x, z, 700); }
function addMarker(l) { const ring = add(new THREE.TorusGeometry(.9, .035, 8, 32), mat(l.map ? 0xd8b36b : 0x87c7ff, .42, l.map ? 0xd8b36b : 0x87c7ff, .7), world); ring.position.set(l.x, .08, l.z); ring.rotation.x = Math.PI / 2; cull(ring, l.x, l.z, 800); }
function label(text) { const c = document.createElement("canvas"), x = c.getContext("2d"); c.width = 512; c.height = 128; x.fillStyle = "rgba(10,12,18,.72)"; round(x, 12, 20, 488, 88, 18); x.fill(); x.strokeStyle = "rgba(216,179,107,.75)"; x.lineWidth = 4; round(x, 12, 20, 488, 88, 18); x.stroke(); x.fillStyle = "#f6efe1"; x.font = "bold 38px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 256, 64); return new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true })); }
function round(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function updateMovers(dt) { for (const m of movers) { if (m.obj.visible === false) continue; if (m.wait > 0) { m.wait -= dt; continue; } const t = m.path[m.index], dx = t[0] - m.obj.position.x, dz = t[1] - m.obj.position.z, dist = Math.hypot(dx, dz); if (dist < 1.5) { m.index = (m.index + 1) % m.path.length; if (m.type === "ped") m.wait = rand(.2, 1.3); continue; } const vx = dx / dist, vz = dz / dist; m.obj.position.x += vx * m.speed * dt; m.obj.position.z += vz * m.speed * dt; m.obj.rotation.y = Math.atan2(vx, vz); if (m.type === "ped") m.obj.position.y = Math.abs(Math.sin(clock.elapsedTime * 5)) * .025; } }
function updateCulling() { const px = player.position.x, pz = player.position.z; for (const c of cullables) c.obj.visible = state.debug || Math.hypot(px - c.x, pz - c.z) < c.range; }
function castFireball(mode = "fire") { if (!state.started || !state.loaded) return; const burst = mode === "burst"; if ((burst ? state.burstCooldown : state.fireCooldown) > 0) return; const cost = burst ? 8 : 3; if (state.player.mp < cost) return; state.player.mp -= cost; burst ? state.burstCooldown = .95 : state.fireCooldown = .32; const start = new THREE.Vector3(); camera.getWorldPosition(start); if (state.cameraMode !== "first") start.copy(player.position).add(new THREE.Vector3(0, 1.35, 0)); const dir = new THREE.Vector3(); camera.getWorldDirection(dir); const ball = add(new THREE.SphereGeometry(burst ? .34 : .22, 16, 10), mat(0xff7a1c, .2, 0xff5a00, 2.2), world); ball.position.copy(start); projectiles.push({ ball, dir, life: 2.4, speed: burst ? 42 : 32 }); updateHud(); }
function updateEffects(dt) { state.fireCooldown = Math.max(0, state.fireCooldown - dt); state.burstCooldown = Math.max(0, state.burstCooldown - dt); if (ui.cooldowns.fire) ui.cooldowns.fire.value = state.fireCooldown ? 1 - state.fireCooldown / .32 : 1; if (ui.cooldowns.burst) ui.cooldowns.burst.value = state.burstCooldown ? 1 - state.burstCooldown / .95 : 1; for (let i = projectiles.length - 1; i >= 0; i--) { const p = projectiles[i]; p.life -= dt; p.ball.position.addScaledVector(p.dir, p.speed * dt); if (p.life <= 0) { burstAt(p.ball.position); world.remove(p.ball); projectiles.splice(i, 1); } } for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.life -= dt; b.g.scale.setScalar(1 + (1 - b.life / b.max) * 2); if (b.life <= 0) { world.remove(b.g); bursts.splice(i, 1); } } }
function burstAt(pos) { const g = new THREE.Group(); g.position.copy(pos); world.add(g); for (let i = 0; i < 12; i++) add(new THREE.SphereGeometry(.07, 8, 6), mat(0xff7a1c, .32, 0xff5a00, 1.4), g); bursts.push({ g, life: .45, max: .45 }); state.shake = .18; }
function loop() { const dt = Math.min(clock.getDelta(), .05); if (state.started && state.loaded) { controls(dt); updateMovers(dt); updateEffects(dt); detect(); updateCulling(); cameraUpdate(); } renderer.render(scene, camera); requestAnimationFrame(loop); }
function controls(dt) { if (state.inDialogue) return; let x = (state.keys.has("KeyD") ? 1 : 0) - (state.keys.has("KeyA") ? 1 : 0); let y = (state.keys.has("KeyW") ? 1 : 0) - (state.keys.has("KeyS") ? 1 : 0); const p = gamepad(); if (p) { x += dead(p.axes[0] || 0); y += -dead(p.axes[1] || 0); state.yaw -= dead(p.axes[2] || 0) * 2.8 * dt; state.pitch = THREE.MathUtils.clamp(state.pitch - dead(p.axes[3] || 0) * 1.8 * dt, -.55, .75); } state.yaw += ((state.keys.has("ArrowLeft") ? 1 : 0) - (state.keys.has("ArrowRight") ? 1 : 0)) * 2.25 * dt; state.pitch = THREE.MathUtils.clamp(state.pitch + ((state.keys.has("ArrowUp") ? 1 : 0) - (state.keys.has("ArrowDown") ? 1 : 0)) * 1.35 * dt, -.55, .75); if (state.keys.has("KeyJ")) { castFireball("fire"); state.keys.delete("KeyJ"); } if (state.keys.has("KeyL")) { castFireball("burst"); state.keys.delete("KeyL"); } if (state.keys.has("KeyK")) { dodge(); state.keys.delete("KeyK"); } const up = (state.debug && state.keys.has("Space") ? 1 : 0) - (state.debug && (state.keys.has("ControlLeft") || state.keys.has("ControlRight")) ? 1 : 0); const len = Math.hypot(x, y, up); if (len < .01) { regen(dt, 22); return; } x /= Math.max(1, len); y /= Math.max(1, len); const dash = state.keys.has("ShiftLeft") || state.keys.has("ShiftRight") || (p && (p.buttons[7]?.value || 0) > .25); state.isDashing = dash && state.player.stamina > 2; const speed = state.debug ? (state.isDashing ? 120 : 55) : (state.isDashing ? 8.2 : 4.6); if (!state.debug) state.isDashing ? state.player.stamina = Math.max(0, state.player.stamina - 30 * dt) : regen(dt, 18); const rx = Math.cos(state.yaw), rz = -Math.sin(state.yaw), fx = -Math.sin(state.yaw), fz = -Math.cos(state.yaw); move((rx * x + fx * y) * speed * dt, (rz * x + fz * y) * speed * dt, up * speed * dt); }
function move(dx, dz, dy) { const nx = THREE.MathUtils.clamp(player.position.x + dx, bounds.minX, bounds.maxX); if (state.debug || !blocked(nx, player.position.z)) player.position.x = nx; const nz = THREE.MathUtils.clamp(player.position.z + dz, bounds.minZ, bounds.maxZ); if (state.debug || !blocked(player.position.x, nz)) player.position.z = nz; player.position.y = state.debug ? THREE.MathUtils.clamp(player.position.y + dy, 0, 160) : 0; if (Math.hypot(dx, dz) > .001) player.rotation.y = Math.atan2(dx, dz); staminaText(); }
function dodge() { const back = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw)); move(back.x * 2.8, back.z * 2.8, 0); burstAt(player.position.clone().add(new THREE.Vector3(0, .5, 0))); }
function regen(dt, a) { state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + a * dt); staminaText(); }
function gamepad() { const ps = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []; return ps.find((p) => /dualshock|wireless controller|dualsense|playstation/i.test(p.id)) || ps[0] || null; }
function dead(v) { return Math.abs(v) < .16 ? 0 : v; }
function detect() { let near = null, dist = Infinity; for (const n of npcs) { if (n.visible === false) continue; const d = player.position.distanceTo(n.position); if (d < dist) { dist = d; near = n.userData; } } for (const l of locations) { const d = Math.hypot(player.position.x - l.x, player.position.z - l.z); if (d < dist) { dist = d; near = l; } } if (near && dist < (near.r || 2.5) && !state.inDialogue) { state.active = near; ui.hintText.textContent = near.name || "調べる"; ui.hint.classList.remove("is-hidden"); } else { state.active = null; ui.hint.classList.add("is-hidden"); } }
function cameraUpdate() { const target = new THREE.Vector3(player.position.x, player.position.y + 1.08, player.position.z); if (state.cameraMode === "first") { const eye = new THREE.Vector3(player.position.x, player.position.y + 1.55, player.position.z); const look = new THREE.Vector3(-Math.sin(state.yaw) * Math.cos(state.pitch), Math.sin(state.pitch), -Math.cos(state.yaw) * Math.cos(state.pitch)); camera.position.lerp(eye, .45); camera.lookAt(eye.clone().add(look)); player.visible = false; return; } player.visible = true; const radius = state.map === "plaza" ? 18 : 8.8, base = state.map === "plaza" ? 10 : 5.8; const off = new THREE.Vector3(Math.sin(state.yaw) * radius, base + Math.sin(state.pitch) * 7, Math.cos(state.yaw) * radius); camera.position.lerp(target.clone().add(off), .12); camera.lookAt(target); }
function interact() { const t = state.active; if (!t) return; if (t.map) { loadMap(t.map, t.spawn || initialSpawn(t.map)); return; } openDialogue(t.dialogue || "generic"); }
function openDialogue(id) { state.dialogueId = id; state.lineIndex = 0; state.selected = 0; state.inDialogue = true; ui.dialog.classList.remove("is-hidden"); renderDialogue(); }
function closeDialogue() { state.inDialogue = false; ui.dialog.classList.add("is-hidden"); }
function renderDialogue() { const d = dialogues[state.dialogueId] || (data.dialogues && data.dialogues[state.dialogueId]) || dialogues.generic; ui.speaker.textContent = d.speaker || ""; ui.line.textContent = d.lines[state.lineIndex] || ""; ui.choices.innerHTML = ""; if (state.lineIndex >= d.lines.length - 1 && d.choices) d.choices.forEach((c, i) => { const b = document.createElement("button"); b.textContent = c.text; b.classList.toggle("is-selected", i === state.selected); b.onclick = () => choose(c); ui.choices.appendChild(b); }); }
function advance() { const d = dialogues[state.dialogueId] || dialogues.generic; if (state.lineIndex < d.lines.length - 1) { state.lineIndex++; renderDialogue(); } else if (d.choices?.length) choose(d.choices[state.selected] || d.choices[0]); else closeDialogue(); }
function choose(c) { if (c.done) markDone(c.done); if (c.set) Object.entries(c.set).forEach(([p, v]) => setDeep(p, v)); if (c.objective) data.objective = c.objective; if (c.targetMap) { closeDialogue(); loadMap(c.targetMap, c.spawn || initialSpawn(c.targetMap)); return; } closeDialogue(); updateHud(); }
function markDone(ids) { ids.forEach((id) => { const q = state.quest.find((x) => x.id === id); if (q) q.done = true; }); }
function setDeep(path, val) { const ks = path.split("."); let t = state; while (ks.length > 1) { const k = ks.shift(); t[k] ??= {}; t = t[k]; } t[ks[0]] = val; }
function updateHud() { ui.stat.name.textContent = state.player.name; ui.stat.hp.textContent = `${state.player.hp}/${state.player.maxHp}`; ui.stat.mp.textContent = `${state.player.mp}/${state.player.maxMp}`; staminaText(); ui.stat.rank.textContent = state.player.rank; ui.stat.contract.textContent = state.player.contract; ui.objective.textContent = (state.debug ? "[DEBUG FLY] " : "") + (data.objective || "ギルドへ向かう"); ui.area.textContent = state.map === "plaza" ? "王都アウレリア城下町" : (data.maps?.[state.map]?.name || "王都へ続く森の街道"); ui.map.textContent = state.map === "plaza" ? "[北門]\n  |\n[市場]-[中央広場]-[職人区]\n  |      |\n[スラム]-[ギルド]-[訓練場]\n  |\n[教会]-[貴族街]-[王城]" : (data.maps?.[state.map]?.minimap || "[森の街道] -- [王都門]"); renderQuests(); }
function renderQuests() { ui.quests.innerHTML = ""; state.quest.forEach((q) => { const li = document.createElement("li"); li.textContent = q.text; if (q.done) li.classList.add("done"); ui.quests.appendChild(li); }); }
function staminaText() { ui.stat.stamina.textContent = `${Math.round(state.player.stamina)}/${state.player.maxStamina}`; }
addEventListener("keydown", (e) => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault(); if (state.inDialogue) { if (e.code === "ArrowDown") { state.selected++; renderDialogue(); return; } if (e.code === "ArrowUp") { state.selected = Math.max(0, state.selected - 1); renderDialogue(); return; } if (e.code === "Escape") return closeDialogue(); if (e.code === "Enter" || e.code === "Space") return advance(); } if (e.code === "KeyF") state.cameraMode = state.cameraMode === "third" ? "first" : "third"; if (e.code === "Backquote" || e.code === "F3") { state.debug = !state.debug; updateHud(); } if (e.code === "KeyE" && state.active) interact(); state.keys.add(e.code); });
addEventListener("keyup", (e) => state.keys.delete(e.code));
ui.canvas.addEventListener("pointerdown", (e) => { state.drag = true; state.lastX = e.clientX; state.lastY = e.clientY; });
addEventListener("pointerup", () => state.drag = false);
addEventListener("pointermove", (e) => { if (!state.drag || state.inDialogue) return; state.yaw -= (e.clientX - state.lastX) * .006; state.pitch = THREE.MathUtils.clamp(state.pitch - (e.clientY - state.lastY) * .004, -.55, .75); state.lastX = e.clientX; state.lastY = e.clientY; });
addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, quality.pixelRatio)); });
