import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const data = window.GAME_DATA;
const canvas = document.getElementById("game-canvas");
const loading = document.getElementById("loading");
const interactHint = document.getElementById("interact-hint");
const dialogueBox = document.getElementById("dialogue");
const speakerEl = document.getElementById("speaker");
const lineEl = document.getElementById("line");
const choicesEl = document.getElementById("choices");
const objectiveEl = document.getElementById("objective");

const statEls = {
  name: document.getElementById("stat-name"),
  hp: document.getElementById("stat-hp"),
  mp: document.getElementById("stat-mp"),
  rank: document.getElementById("stat-rank"),
  contract: document.getElementById("stat-contract"),
};

const state = {
  player: structuredClone(data.player),
  keys: new Set(),
  yaw: 0,
  isPointerDown: false,
  lastPointerX: 0,
  activeNpc: null,
  dialogueId: null,
  dialogueLine: 0,
  inDialogue: false,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fb5ca);
scene.fog = new THREE.Fog(0x8fb5ca, 18, 45);

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
player.position.set(0, 0, 5.8);
scene.add(player);

const npcs = [];
initWorld();
initNpcs();
updateStats();
hideLoading();
animate();

function hideLoading() {
  window.setTimeout(() => loading.classList.add("is-hidden"), 350);
}

function initWorld() {
  const hemi = new THREE.HemisphereLight(0xf8f0dc, 0x2b3141, 2.5);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0ce, 3);
  sun.position.set(12, 18, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  const ground = mesh(
    new THREE.PlaneGeometry(42, 42),
    new THREE.MeshStandardMaterial({ color: 0x465343, roughness: 0.92 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);

  const plaza = mesh(
    new THREE.CircleGeometry(8, 40),
    new THREE.MeshStandardMaterial({ color: 0x7e7664, roughness: 0.96 })
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.012;
  plaza.receiveShadow = true;
  world.add(plaza);

  addStonePattern();
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
  addWell(0, 1.1);
}

function addStonePattern() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x9a927f, roughness: 1 });
  for (let i = 0; i < 90; i += 1) {
    const stone = mesh(new THREE.BoxGeometry(rand(0.45, 1.1), 0.025, rand(0.22, 0.55)), mat);
    const r = Math.sqrt(Math.random()) * 7.6;
    const a = Math.random() * Math.PI * 2;
    stone.position.set(Math.cos(a) * r, 0.04, Math.sin(a) * r);
    stone.rotation.y = Math.random() * Math.PI;
    stone.receiveShadow = true;
    world.add(stone);
  }
}

function addRoad(x, z, width, depth) {
  const road = mesh(
    new THREE.BoxGeometry(width, 0.04, depth),
    new THREE.MeshStandardMaterial({ color: 0x6e6657, roughness: 1 })
  );
  road.position.set(x, 0.03, z);
  road.receiveShadow = true;
  world.add(road);
}

function addBuilding(name, x, z, w, d, h, wallColor, roofColor) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const body = mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.88 })
  );
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = mesh(
    new THREE.ConeGeometry(Math.max(w, d) * 0.78, 1.8, 4),
    new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.82 })
  );
  roof.position.y = h + 0.88;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  const door = mesh(
    new THREE.BoxGeometry(1.15, 1.65, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x22170f, roughness: 0.9 })
  );
  door.position.set(0, 0.86, d / 2 + 0.05);
  group.add(door);

  const label = createLabelSprite(name);
  label.position.set(0, h + 2.1, d / 2 + 0.2);
  group.add(label);

  world.add(group);
}

function addMarketStalls() {
  const colors = [0xb43d46, 0x2f6f9f, 0xd8b36b];
  for (let i = 0; i < 4; i += 1) {
    const group = new THREE.Group();
    group.position.set(6.7 + i * 1.65, 0, -1.9 + (i % 2) * 1.6);

    const table = mesh(
      new THREE.BoxGeometry(1.2, 0.5, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x6a4d35, roughness: 0.8 })
    );
    table.position.y = 0.25;
    table.castShadow = true;
    group.add(table);

    const roof = mesh(
      new THREE.BoxGeometry(1.55, 0.08, 1.1),
      new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.8 })
    );
    roof.position.y = 1.3;
    roof.rotation.z = (i % 2 ? -1 : 1) * 0.08;
    roof.castShadow = true;
    group.add(roof);

    world.add(group);
  }
}

function addTrees() {
  const positions = [
    [-7.5, 4.2], [-6.8, -2.2], [7.2, 3.4], [5.7, 7.2],
    [-15, -1.8], [15, 2.3], [-3.2, 10.5], [3.2, 10.8]
  ];

  for (const [x, z] of positions) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const trunk = mesh(
      new THREE.CylinderGeometry(0.22, 0.32, 1.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x5b3a24, roughness: 0.9 })
    );
    trunk.position.y = 0.85;
    trunk.castShadow = true;
    group.add(trunk);

    const leaf = mesh(
      new THREE.DodecahedronGeometry(1.15, 0),
      new THREE.MeshStandardMaterial({ color: 0x2f6f45, roughness: 0.92 })
    );
    leaf.position.y = 2.05;
    leaf.castShadow = true;
    group.add(leaf);

    world.add(group);
  }
}

function addSignBoard(x, z, text) {
  const post = mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x332315 })
  );
  post.position.set(x, 0.75, z);
  post.castShadow = true;
  world.add(post);

  const sign = createLabelSprite(text);
  sign.scale.set(1.5, 0.42, 1);
  sign.position.set(x, 1.75, z);
  world.add(sign);
}

function addWell(x, z) {
  const well = mesh(
    new THREE.CylinderGeometry(0.75, 0.85, 0.75, 16),
    new THREE.MeshStandardMaterial({ color: 0x6f6b63, roughness: 1 })
  );
  well.position.set(x, 0.38, z);
  well.castShadow = true;
  well.receiveShadow = true;
  world.add(well);
}

function initNpcs() {
  for (const npcData of data.npcs) {
    const npc = createNpc(npcData.color);
    npc.position.set(npcData.position.x, 0, npcData.position.z);
    npc.userData = npcData;

    const label = createLabelSprite(npcData.name);
    label.position.set(0, 2.35, 0);
    npc.add(label);

    scene.add(npc);
    npcs.push(npc);
  }
}

function createPlayer() {
  const group = new THREE.Group();

  const body = mesh(
    new THREE.CapsuleGeometry(0.35, 0.85, 4, 12),
    new THREE.MeshStandardMaterial({ color: 0x263a60, roughness: 0.72 })
  );
  body.position.y = 0.9;
  body.castShadow = true;
  group.add(body);

  const head = mesh(
    new THREE.SphereGeometry(0.28, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xd9b58e, roughness: 0.82 })
  );
  head.position.y = 1.55;
  head.castShadow = true;
  group.add(head);

  return group;
}

function createNpc(color) {
  const group = new THREE.Group();

  const body = mesh(
    new THREE.CapsuleGeometry(0.32, 0.75, 4, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.75 })
  );
  body.position.y = 0.86;
  body.castShadow = true;
  group.add(body);

  const head = mesh(
    new THREE.SphereGeometry(0.24, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xd6ad83, roughness: 0.85 })
  );
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

  context.fillStyle = "rgba(10, 12, 18, .72)";
  roundRect(context, 12, 20, 488, 88, 18);
  context.fill();

  context.strokeStyle = "rgba(216, 179, 107, .75)";
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
  sprite.scale.set(2.4, 0.6, 1);
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

function mesh(geometry, material) {
  const object = new THREE.Mesh(geometry, material);
  object.castShadow = false;
  object.receiveShadow = false;
  return object;
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  updateMovement(delta);
  updateNpcDetection();
  updateCamera();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function updateMovement(delta) {
  if (state.inDialogue) return;

  const direction = new THREE.Vector3();
  if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) direction.z -= 1;
  if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) direction.z += 1;
  if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) direction.x -= 1;
  if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) direction.x += 1;

  if (direction.lengthSq() === 0) return;

  direction.normalize();
  const cameraYaw = state.yaw;
  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);
  const dx = direction.x * cos - direction.z * sin;
  const dz = direction.x * sin + direction.z * cos;

  player.position.x += dx * 4.2 * delta;
  player.position.z += dz * 4.2 * delta;
  player.position.x = THREE.MathUtils.clamp(player.position.x, -17, 17);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -17, 17);

  player.rotation.y = Math.atan2(dx, dz);
}

function updateNpcDetection() {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const npc of npcs) {
    const distance = player.position.distanceTo(npc.position);
    if (distance < nearestDistance) {
      nearest = npc;
      nearestDistance = distance;
    }
  }

  if (nearest && nearestDistance < 2.2 && !state.inDialogue) {
    state.activeNpc = nearest;
    interactHint.classList.remove("is-hidden");
  } else {
    state.activeNpc = null;
    interactHint.classList.add("is-hidden");
  }
}

function updateCamera() {
  const radius = 8.8;
  const height = 6.0;
  const target = new THREE.Vector3(player.position.x, player.position.y + 1.0, player.position.z);

  const offset = new THREE.Vector3(
    Math.sin(state.yaw) * radius,
    height,
    Math.cos(state.yaw) * radius
  );

  camera.position.lerp(target.clone().add(offset), 0.12);
  camera.lookAt(target);
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

  if (!dialogue.choices || dialogue.choices.length === 0) {
    closeDialogue();
  }
}

function applyChoice(choice) {
  if (choice.stat) {
    for (const [key, delta] of Object.entries(choice.stat)) {
      state.player[key] = Number(state.player[key] || 0) + Number(delta);
    }
  }

  if (choice.set) {
    for (const [path, value] of Object.entries(choice.set)) {
      setDeepValue(path, value);
    }
  }

  if (choice.objective) {
    data.objective = choice.objective;
    objectiveEl.textContent = choice.objective;
  }

  updateStats();

  if (choice.to) {
    state.dialogueId = choice.to;
    state.dialogueLine = 0;
    renderDialogue();
  } else {
    closeDialogue();
  }
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
  statEls.name.textContent = state.player.name;
  statEls.hp.textContent = `${state.player.hp}/${state.player.maxHp}`;
  statEls.mp.textContent = `${state.player.mp}/${state.player.maxMp}`;
  statEls.rank.textContent = state.player.rank;
  statEls.contract.textContent = state.player.contract;
  objectiveEl.textContent = data.objective;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyE" && state.activeNpc && !state.inDialogue) {
    openDialogue(state.activeNpc.userData.dialogue);
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

window.addEventListener("keyup", (event) => {
  state.keys.delete(event.code);
});

canvas.addEventListener("pointerdown", (event) => {
  state.isPointerDown = true;
  state.lastPointerX = event.clientX;
});

window.addEventListener("pointerup", () => {
  state.isPointerDown = false;
});

window.addEventListener("pointermove", (event) => {
  if (!state.isPointerDown || state.inDialogue) return;
  const dx = event.clientX - state.lastPointerX;
  state.lastPointerX = event.clientX;
  state.yaw -= dx * 0.006;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
