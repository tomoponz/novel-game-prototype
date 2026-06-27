import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const data = window.GAME_DATA;
const canvas = document.getElementById("game-canvas");
const loading = document.getElementById("loading");
const titleScreen = document.getElementById("title-screen");
const startBtn = document.getElementById("start-btn");
const interactHint = document.getElementById("interact-hint");
const interactText = document.getElementById("interact-text");
const dialogueBox = document.getElementById("dialogue");
const speakerEl = document.getElementById("speaker");
const lineEl = document.getElementById("line");
const choicesEl = document.getElementById("choices");
const objectiveEl = document.getElementById("objective");
const areaNameEl = document.getElementById("area-name");
const miniMapText = document.getElementById("mini-map-text");
const questListEl = document.getElementById("quest-list");

const statEls = {
  name: document.getElementById("stat-name"),
  hp: document.getElementById("stat-hp"),
  mp: document.getElementById("stat-mp"),
  rank: document.getElementById("stat-rank"),
  contract: document.getElementById("stat-contract"),
};

const state = {
  player: structuredClone(data.player),
  quest: structuredClone(data.quests),
  currentMap: "plaza",
  keys: new Set(),
  yaw: 0,
  isPointerDown: false,
  lastPointerX: 0,
  activeTarget: null,
  dialogueId: null,
  dialogueLine: 0,
  inDialogue: false,
  started: false,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fb5ca);
scene.fog = new THREE.Fog(0x8fb5ca, 18, 46);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const clock = new THREE.Clock();
const world = new THREE.Group();
scene.add(world);

const player = createPlayer();
scene.add(player);

let npcs = [];
let locations = [];
let bounds = { minX: -17, maxX: 17, minZ: -17, maxZ: 17 };

initLights();
loadMap("plaza", { x: 0, z: 5.8 });
updateStats();
hideLoading();
animate();

function hideLoading() {
  window.setTimeout(() => loading.classList.add("is-hidden"), 350);
}

function initLights() {
  const hemi = new THREE.HemisphereLight(0xf8f0dc, 0x2b3141, 2.4);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0ce, 3.0);
  sun.position.set(12, 18, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);
}

function loadMap(mapId, spawn = { x: 0, z: 0 }) {
  state.currentMap = mapId;
  world.clear();
  for (const npc of npcs) scene.remove(npc);
  npcs = [];
  locations = [];

  if (mapId === "plaza") buildPlaza();
  if (mapId === "guildHall") buildGuildHall();
  if (mapId === "church") buildChurch();

  const mapData = data.maps[mapId];
  for (const npcData of mapData.npcs) addNpc(npcData);
  locations = mapData.locations.map((loc) => ({ ...loc, kind: loc.targetMap ? "door" : "spot" }));

  player.position.set(spawn.x, 0, spawn.z);
  player.rotation.y = 0;
  updateStats();
}

function buildPlaza() {
  scene.background = new THREE.Color(0x8fb5ca);
  scene.fog = new THREE.Fog(0x8fb5ca, 18, 46);
  bounds = { minX: -17, maxX: 17, minZ: -17, maxZ: 17 };

  const ground = mesh(new THREE.PlaneGeometry(42, 42), mat(0x465343, .92));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);

  const plaza = mesh(new THREE.CircleGeometry(8, 40), mat(0x7e7664, .96));
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.012;
  plaza.receiveShadow = true;
  world.add(plaza);

  addStonePattern(90, 7.6);
  addRoad(0, -12, 4.6, 18);
  addRoad(-11, 0, 18, 4.2);
  addRoad(11, 0, 18, 4.2);

  addBuilding("冒険者ギルド", 0, -12.2, 6, 4.2, 4.2, 0x5b3f2a, 0x34251c);
  addBuilding("教会", -10.5, -6.5, 4.6, 4.2, 5.2, 0x6d6a60, 0x303444);
  addBuilding("市場", 10.5, -5.8, 5.8, 3.4, 3.2, 0x7d5b3c, 0x6b2530);
  addBuilding("宿屋", -11.5, 6.5, 5.2, 3.8, 3.6, 0x594338, 0x27394d);
  addBuilding("倉庫", 10.5, 6.8, 5.4, 3.6, 3.3, 0x4a4a45, 0x22252b);

  addMarketStalls();
  addTrees();
  addSignBoard(0, -8.8, "GUILD");
  addSignBoard(-10.5, -3.6, "CHURCH");
  addWell(0, 1.1);
  addCrates(8.5, 5.2, 5);
}

function buildGuildHall() {
  scene.background = new THREE.Color(0x1f1711);
  scene.fog = new THREE.Fog(0x1f1711, 12, 28);
  bounds = { minX: -7.5, maxX: 7.5, minZ: -6.8, maxZ: 7.2 };

  const floor = mesh(new THREE.BoxGeometry(16, .12, 15), mat(0x4c3727, .86));
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  world.add(floor);

  addWall(0, -7.6, 16, .35, 3.2, 0x3a281c);
  addWall(-8.1, 0, .35, 15, 3.2, 0x3a281c);
  addWall(8.1, 0, .35, 15, 3.2, 0x3a281c);
  addWall(-4.8, 7.6, 6.2, .35, 3.2, 0x3a281c);
  addWall(4.8, 7.6, 6.2, .35, 3.2, 0x3a281c);

  const counter = mesh(new THREE.BoxGeometry(6.4, 1.1, .9), mat(0x6b4a2f, .82));
  counter.position.set(0, .55, -4.5);
  counter.castShadow = true;
  world.add(counter);

  addSignBoard(0, -5.4, "RECEPTION");
  addQuestBoard(-5.6, -4.4);
  addTable(-3.4, 1.4);
  addTable(3.6, 1.2);
  addCrates(5.6, 4.4, 4);

  const carpet = mesh(new THREE.BoxGeometry(4.2, .03, 8.6), mat(0x652b2d, .9));
  carpet.position.set(0, .05, 1.7);
  carpet.receiveShadow = true;
  world.add(carpet);
}

function buildChurch() {
  scene.background = new THREE.Color(0x151823);
  scene.fog = new THREE.Fog(0x151823, 12, 28);
  bounds = { minX: -6.7, maxX: 6.7, minZ: -6.2, maxZ: 6.8 };

  const floor = mesh(new THREE.BoxGeometry(14, .12, 14), mat(0x5b5a55, .94));
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  world.add(floor);

  addWall(0, -7.1, 14, .35, 4.0, 0x44434a);
  addWall(-7.1, 0, .35, 14, 4.0, 0x44434a);
  addWall(7.1, 0, .35, 14, 4.0, 0x44434a);
  addWall(-4.2, 7.1, 5.2, .35, 4.0, 0x44434a);
  addWall(4.2, 7.1, 5.2, .35, 4.0, 0x44434a);

  const altar = mesh(new THREE.BoxGeometry(3.8, 1.05, 1.25), mat(0xddd1ae, .85));
  altar.position.set(0, .55, -4.4);
  altar.castShadow = true;
  world.add(altar);

  const light = mesh(new THREE.CylinderGeometry(.18, .24, 1.6, 12), mat(0xd8b36b, .6, 0xd8b36b, .6));
  light.position.set(0, 1.65, -4.35);
  world.add(light);

  for (let i = 0; i < 4; i++) {
    const benchL = mesh(new THREE.BoxGeometry(2.4, .35, .55), mat(0x5d4129, .85));
    benchL.position.set(-2.6, .28, -1.2 + i * 1.45);
    benchL.castShadow = true;
    world.add(benchL);

    const benchR = benchL.clone();
    benchR.position.x = 2.6;
    world.add(benchR);
  }

  addSignBoard(0, -5.4, "ALTAR");
}

function addStonePattern(count, radius) {
  const material = mat(0x9a927f, 1);
  for (let i = 0; i < count; i += 1) {
    const stone = mesh(new THREE.BoxGeometry(rand(.45, 1.1), .025, rand(.22, .55)), material);
    const r = Math.sqrt(Math.random()) * radius;
    const a = Math.random() * Math.PI * 2;
    stone.position.set(Math.cos(a) * r, .04, Math.sin(a) * r);
    stone.rotation.y = Math.random() * Math.PI;
    stone.receiveShadow = true;
    world.add(stone);
  }
}

function addRoad(x, z, width, depth) {
  const road = mesh(new THREE.BoxGeometry(width, .04, depth), mat(0x6e6657, 1));
  road.position.set(x, .03, z);
  road.receiveShadow = true;
  world.add(road);
}

function addWall(x, z, width, depth, height, color) {
  const wall = mesh(new THREE.BoxGeometry(width, height, depth), mat(color, .9));
  wall.position.set(x, height / 2, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  world.add(wall);
}

function addBuilding(name, x, z, w, d, h, wallColor, roofColor) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const body = mesh(new THREE.BoxGeometry(w, h, d), mat(wallColor, .88));
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = mesh(new THREE.ConeGeometry(Math.max(w, d) * .78, 1.8, 4), mat(roofColor, .82));
  roof.position.y = h + .88;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  const door = mesh(new THREE.BoxGeometry(1.15, 1.65, .08), mat(0x22170f, .9));
  door.position.set(0, .86, d / 2 + .05);
  group.add(door);

  const label = createLabelSprite(name);
  label.position.set(0, h + 2.1, d / 2 + .2);
  group.add(label);
  world.add(group);
}

function addMarketStalls() {
  const colors = [0xb43d46, 0x2f6f9f, 0xd8b36b];
  for (let i = 0; i < 4; i += 1) {
    const group = new THREE.Group();
    group.position.set(6.7 + i * 1.65, 0, -1.9 + (i % 2) * 1.6);
    const table = mesh(new THREE.BoxGeometry(1.2, .5, .8), mat(0x6a4d35, .8));
    table.position.y = .25;
    table.castShadow = true;
    group.add(table);
    const roof = mesh(new THREE.BoxGeometry(1.55, .08, 1.1), mat(colors[i % colors.length], .8));
    roof.position.y = 1.3;
    roof.rotation.z = (i % 2 ? -1 : 1) * .08;
    roof.castShadow = true;
    group.add(roof);
    world.add(group);
  }
}

function addTrees() {
  const positions = [[-7.5,4.2],[-6.8,-2.2],[7.2,3.4],[5.7,7.2],[-15,-1.8],[15,2.3],[-3.2,10.5],[3.2,10.8]];
  for (const [x, z] of positions) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const trunk = mesh(new THREE.CylinderGeometry(.22, .32, 1.7, 8), mat(0x5b3a24, .9));
    trunk.position.y = .85;
    trunk.castShadow = true;
    group.add(trunk);
    const leaf = mesh(new THREE.DodecahedronGeometry(1.15, 0), mat(0x2f6f45, .92));
    leaf.position.y = 2.05;
    leaf.castShadow = true;
    group.add(leaf);
    world.add(group);
  }
}

function addCrates(x, z, count) {
  for (let i = 0; i < count; i += 1) {
    const crate = mesh(new THREE.BoxGeometry(.7, .7, .7), mat(0x735334, .86));
    crate.position.set(x + (i % 2) * .8, .35 + Math.floor(i / 2) * .38, z + Math.floor(i / 2) * .75);
    crate.rotation.y = rand(-.2, .2);
    crate.castShadow = true;
    world.add(crate);
  }
}

function addSignBoard(x, z, text) {
  const post = mesh(new THREE.CylinderGeometry(.08, .08, 1.5, 8), mat(0x332315, .85));
  post.position.set(x, .75, z);
  post.castShadow = true;
  world.add(post);
  const sign = createLabelSprite(text);
  sign.scale.set(1.5, .42, 1);
  sign.position.set(x, 1.75, z);
  world.add(sign);
}

function addQuestBoard(x, z) {
  const board = mesh(new THREE.BoxGeometry(.18, 2.2, 2.2), mat(0x4a301c, .88));
  board.position.set(x, 1.25, z);
  board.castShadow = true;
  world.add(board);
  const label = createLabelSprite("QUEST");
  label.scale.set(1.3, .34, 1);
  label.position.set(x + .15, 2.55, z);
  world.add(label);
}

function addTable(x, z) {
  const table = mesh(new THREE.BoxGeometry(2.0, .35, 1.2), mat(0x5a3e28, .85));
  table.position.set(x, .55, z);
  table.castShadow = true;
  world.add(table);
  for (const sx of [-.75, .75]) {
    const chair = mesh(new THREE.BoxGeometry(.45, .55, .45), mat(0x3e2a1d, .85));
    chair.position.set(x + sx, .32, z + .95);
    chair.castShadow = true;
    world.add(chair);
  }
}

function addWell(x, z) {
  const well = mesh(new THREE.CylinderGeometry(.75, .85, .75, 16), mat(0x6f6b63, 1));
  well.position.set(x, .38, z);
  well.castShadow = true;
  well.receiveShadow = true;
  world.add(well);
}

function addNpc(npcData) {
  const npc = createNpc(npcData.color);
  npc.position.set(npcData.position.x, 0, npcData.position.z);
  npc.userData = { ...npcData, kind: "npc" };
  const label = createLabelSprite(npcData.name);
  label.position.set(0, 2.35, 0);
  npc.add(label);
  scene.add(npc);
  npcs.push(npc);
}

function createPlayer() {
  const group = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(.35, .85, 4, 12), mat(0x263a60, .72));
  body.position.y = .9;
  body.castShadow = true;
  group.add(body);
  const head = mesh(new THREE.SphereGeometry(.28, 16, 12), mat(0xd9b58e, .82));
  head.position.y = 1.55;
  head.castShadow = true;
  group.add(head);
  return group;
}

function createNpc(color) {
  const group = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(.32, .75, 4, 12), mat(color, .75));
  body.position.y = .86;
  body.castShadow = true;
  group.add(body);
  const head = mesh(new THREE.SphereGeometry(.24, 16, 12), mat(0xd6ad83, .85));
  head.position.y = 1.48;
  head.castShadow = true;
  group.add(head);
  return group;
}

function createLabelSprite(text) {
  const labelCanvas = document.createElement("canvas");
  const context = labelCanvas.getContext("2d");
  labelCanvas.width = 512;
  labelCanvas.height = 128;
  context.fillStyle = "rgba(10,12,18,.72)";
  roundRect(context, 12, 20, 488, 88, 18);
  context.fill();
  context.strokeStyle = "rgba(216,179,107,.75)";
  context.lineWidth = 4;
  roundRect(context, 12, 20, 488, 88, 18);
  context.stroke();
  context.fillStyle = "#f6efe1";
  context.font = "bold 38px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(labelCanvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.4, .6, 1);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function mat(color, roughness = .8, emissive = 0x000000, intensity = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, emissive, emissiveIntensity: intensity });
}

function mesh(geometry, material) {
  return new THREE.Mesh(geometry, material);
}

function animate() {
  const delta = Math.min(clock.getDelta(), .05);
  updateMovement(delta);
  updateInteractionDetection();
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function updateMovement(delta) {
  if (!state.started || state.inDialogue) return;
  const direction = new THREE.Vector3();
  if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) direction.z -= 1;
  if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) direction.z += 1;
  if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) direction.x -= 1;
  if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) direction.x += 1;
  if (direction.lengthSq() === 0) return;

  direction.normalize();
  const sin = Math.sin(state.yaw);
  const cos = Math.cos(state.yaw);
  const dx = direction.x * cos - direction.z * sin;
  const dz = direction.x * sin + direction.z * cos;
  player.position.x += dx * 4.2 * delta;
  player.position.z += dz * 4.2 * delta;
  player.position.x = THREE.MathUtils.clamp(player.position.x, bounds.minX, bounds.maxX);
  player.position.z = THREE.MathUtils.clamp(player.position.z, bounds.minZ, bounds.maxZ);
  player.rotation.y = Math.atan2(dx, dz);
}

function updateInteractionDetection() {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const npc of npcs) {
    const distance = player.position.distanceTo(npc.position);
    if (distance < nearestDistance) {
      nearest = npc.userData;
      nearestDistance = distance;
    }
  }

  for (const location of locations) {
    const distance = distanceXZ(player.position, location.position);
    if (distance < nearestDistance) {
      nearest = location;
      nearestDistance = distance;
    }
  }

  const radius = nearest?.radius ?? 2.2;
  if (nearest && nearestDistance < radius && !state.inDialogue && state.started) {
    state.activeTarget = nearest;
    interactText.textContent = nearest.kind === "door" ? nearest.name : "話す";
    if (nearest.dialogue && nearest.kind === "spot") interactText.textContent = nearest.name;
    interactHint.classList.remove("is-hidden");
  } else {
    state.activeTarget = null;
    interactHint.classList.add("is-hidden");
  }
}

function distanceXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

function updateCamera() {
  const radius = state.currentMap === "plaza" ? 8.8 : 6.8;
  const height = state.currentMap === "plaza" ? 6.0 : 5.0;
  const target = new THREE.Vector3(player.position.x, player.position.y + 1.0, player.position.z);
  const offset = new THREE.Vector3(Math.sin(state.yaw) * radius, height, Math.cos(state.yaw) * radius);
  camera.position.lerp(target.clone().add(offset), .12);
  camera.lookAt(target);
}

function interact() {
  const target = state.activeTarget;
  if (!target) return;
  if (target.targetMap) {
    markDone(target.id === "guild_door" ? ["guild"] : []);
    if (target.targetMap === "guildHall") setObjective("受付で登録条件を聞く");
    loadMap(target.targetMap, target.spawn);
    return;
  }
  if (target.dialogue) openDialogue(target.dialogue);
}

function openDialogue(id) {
  state.dialogueId = id;
  state.dialogueLine = 0;
  state.inDialogue = true;
  choicesEl.innerHTML = "";
  dialogueBox.classList.remove("is-hidden");
  interactHint.classList.add("is-hidden");
  renderDialogue();
}

function closeDialogue() {
  state.inDialogue = false;
  state.dialogueId = null;
  state.dialogueLine = 0;
  dialogueBox.classList.add("is-hidden");
}

function currentDialogue() {
  return data.dialogues[state.dialogueId];
}

function renderDialogue() {
  const dialogue = currentDialogue();
  if (!dialogue) return closeDialogue();
  speakerEl.textContent = dialogue.speaker || "";
  lineEl.textContent = dialogue.lines[state.dialogueLine] || "";
  choicesEl.innerHTML = "";
  const atEnd = state.dialogueLine >= dialogue.lines.length - 1;
  if (atEnd && dialogue.choices) {
    for (const choice of dialogue.choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.text;
      button.addEventListener("click", () => applyChoice(choice));
      choicesEl.appendChild(button);
    }
  }
}

function advanceDialogue() {
  const dialogue = currentDialogue();
  if (!dialogue) return;
  if (state.dialogueLine < dialogue.lines.length - 1) {
    state.dialogueLine += 1;
    renderDialogue();
    return;
  }
  if (!dialogue.choices || dialogue.choices.length === 0) closeDialogue();
}

function applyChoice(choice) {
  if (choice.stat) {
    for (const [key, delta] of Object.entries(choice.stat)) {
      state.player[key] = Number(state.player[key] || 0) + Number(delta);
    }
  }
  if (choice.set) {
    for (const [path, value] of Object.entries(choice.set)) setDeepValue(path, value);
  }
  if (choice.objective) setObjective(choice.objective);
  if (choice.done) markDone(choice.done);
  updateStats();

  if (choice.targetMap) {
    closeDialogue();
    loadMap(choice.targetMap, choice.spawn || { x: 0, z: 0 });
    return;
  }
  if (choice.to) {
    state.dialogueId = choice.to;
    state.dialogueLine = 0;
    renderDialogue();
  } else {
    closeDialogue();
  }
}

function setObjective(text) {
  data.objective = text;
  objectiveEl.textContent = text;
}

function markDone(ids) {
  for (const id of ids) {
    const quest = state.quest.find((item) => item.id === id);
    if (quest) quest.done = true;
  }
  renderQuests();
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

function updateStats() {
  const mapData = data.maps[state.currentMap];
  statEls.name.textContent = state.player.name;
  statEls.hp.textContent = `${state.player.hp}/${state.player.maxHp}`;
  statEls.mp.textContent = `${state.player.mp}/${state.player.maxMp}`;
  statEls.rank.textContent = state.player.rank;
  statEls.contract.textContent = state.player.contract;
  objectiveEl.textContent = data.objective;
  areaNameEl.textContent = mapData.name;
  miniMapText.textContent = mapData.minimap;
  renderQuests();
}

function renderQuests() {
  questListEl.innerHTML = "";
  for (const quest of state.quest) {
    const li = document.createElement("li");
    li.textContent = quest.text;
    if (quest.done) li.classList.add("done");
    questListEl.appendChild(li);
  }
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

startBtn.addEventListener("click", () => {
  state.started = true;
  titleScreen.classList.add("is-hidden");
});

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyE" && state.activeTarget && !state.inDialogue) {
    interact();
    return;
  }
  if (state.inDialogue) {
    if (event.code === "Escape") closeDialogue();
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      advanceDialogue();
    }
    return;
  }
  state.keys.add(event.code);
});

window.addEventListener("keyup", (event) => state.keys.delete(event.code));
canvas.addEventListener("pointerdown", (event) => {
  state.isPointerDown = true;
  state.lastPointerX = event.clientX;
});
window.addEventListener("pointerup", () => { state.isPointerDown = false; });
window.addEventListener("pointermove", (event) => {
  if (!state.isPointerDown || state.inDialogue) return;
  const dx = event.clientX - state.lastPointerX;
  state.lastPointerX = event.clientX;
  state.yaw -= dx * .006;
});
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
