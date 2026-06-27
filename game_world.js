import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $ = (id) => document.getElementById(id);
const data = window.GAME_DATA;
const ui = {
  canvas: $("game-canvas"), loading: $("loading"), title: $("title-screen"), start: $("start-btn"),
  hint: $("interact-hint"), hintText: $("interact-text"), dialog: $("dialogue"), speaker: $("speaker"), line: $("line"), choices: $("choices"),
  objective: $("objective"), area: $("area-name"), map: $("mini-map-text"), quests: $("quest-list"),
  stat: { name: $("stat-name"), hp: $("stat-hp"), mp: $("stat-mp"), stamina: $("stat-stamina"), rank: $("stat-rank"), contract: $("stat-contract") }
};

const extraDialogues = {
  wake_after: { speaker: "ユウジ", lines: ["白い輪郭はまだ視界の端に残っている。これは幻覚ではなく、この世界の仕組みだ。", "同じ場所で悩むより、街道の先にある荷車と王都門を確認する。"] },
  caravan_after: { speaker: "ユウジ", lines: ["黒毛の噛み犬はもう動かない。荷車の周囲には焦げ跡と散らばった木箱だけが残っている。", "何度も火球を撃つ必要はない。紹介状を持って王都へ向かう。"] },
  caravan_retreat_after: { speaker: "ユウジ", lines: ["荷車の現場にはまだ獣臭が残っている。", "助けなかった事実は消えない。だが、ギルドへ行かなければ身分も得られない。"] },
  shady_alley: { speaker: "路地裏の男", lines: ["よそ者だな。北門から来た顔をしている。", "この路地では、金より身元の方が高く売れる。用がないなら表通りへ戻れ。"], choices: [{ text: "表通りへ戻る", objective: "ギルドへ向かう" }] },
  fountain_hint: { speaker: "広場の噴水", lines: ["水面に王城とギルドの旗が映っている。大通りは人と馬車で埋まっている。", "王都は広いが、看板、門、旗、鐘楼を追えば迷いにくい。"] },
  reception_after: { speaker: "ギルド受付", lines: ["受付処理は進んでいます。次は指定された目的を済ませてください。", "同じ説明を聞くより、行動で確認する方が早いです。"] },
  priest_after: { speaker: "司祭", lines: ["確認書の話は済みました。ギルドに戻れば受付が読めるはずです。"] }
};

const state = {
  player: { stamina: 100, maxStamina: 100, ...structuredClone(data.player) },
  quest: structuredClone(data.quests), map: data.startMap || "forestRoad",
  keys: new Set(), yaw: 0, pitch: .06, cameraMode: "third", debug: false,
  started: false, dragging: false, lastX: 0, lastY: 0, activeTarget: null,
  inDialogue: false, dialogueId: null, dialogueLine: 0, selectedChoice: 0, choiceCooldown: 0,
  padButtons: [], isDashing: false, dodgeTimer: 0, castCooldown: 0
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 950);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const world = new THREE.Group();
scene.add(world);
const clock = new THREE.Clock();
const player = createPlayer();
scene.add(player);

let npcs = [];
let locations = [];
let colliders = [];
let movers = [];
let bounds = { minX: -85, maxX: 85, minZ: -125, maxZ: 125 };
let caravan = null;
let beast = null;
let merchant = null;
const projectiles = [];
const bursts = [];

initLights();
loadMap(state.map, data.startSpawn || { x: 0, z: 74 });
updateHud();
setTimeout(() => ui.loading.classList.add("is-hidden"), 250);
requestAnimationFrame(loop);

function initLights(){
  scene.add(new THREE.HemisphereLight(0xf7eddb, 0x28364a, 2.75));
  const sun = new THREE.DirectionalLight(0xfff0ce, 3.2);
  sun.position.set(40,70,30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{ near:.5, far:260, left:-135, right:135, top:135, bottom:-135 });
  scene.add(sun);
}
function mat(color, rough=.82, em=0x000000, power=0){
  return new THREE.MeshStandardMaterial({ color, roughness: rough, emissive: em, emissiveIntensity: power, flatShading: true });
}
function add(geo, material, parent=world, cast=true, receive=true){
  const m = new THREE.Mesh(geo, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
}
function rand(a,b){ return a + Math.random() * (b-a); }
function pick(arr){ return arr[Math.floor(rand(0,arr.length))]; }
function questDone(id){ return state.quest.some(q => q.id === id && q.done); }

function loadMap(id, spawn){
  state.map = id;
  world.clear();
  npcs.forEach(n => scene.remove(n));
  npcs = []; locations = []; colliders = []; movers = [];
  caravan = beast = merchant = null;
  projectiles.length = 0; bursts.length = 0;

  ({ forestRoad: buildForestRoad, plaza: buildKingdom, guildHall: buildGuildHall, church: buildChurch, trainingGround: buildTrainingGround }[id] || buildKingdom)();

  const md = data.maps[id];
  locations = (md.locations || []).map(l => ({ ...l, kind: l.targetMap ? "door" : "spot" }));
  if(id === "plaza"){
    locations.push(
      { id: "fountain", name: "噴水広場を調べる", position: { x: 0, z: 0 }, dialogue: "fountain_hint", radius: 4.0, kind: "spot" },
      { id: "shady_alley", name: "怪しい路地裏に入る", position: { x: -148, z: 72 }, dialogue: "shady_alley", radius: 4.0, kind: "spot" }
    );
  }
  locations.forEach(addMarker);
  (md.npcs || []).forEach(addNpc);

  player.position.set(spawn.x, spawn.y || 0, spawn.z);
  updateHud();
}
function env(color, near, far){ scene.background = new THREE.Color(color); scene.fog = new THREE.Fog(color, near, far); }
function addCollider(x,z,w,d,label=""){ colliders.push({ x, z, w, d, label }); }
function isBlocked(x,z,r=.58){
  for(const c of colliders){
    if(x > c.x - c.w/2 - r && x < c.x + c.w/2 + r && z > c.z - c.d/2 - r && z < c.z + c.d/2 + r) return true;
  }
  return false;
}
function placeBox(x,y,z,w,h,d,color,label="",parent=world){
  const m = add(new THREE.BoxGeometry(w,h,d), mat(color), parent);
  m.position.set(x,y,z);
  if(parent === world && label) addCollider(x,z,w,d,label);
  return m;
}
function placeCylinder(x,y,z,r,h,color,label="",parent=world){
  const m = add(new THREE.CylinderGeometry(r,r,h,12), mat(color), parent);
  m.position.set(x,y,z);
  if(parent === world && label) addCollider(x,z,r*2,r*2,label);
  return m;
}
function ground(w,d,color){
  const g = add(new THREE.PlaneGeometry(w,d), mat(color,.95), world, false, true);
  g.rotation.x = -Math.PI/2;
  return g;
}
function addRoad(x,z,w,d,color=0x6f6657){
  const r = placeBox(x,.03,z,w,.04,d,color);
  r.receiveShadow = true;
  return r;
}

function buildForestRoad(){
  env(0x6f91a1, 38, 230);
  bounds = { minX:-85, maxX:85, minZ:-125, maxZ:125 };
  ground(190,270,0x35513d);
  addRoad(0,0,9,250,0x746756);

  for(let z=-118; z<=118; z+=18){
    addRoad(-15,z,20,3.2,0x665b4f);
    addRoad(16,z+8,18,2.8,0x665b4f);
  }
  for(let i=0;i<260;i++){
    const side = Math.random()<.5 ? -1 : 1;
    const x = side * rand(12,82);
    const z = rand(-124,124);
    addTree(x,z,rand(.8,1.5), true);
  }
  for(let i=0;i<90;i++){
    const rock = add(new THREE.DodecahedronGeometry(rand(.25,.75),0), mat(0x6b6b62,.95));
    rock.position.set(rand(-80,80), .16, rand(-120,120));
    rock.scale.y = rand(.45,.9);
    addCollider(rock.position.x, rock.position.z, .8, .8, "rock");
  }
  addGateModel(0,-112);
  addCaravanScene(6, 15);
  addWanderingGuards();
  addSignPost(-6,82,"STATUS");
  addSignPost(7,-90,"ROYAL CAPITAL");
}

function buildKingdom(){
  env(0x9eb9c6, 45, 430);
  bounds = { minX:-210, maxX:210, minZ:-210, maxZ:210 };
  ground(430,430,0x4b634d);
  cityWall();

  addRoad(0,0,18,390,0x817767);
  addRoad(0,0,390,18,0x817767);
  addRoad(-78,0,10,330,0x736857);
  addRoad(78,0,10,330,0x736857);
  addRoad(0,-76,330,10,0x736857);
  addRoad(0,78,330,10,0x736857);

  addCastle(0,-150);
  addFountain(0,0);
  addGuildExterior(28,-44);
  addChurchExterior(-74,-44);
  addTrainingYard(128,78);
  addMarketBlock(82,20);
  addNobleBlock(-105,-80);
  addBarracks(120,-80);
  addSlumBlock(-120,80);
  addSuspiciousAlley(-148,72);

  for(let gx=-168; gx<=168; gx+=28){
    for(let gz=-168; gz<=168; gz+=28){
      if(Math.abs(gx)<24 || Math.abs(gz)<24 || Math.hypot(gx,gz)<36) continue;
      if(gx < -100 && gz > 45) continue;
      if(Math.random()<.78) addMedievalHouse(gx+rand(-4,4),gz+rand(-4,4),rand(5.2,9.5),rand(4.8,9),rand(3.2,6.8), pick([0x7b5a3d,0x83684d,0x6d5d4a,0x8d6542]));
    }
  }

  for(let i=0;i<180;i++){
    const x = rand(-190,190), z = rand(-190,190);
    if(Math.abs(x)<18 || Math.abs(z)<18) continue;
    if(Math.random()<.42) addTree(x,z,rand(.65,1.05), false);
    else addCrateStack(x,z,Math.floor(rand(2,5)));
  }

  addTrafficCarts();
  addPedestrians();
  addStreetDetails();
  [[0,185,"NORTH GATE"],[28,-31,"GUILD"],[-74,-31,"CHURCH"],[128,94,"TRAINING"],[0,-135,"CASTLE"],[-148,72,"ALLEY"]].forEach(v=>addSignPost(...v));
}

function buildGuildHall(){
  env(0x1f1711,12,34);
  bounds = { minX:-7.5, maxX:7.5, minZ:-6.8, maxZ:7.2 };
  room(16,15,3.2,0x4c3727,0x3a281c,0x5b402b);
  placeBox(0,.55,-4.5,6.4,1.1,.9,0x6b4a2f,"counter");
  placeBox(0,1.2,-6.2,5.6,2.4,.5,0x5a3d27,"shelf");
  for(let i=-2;i<=2;i++) placeCylinder(i*.85,1.95,-5.95,.08,.48,0x6c8aa6);
  addSignPost(0,-5.4,"RECEPTION");
  addQuestBoard(-5.6,-4.4);
  addTable(-3.4,1.4);
  addTable(3.6,1.2);
  addCrateStack(5.6,4.4,5);
  addInteriorShelves();
  addLamp(-6.8,-2); addLamp(6.8,-2);
  placeBox(0,.05,1.7,4.2,.03,8.6,0x652b2d);
}
function buildChurch(){
  env(0x151823,12,34);
  bounds = { minX:-6.7, maxX:6.7, minZ:-6.2, maxZ:6.8 };
  room(14,14,4,0x5b5a55,0x44434a,0x6a604b);
  placeBox(0,.55,-4.4,3.8,1.05,1.25,0xddd1ae,"altar");
  placeBox(0,1.1,-4.4,3.1,.08,.95,0xf2e5c0);
  [[-1,-4.15],[1,-4.15],[-.55,-3.85],[.55,-3.85]].forEach(v=>addCandle(...v));
  for(let i=0;i<4;i++){ addBench(-2.6,-1.2+i*1.45); addBench(2.6,-1.2+i*1.45); }
  addSignPost(0,-5.4,"ALTAR");
}
function buildTrainingGround(){
  env(0x88a6b4,25,180);
  bounds = { minX:-60, maxX:60, minZ:-70, maxZ:70 };
  ground(130,150,0x556c4c);
  addRoad(0,0,18,130,0x776b5a);
  for(let i=0;i<12;i++){
    const t = placeCylinder(rand(-35,35),.85,rand(-40,40),.25,1.7,0x7a5635,"target");
    const label = createLabel("TARGET"); label.scale.set(.9,.24,1); label.position.set(0,2.1,0); t.add(label);
  }
  addSignPost(0,48,"TO CAPITAL");
}

function room(w,d,h,floor,wall,beam){
  placeBox(0,-.02,0,w,.12,d,floor);
  [[0,-d/2,w,.35],[-w/2,0,.35,d],[w/2,0,.35,d],[-w*.3,d/2,w*.4,.35],[w*.3,d/2,w*.4,.35]].forEach(([x,z,ww,dd])=>placeBox(x,h/2,z,ww,h,dd,wall,"wall"));
  for(let i=0;i<6;i++) placeBox(0,h-.3,-d/2+1+i*((d-2)/5),w-.8,.24,.26,beam);
}
function cityWall(){
  for(const [x,z,w,d] of [[0,-205,400,6],[0,205,400,6],[-205,0,6,400],[205,0,6,400]]) placeBox(x,3,z,w,6,d,0x6d6c64,"wall");
  for(let i=-180;i<=180;i+=40){
    placeBox(i,8,-205,8,10,8,0x74736b,"tower"); placeBox(i,8,205,8,10,8,0x74736b,"tower");
    placeBox(-205,8,i,8,10,8,0x74736b,"tower"); placeBox(205,8,i,8,10,8,0x74736b,"tower");
  }
}
function addGateModel(x,z){
  placeBox(x,3,z,28,6,5,0x6d6c64,"gate");
  placeBox(x-10,8,z,5,10,7,0x74736b,"gateTower");
  placeBox(x+10,8,z,5,10,7,0x74736b,"gateTower");
  const arch = add(new THREE.TorusGeometry(5.2,.35,8,24,Math.PI), mat(0x8a887e));
  arch.position.set(x,5.5,z+2.55);
  arch.rotation.z = Math.PI;
}
function addCastle(x,z){
  placeBox(x,4,z,42,8,34,0x8b8a82,"castle");
  placeBox(x,10,z-12,28,8,12,0x96958e,"castleKeep");
  for(const sx of [-19,19]){
    placeBox(x+sx,11,z,8,16,8,0x7e7d76,"castleTower");
    const roof=add(new THREE.ConeGeometry(6,8,4),mat(0x394456)); roof.position.set(x+sx,23,z); roof.rotation.y=Math.PI/4;
  }
}
function addMedievalHouse(x,z,w,d,h,color){
  const g = new THREE.Group(); g.position.set(x,0,z); g.rotation.y = rand(-.03,.03); world.add(g);
  placeBox(0,h/2,0,w,h,d,color,"",g);
  const roof = add(new THREE.ConeGeometry(Math.max(w,d)*.73,2.6,4), mat(pick([0x3b2a1e,0x2c4256,0x742831,0x4d2f28])), g);
  roof.position.set(0,h+1.25,0); roof.rotation.y=Math.PI/4;
  for(const sx of [-w*.28,w*.28]) for(const yy of [1.6,2.75]){
    placeBox(sx,yy,d/2+.04,.7,.8,.08,0x9b835d,"",g);
    placeBox(sx,yy,d/2+.09,.48,.56,.04,0x83a4b6,"",g);
  }
  placeBox(0,1.05,d/2+.08,1.15,1.85,.12,0x201610,"",g);
  if(Math.random()<.55){
    const sign = createLabel(pick(["INN","BAKER","SMITH","TOOLS","HERBS"]));
    sign.scale.set(1.05,.28,1); sign.position.set(rand(-w*.3,w*.3),2.55,d/2+.35); g.add(sign);
  }
  if(Math.random()<.45) placeBox(-w*.35,h+1.4,-d*.2,.45,1.7,.45,0x50453b,"",g);
  addCollider(x,z,w,d,"house");
}
function addGuildExterior(x,z){
  addMedievalHouse(x,z,16,12,7.5,0x6a5036);
  placeBox(x,2,z+6.3,3.2,4,.4,0x201610,"guildDoor");
  addSignPost(x,z+9,"GUILD");
}
function addChurchExterior(x,z){
  addMedievalHouse(x,z,15,12,9,0x7c7a76);
  const sp=add(new THREE.ConeGeometry(3,11,4),mat(0x2f3541)); sp.position.set(x,16,z); sp.rotation.y=Math.PI/4;
  addSignPost(x,z+9,"CHURCH");
}
function addMarketBlock(x,z){
  for(let i=0;i<28;i++){
    const g=new THREE.Group(); g.position.set(x+rand(-32,32),0,z+rand(-32,32)); world.add(g);
    placeBox(0,.35,0,2.7,.7,1.5,0x6a4d35,"",g);
    const roof=placeBox(0,1.35,0,3.2,.12,2.1,pick([0xb43d46,0x2f6f9f,0xd8b36b,0x3f815a]),"",g);
    roof.rotation.z=rand(-.1,.1);
    for(let j=0;j<4;j++){ const item=add(new THREE.DodecahedronGeometry(.13,0),mat(pick([0xbf5545,0xd8b36b,0x5f9056,0x8f6b3f])),g); item.position.set(rand(-.9,.9),.82,rand(-.45,.45)); }
  }
}
function addSlumBlock(x,z){
  for(let i=0;i<38;i++) addMedievalHouse(x+rand(-48,48),z+rand(-38,38),rand(3,6),rand(3,6),rand(2.2,4),pick([0x5d4b39,0x4f4238,0x6d5237]));
}
function addNobleBlock(x,z){
  for(let i=0;i<18;i++) addMedievalHouse(x+rand(-48,48),z+rand(-40,40),rand(7,12),rand(6,11),rand(5,8.5),pick([0x8b806d,0x90785e,0x7a776f]));
}
function addBarracks(x,z){
  for(let i=0;i<8;i++) placeBox(x+((i%4)-1.5)*14,3,z+Math.floor(i/4)*16,10,6,12,0x60646a,"barracks");
  addSignPost(x,z-14,"BARRACKS");
}
function addTrainingYard(x,z){
  placeBox(x,.06,z,42,.1,28,0x746b56,"yard");
  for(let i=0;i<10;i++) placeCylinder(x+rand(-18,18),.9,z+rand(-10,10),.18,1.8,0x8a5d38,"target");
  addSignPost(x,z+18,"TRAINING");
}
function addSuspiciousAlley(x,z){
  addRoad(x,z,10,70,0x3e3830);
  for(let i=0;i<8;i++){
    placeBox(x-6,2.5,z-30+i*8,4,5,7,pick([0x41382f,0x4b3b32,0x3f3f3a]),"alleyHouse");
    placeBox(x+6,2.5,z-30+i*8,4,5,7,pick([0x41382f,0x4b3b32,0x3f3f3a]),"alleyHouse");
  }
  for(let i=0;i<14;i++) addCrateStack(x+rand(-3,3),z+rand(-30,30),Math.floor(rand(2,5)));
  const hood = createPerson({ variant:"priest", color:0x272331 });
  hood.position.set(x,0,z+18);
  hood.userData={ id:"shady_man", kind:"npc", name:"路地裏の男", dialogue:"shady_alley" };
  const label=createLabel("???"); label.scale.set(.9,.24,1); label.position.set(0,2.55,0); hood.add(label);
  scene.add(hood); npcs.push(hood);
}
function addStreetDetails(){
  for(let i=0;i<70;i++){
    const z=rand(-180,180), side=Math.random()<.5?-1:1;
    addLamp(side*10,z);
    if(i%3===0) addCrateStack(side*rand(20,190),rand(-190,190),Math.floor(rand(2,4)));
  }
  for(let i=0;i<18;i++){
    const wellX=rand(-160,160), wellZ=rand(-160,160);
    if(Math.abs(wellX)<24||Math.abs(wellZ)<24) addFountain(wellX,wellZ);
  }
}
function addTree(x,z,s=1,solid=false){
  const g=new THREE.Group(); g.position.set(x,0,z); world.add(g);
  placeCylinder(0,.75*s,0,.18*s,1.5*s,0x5b3a24,"",g);
  const l1=add(new THREE.DodecahedronGeometry(1*s,0),mat(0x2f6f45),g); l1.position.y=1.8*s;
  const l2=add(new THREE.DodecahedronGeometry(.65*s,0),mat(0x3d8a59),g); l2.position.set(.35*s,2.35*s,-.12*s);
  if(solid) addCollider(x,z,.9*s,.9*s,"tree");
}
function addCrateStack(x,z,n){
  for(let i=0;i<n;i++) placeBox(x+(i%2)*.75,.35+Math.floor(i/2)*.38,z+Math.floor(i/2)*.75,.7,.7,.7,0x735334,"crate");
}
function addLamp(x,z){
  placeCylinder(x,1.4,z,.08,2.8,0x3d342f);
  const l=add(new THREE.SphereGeometry(.18,10,8),mat(0xe7c56f,.4,0xe7c56f,.8)); l.position.set(x+.35,2.5,z);
}
function addSignPost(x,z,text){
  placeCylinder(x,.75,z,.08,1.5,0x332315);
  const s=createLabel(text); s.scale.set(1.55,.42,1); s.position.set(x,1.75,z); world.add(s);
}
function addQuestBoard(x,z){
  placeBox(x,1.25,z,.18,2.2,2.2,0x4a301c,"questBoard");
  const l=createLabel("QUEST"); l.scale.set(1.3,.34,1); l.position.set(x+.15,2.55,z); world.add(l);
}
function addTable(x,z){
  placeBox(x,.55,z,2,.35,1.2,0x5a3e28,"table");
  [-.75,.75].forEach(s=>placeBox(x+s,.32,z+.95,.45,.55,.45,0x3e2a1d,"chair"));
}
function addCandle(x,z){
  placeCylinder(x,1.34,z,.06,.42,0xe8e0c9);
  const f=add(new THREE.SphereGeometry(.05,8,8),mat(0xf2cb6b,.3,0xf2cb6b,1)); f.position.set(x,1.62,z);
}
function addBench(x,z){ placeBox(x,.28,z,2.4,.35,.55,0x5d4129,"bench"); }
function addFountain(x,z){
  placeCylinder(x,.4,z,1.8,.8,0x6f7a80,"fountain");
  const water=add(new THREE.CylinderGeometry(1.35,1.35,.08,24),mat(0x69a7d2,.25,0x69a7d2,.12)); water.position.set(x,.85,z);
}
function addMarker(l){
  const c=l.targetMap?0xd8b36b:0x87c7ff;
  const ring=add(new THREE.TorusGeometry(.75,.03,8,32),mat(c,.42,c,.7),world,false,false);
  ring.position.set(l.position.x,.08,l.position.z); ring.rotation.x=Math.PI/2;
  const cone=add(new THREE.ConeGeometry(.18,.9,4),mat(c,.45,c,.55),world,false,false);
  cone.position.set(l.position.x,.85,l.position.z); cone.rotation.y=Math.PI/4;
}
function addInteriorShelves(){
  for(const x of [-6.3,6.3]){
    for(let i=0;i<5;i++){
      placeBox(x,1.0,-3.2+i*1.15,.32,1.7,.8,0x4b3422,"shelf");
      for(let j=0;j<3;j++) placeBox(x*.98,.45+j*.45,-3.2+i*1.15,.18,.18,.5,pick([0x6c8aa6,0x8a6f4b,0x735334]));
    }
  }
}

function addPedestrians(){
  const paths = [
    [[-170,4],[-40,4],[40,4],[170,4]],
    [[4,180],[4,40],[4,-40],[4,-170]],
    [[-70,76],[-110,76],[-150,76],[-150,42]],
    [[76,-115],[120,-80],[160,-70]],
    [[20,-30],[55,-20],[95,15],[125,60]]
  ];
  for(let i=0;i<26;i++){
    const p = createPerson({ variant: pick(["traveler","guild_guide","veteran"]), color: pick([0x7f9fbd,0x8c6f4f,0x6f8aa6,0x8c7b5b,0x9a6f54]) });
    const path = structuredClone(pick(paths));
    const start = path[0];
    p.position.set(start[0]+rand(-2,2),0,start[1]+rand(-2,2));
    scene.add(p);
    movers.push({ type:"ped", object:p, path, index:1, speed:rand(1.2,2.3), wait:rand(0,1) });
  }
}
function addWanderingGuards(){
  for(let i=0;i<4;i++){
    const g=createPerson({variant:"guard",color:0xb77954});
    g.position.set(rand(-6,6),0,rand(-70,55));
    scene.add(g);
    movers.push({ type:"ped", object:g, path:[[rand(-5,5),rand(60,80)],[rand(-5,5),rand(15,20)],[rand(-5,5),rand(-90,-70)]], index:1, speed:1.7, wait:0 });
  }
}
function addTrafficCarts(){
  const routes = [
    [[-180,9],[-60,9],[40,9],[175,9]],
    [[9,178],[9,88],[9,-10],[9,-178]],
    [[-9,-178],[-9,-80],[-9,40],[-9,178]]
  ];
  for(let i=0;i<5;i++){
    const cart=createMovingCart();
    const path=structuredClone(routes[i%routes.length]);
    const start=path[0];
    cart.position.set(start[0],0,start[1]+i*2);
    world.add(cart);
    movers.push({ type:"cart", object:cart, path, index:1, speed:rand(2.0,3.4), wait:0 });
  }
}
function createMovingCart(){
  const g=new THREE.Group();
  placeBox(0,.55,0,2.6,.75,1.5,0x70482c,"",g);
  const horse=createHorse(); horse.position.set(0,0,-1.45); g.add(horse);
  for(const sx of [-1.25,1.25]) for(const sz of [-.65,.65]){
    const w=add(new THREE.TorusGeometry(.34,.07,8,18),mat(0x2c2018),g); w.position.set(sx,.35,sz); w.rotation.y=Math.PI/2;
  }
  return g;
}
function updateMovers(dt){
  for(const m of movers){
    if(m.wait>0){ m.wait-=dt; continue; }
    const target=m.path[m.index];
    if(!target) continue;
    const obj=m.object, dx=target[0]-obj.position.x, dz=target[1]-obj.position.z, dist=Math.hypot(dx,dz);
    if(dist<1.2){ m.index=(m.index+1)%m.path.length; if(m.type==="ped") m.wait=rand(.2,1.4); continue; }
    const vx=dx/dist, vz=dz/dist;
    obj.position.x += vx*m.speed*dt;
    obj.position.z += vz*m.speed*dt;
    obj.rotation.y = Math.atan2(vx,vz);
    if(m.type==="ped") obj.position.y = Math.abs(Math.sin(clock.elapsedTime*5))*0.025;
  }
}

function addCaravanScene(x,z){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=-.22; world.add(g); caravan=g;
  const cart=placeBox(0,.55,0,2.4,.6,1.45,0x6a4328,"",g); cart.rotation.z=questDone("merchant")?.05:-.18;
  const axle=add(new THREE.CylinderGeometry(.08,.08,2.9,10),mat(0x3b2a1d),g); axle.rotation.z=Math.PI/2; axle.position.set(0,.32,0);
  for(const sx of [-1.25,1.25]) for(const sz of [-.66,.66]){ const w=add(new THREE.TorusGeometry(.36,.075,8,18),mat(0x2c2018),g); w.position.set(sx,.35,sz); w.rotation.y=Math.PI/2; }
  for(let i=0;i<10;i++){ const b=placeBox(rand(-.9,.9),.95+Math.floor(i/3)*.33,rand(-.52,.52),.48,.38,.48,pick([0x8c6239,0x6d5237,0x9a7b4d]),"",g); b.rotation.y=rand(-.45,.45); }
  const horse=createHorse(); horse.position.set(-2.15,.05,0); horse.rotation.y=Math.PI/2; g.add(horse);
  merchant=createPerson({id:"merchant",variant:"traveler",color:0x6f8aa6}); merchant.position.set(.78,.06,questDone("merchant")?1.55:1.08); merchant.rotation.z=questDone("merchant")?0:Math.PI/2; merchant.rotation.y=questDone("merchant")?Math.PI:0; g.add(merchant);
  if(!questDone("merchant")){ beast=createBeast(); beast.position.set(2.05,.05,-.55); beast.rotation.y=-Math.PI/2; g.add(beast); } else { const s=createLabel("RESCUED"); s.scale.set(1.25,.34,1); s.position.set(0,1.75,0); g.add(s); }
  addCollider(x,z,4.2,3.4,"caravan");
}
function createHorse(){
  const g=new THREE.Group();
  placeBox(0,.78,0,1.15,.55,.38,0x5b3a28,"",g);
  const neck=placeBox(.5,1.05,0,.25,.55,.22,0x5b3a28,"",g); neck.rotation.z=-.35;
  placeBox(.75,1.25,0,.35,.25,.25,0x5b3a28,"",g);
  for(const x of [-.38,.38]) for(const z of [-.14,.14]) placeBox(x,.34,z,.12,.65,.12,0x3b281d,"",g);
  return g;
}
function createBeast(){
  const g=new THREE.Group();
  placeBox(0,.62,0,.95,.42,.36,0x111015,"",g);
  placeBox(-.58,.72,0,.36,.28,.32,0x09090d,"",g);
  placeBox(-.76,.61,0,.22,.1,.28,0x3a0c0c,"",g);
  for(const x of [-.32,.32]) for(const z of [-.13,.13]) placeBox(x,.28,z,.11,.46,.11,0x09090d,"",g);
  for(const z of [-.09,.09]){ const e=add(new THREE.SphereGeometry(.035,8,6),mat(0xff2a1c,.2,0xff2a1c,1.1),g); e.position.set(-.77,.78,z); }
  const tail=placeCylinder(.57,.72,0,.04,.55,0x0b0b0d,"",g); tail.rotation.z=.8;
  return g;
}
function createBurst(pos,color=0xff7a1c){
  const group=new THREE.Group(); group.position.copy(pos); world.add(group);
  for(let i=0;i<18;i++){ const s=add(new THREE.SphereGeometry(.06,8,6),mat(color,.32,color,1.5),group,false,false); const a=i/18*Math.PI*2; s.userData.vel=new THREE.Vector3(Math.cos(a)*rand(1.4,3.1),rand(.4,1.8),Math.sin(a)*rand(1.4,3.1)); }
  bursts.push({ group, life:.52, max:.52 });
}
function castFireball(mode="action"){
  if(state.castCooldown>0 && mode !== "story") return;
  state.castCooldown = mode==="burst" ? .55 : .28;
  const start=new THREE.Vector3();
  camera.getWorldPosition(start);
  if(state.cameraMode!=="first") start.copy(player.position).add(new THREE.Vector3(0,1.35,0));
  const dir=new THREE.Vector3(); camera.getWorldDirection(dir); dir.normalize();
  const ball=add(new THREE.SphereGeometry(mode==="burst"?.34:.22,16,10),mat(0xff7a1c,.2,0xff5a00,2.2),world,false,false); ball.position.copy(start);
  let target=null;
  if(mode==="story" && beast){ target=new THREE.Vector3(); beast.getWorldPosition(target); target.y=.8; }
  projectiles.push({ mesh:ball, dir, start:start.clone(), target, t:0, speed: mode==="burst"?42:32, life:2.5, mode });
}
function dodge(){
  if(state.inDialogue||!state.started)return;
  state.dodgeTimer=.18;
  const back=new THREE.Vector3(Math.sin(state.yaw),0,Math.cos(state.yaw));
  tryMove(back.x*2.8, back.z*2.8, 0);
  createBurst(player.position.clone().add(new THREE.Vector3(0,.5,0)),0x87c7ff);
}
function updateEffects(dt,t){
  state.castCooldown=Math.max(0,state.castCooldown-dt);
  if(beast&&!questDone("merchant")){ beast.position.x=2.0+Math.sin(t*4.2)*.25; beast.position.y=.05+Math.abs(Math.sin(t*5.2))*.08; beast.rotation.z=Math.sin(t*6)*.1; }
  if(caravan&&!questDone("merchant")) caravan.rotation.z=Math.sin(t*2.6)*.018;
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i]; p.t+=dt; p.life-=dt;
    if(p.target){
      const k=Math.min(1,p.t*1.8); p.mesh.position.lerpVectors(p.start,p.target,k); if(k>=1) projectileHit(p,i);
    } else {
      p.mesh.position.addScaledVector(p.dir,p.speed*dt);
      p.mesh.scale.setScalar(1+Math.sin(t*18)*.18);
      if(beast){ const bp=new THREE.Vector3(); beast.getWorldPosition(bp); if(p.mesh.position.distanceTo(bp)<1.2) projectileHit(p,i); }
      if(p.life<=0 || p.mesh.position.distanceTo(player.position)>100) projectileHit(p,i,false);
    }
  }
  for(let i=bursts.length-1;i>=0;i--){ const b=bursts[i]; b.life-=dt; b.group.scale.setScalar(1+(1-b.life/b.max)*2.2); b.group.children.forEach(s=>s.position.addScaledVector(s.userData.vel,dt)); if(b.life<=0){ world.remove(b.group); bursts.splice(i,1); } }
}
function projectileHit(p,i,explode=true){ if(explode) createBurst(p.mesh.position.clone()); world.remove(p.mesh); projectiles.splice(i,1); if(beast&&explode){ beast.rotation.z=-.45; beast.position.y+=.15; } }

function addNpc(npc){
  const n=createPerson(npc); n.position.set(npc.position.x,0,npc.position.z); n.userData={...npc,kind:"npc"};
  const label=createLabel(npc.name); label.position.set(0,2.55,0); n.add(label);
  scene.add(n); npcs.push(n);
}
function createPlayer(){ return createPerson({ id:"player", variant:"player", color:0x24395d }); }
function createPerson(n){
  const g=new THREE.Group(), v=n.variant||n.id, base=n.color;
  const skin=0xd8ad84, hair=v==="receptionist"?0xf1dbc5:v==="priest"?0xd5cfbc:v==="veteran"?0x7b5b3f:0x2e2218;
  body(g,base,v==="priest"?0xcfc8b4:null);
  head(g,skin,hair,v==="receptionist"?"bun":v==="priest"?"hood":"short");
  limbs(g,base,v==="priest"?0xc7c2b1:0x252d3c,0x39281c,skin);
  if(v==="guard"){ placeBox(0,1,.28,.62,.58,.18,0xa8acb6,"",g); const spear=placeCylinder(-.42,1.05,0,.03,2.2,0x6e5134,"",g); spear.rotation.z=.1; }
  if(v==="receptionist") placeBox(0,.78,.25,.45,.6,.12,0xf1dbc5,"",g);
  if(v==="priest") [-.12,.12].forEach(x=>placeBox(x,.9,.23,.12,.96,.14,0xd5c089,"",g));
  if(v==="guild_guide"){ const sash=placeBox(.18,.92,.23,.15,.92,.14,0xd8b36b,"",g); sash.rotation.z=-.5; }
  return g;
}
function body(g,color,robe){
  placeBox(0,1.02,0,.74,.92,.38,color,"",g);
  if(robe){ const rb=add(new THREE.ConeGeometry(.5,.95,6),mat(robe),g); rb.position.set(0,.55,-.03); rb.rotation.x=Math.PI; }
  else { const cape=placeBox(0,.86,-.31,.62,.55,.12,0x1b2740,"",g); cape.rotation.x=.12; }
  placeBox(0,.74,0,.82,.11,.46,0x8c6740,"",g);
}
function head(g,skin,hair,style){
  placeCylinder(0,1.49,0,.08,.14,skin,"",g);
  add(new THREE.SphereGeometry(.29,20,16),mat(skin),g).position.set(0,1.78,0);
  [[-.1,1.8,.285],[.1,1.8,.285]].forEach(p=>placeBox(p[0],p[1],p[2],.055,.035,.018,0x17223a,"",g));
  if(style==="hood"){ const h=add(new THREE.SphereGeometry(.36,16,12),mat(hair),g); h.scale.set(1.04,.9,1.06); h.position.set(0,1.82,-.04); }
  else {
    const cap=add(new THREE.SphereGeometry(.335,18,12),mat(hair),g); cap.scale.set(1.05,.54,1.03); cap.position.set(0,1.95,-.035);
    [-.17,0,.17].forEach((x,i)=>{ const bang=placeBox(x,1.87,.295,.11,.24,.055,hair,"",g); bang.rotation.z=(i-1)*.18; });
    if(style==="bun") add(new THREE.SphereGeometry(.16,12,10),mat(hair),g).position.set(0,1.95,-.28);
  }
  placeBox(0,1.755,.305,.05,.08,.05,skin,"",g);
}
function limbs(g,sleeve,leg,boot,skin){
  [-1,1].forEach(s=>{ const a=placeBox(s*.46,1.05,0,.17,.52,.17,sleeve,"",g); a.rotation.z=s*.16; add(new THREE.SphereGeometry(.085,10,8),mat(skin),g).position.set(s*.52,.72,.03); placeBox(s*.15,.38,0,.19,.62,.19,leg,"",g); placeBox(s*.15,.07,.08,.22,.16,.34,boot,"",g); });
}

function loop(){
  const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime;
  viewKeys(dt); gamepad(dt); move(dt); updateMovers(dt); updateEffects(dt,t);
  npcs.forEach((n,i)=>{ if(!movers.some(m=>m.object===n)){ n.position.y=Math.sin(t*1.6+i*.8)*.02; n.rotation.y=Math.sin(t*.6+i)*.12; } });
  detect(); cameraUpdate(); renderer.render(scene,camera); requestAnimationFrame(loop);
}
function viewKeys(dt){
  if(!state.started||state.inDialogue)return;
  state.yaw+=((state.keys.has("ArrowLeft")?1:0)-(state.keys.has("ArrowRight")?1:0))*2.25*dt;
  state.pitch=THREE.MathUtils.clamp(state.pitch+((state.keys.has("ArrowUp")?1:0)-(state.keys.has("ArrowDown")?1:0))*1.35*dt,-.55,.75);
}
function pad(){ const ps=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[]; return ps.find(p=>/dualshock|wireless controller|dualsense|playstation/i.test(p.id))||ps[0]||null; }
function dz(v){ return Math.abs(v)<.16?0:v; }
function gamepad(dt){
  state.choiceCooldown=Math.max(0,state.choiceCooldown-dt);
  const p=pad(); if(!p||!state.started)return;
  const now=p.buttons.map(b=>b.pressed), down=i=>now[i]&&!state.padButtons[i];
  if(state.inDialogue){
    const y=dz(p.axes[1]||0);
    if((down(13)||y>.55)&&state.choiceCooldown<=0){ moveChoice(1); state.choiceCooldown=.22; }
    if((down(12)||y<-.55)&&state.choiceCooldown<=0){ moveChoice(-1); state.choiceCooldown=.22; }
    if(down(0)) confirmChoice();
    if(down(1)) closeDialogue();
    state.padButtons=now; return;
  }
  state.yaw-=dz(p.axes[2]||0)*2.8*dt;
  state.pitch=THREE.MathUtils.clamp(state.pitch-dz(p.axes[3]||0)*1.8*dt,-.55,.75);
  if(down(0)&&state.activeTarget) interact();
  if(down(1)) dodge();
  if(down(2)) castFireball("action");
  if(down(3)) castFireball("burst");
  if(down(9)||down(11)) toggleCamera();
  state.padButtons=now;
}
function stick(){
  const p=pad();
  return p?{x:dz(p.axes[0]||0),y:-dz(p.axes[1]||0),dash:(p.buttons[7]?.value||0)>.25||p.buttons[10]?.pressed}:{x:0,y:0,dash:false};
}
function move(dt){
  if(!state.started||state.inDialogue)return;
  const s=stick();
  let x=(state.keys.has("KeyD")?1:0)-(state.keys.has("KeyA")?1:0)+s.x;
  let y=(state.keys.has("KeyW")?1:0)-(state.keys.has("KeyS")?1:0)+s.y;
  if(state.keys.has("KeyJ")){ castFireball("action"); state.keys.delete("KeyJ"); }
  if(state.keys.has("KeyK")){ dodge(); state.keys.delete("KeyK"); }
  if(state.keys.has("KeyL")){ castFireball("burst"); state.keys.delete("KeyL"); }

  const up=(state.debug&&state.keys.has("Space")?1:0)-(state.debug&&(state.keys.has("ControlLeft")||state.keys.has("ControlRight"))?1:0);
  const len=Math.hypot(x,y,up);
  if(len<.01){ regen(dt,24); state.isDashing=false; return; }
  x/=Math.max(1,len); y/=Math.max(1,len);

  state.isDashing=(state.keys.has("ShiftLeft")||state.keys.has("ShiftRight")||s.dash)&&state.player.stamina>2;
  const speed=state.debug?(state.isDashing?72:32):(state.isDashing?8.2:4.6);
  if(!state.debug) state.isDashing?state.player.stamina=Math.max(0,state.player.stamina-30*dt):regen(dt,18);

  const rx=Math.cos(state.yaw), rz=-Math.sin(state.yaw), fx=-Math.sin(state.yaw), fz=-Math.cos(state.yaw);
  const dx=(rx*x+fx*y)*speed*dt, dzv=(rz*x+fz*y)*speed*dt, dy=up*speed*dt;
  tryMove(dx,dzv,dy);
  if(Math.hypot(dx,dzv)>.001) player.rotation.y=Math.atan2(dx,dzv);
  staminaText();
}
function tryMove(dx,dz,dy){
  const nx=THREE.MathUtils.clamp(player.position.x+dx,bounds.minX,bounds.maxX);
  if(state.debug || !isBlocked(nx,player.position.z)) player.position.x=nx;
  const nz=THREE.MathUtils.clamp(player.position.z+dz,bounds.minZ,bounds.maxZ);
  if(state.debug || !isBlocked(player.position.x,nz)) player.position.z=nz;
  player.position.y=state.debug?THREE.MathUtils.clamp(player.position.y+dy,0,90):0;
}
function regen(dt,a){ state.player.stamina=Math.min(state.player.maxStamina,state.player.stamina+a*dt); staminaText(); }
function staminaText(){ if(ui.stat.stamina) ui.stat.stamina.textContent=`${Math.round(state.player.stamina)}/${state.player.maxStamina}`; }
function detect(){
  let near=null,dist=Infinity;
  npcs.forEach(n=>{const d=player.position.distanceTo(n.position); if(d<dist){dist=d;near=n.userData;}});
  locations.forEach(l=>{const d=Math.hypot(player.position.x-l.position.x,player.position.z-l.position.z); if(d<dist){dist=d;near=l;}});
  const r=near?.radius??2.4;
  if(near&&dist<r&&!state.inDialogue&&state.started){state.activeTarget=near;ui.hintText.textContent=near.kind==="npc"?"話す":near.name;ui.hint.classList.remove("is-hidden");}
  else{state.activeTarget=null;ui.hint.classList.add("is-hidden");}
}
function cameraUpdate(){
  const desired=state.isDashing?(state.cameraMode==="first"?72:63):55;
  camera.fov+=(desired-camera.fov)*.12; camera.updateProjectionMatrix();
  const target=new THREE.Vector3(player.position.x,player.position.y+1.08,player.position.z);
  if(state.cameraMode==="first"){
    const eye=new THREE.Vector3(player.position.x,player.position.y+1.55,player.position.z);
    const look=new THREE.Vector3(-Math.sin(state.yaw)*Math.cos(state.pitch),Math.sin(state.pitch),-Math.cos(state.yaw)*Math.cos(state.pitch));
    camera.position.lerp(eye,.45); camera.lookAt(eye.clone().add(look)); player.visible=false; return;
  }
  player.visible=true;
  const radius=state.map==="plaza"?12.5:8.8, base=state.map==="plaza"?7.2:5.8;
  const off=new THREE.Vector3(Math.sin(state.yaw)*radius,base+Math.sin(state.pitch)*5,Math.cos(state.yaw)*radius);
  camera.position.lerp(target.clone().add(off),.12); camera.lookAt(target);
}
function toggleCamera(){ state.cameraMode=state.cameraMode==="third"?"first":"third"; }
function toggleDebug(){ state.debug=!state.debug; updateHud(); }

function getDialogueId(t){
  if(t.id==="wake_point"&&questDone("wake"))return"wake_after";
  if(t.id==="caravan_site"){ if(questDone("merchant"))return"caravan_after"; if(questDone("caravan"))return"caravan_retreat_after"; }
  if(t.id==="receptionist"&&questDone("register"))return"reception_after";
  if(t.id==="priest"&&questDone("church"))return"priest_after";
  return t.dialogue;
}
function interact(){
  const t=state.activeTarget; if(!t)return;
  if(t.targetMap){ if(t.id==="guild_door") markDone(["guild"]); loadMap(t.targetMap,t.spawn); return; }
  const id=getDialogueId(t); if(id) openDialogue(id);
}
function openDialogue(id){
  state.dialogueId=id; state.dialogueLine=0; state.selectedChoice=0; state.inDialogue=true;
  if(id==="street_attack_start") state.yaw=-.2;
  if(id==="fireball_first") castFireball("story");
  ui.choices.innerHTML=""; ui.dialog.classList.remove("is-hidden"); ui.hint.classList.add("is-hidden"); renderDialogue();
}
function closeDialogue(){ state.inDialogue=false; state.dialogueId=null; ui.dialog.classList.add("is-hidden"); }
function cur(){ return data.dialogues[state.dialogueId]||extraDialogues[state.dialogueId]; }
function renderDialogue(){
  const d=cur(); if(!d)return closeDialogue();
  ui.speaker.textContent=d.speaker||""; ui.line.textContent=d.lines[state.dialogueLine]||""; ui.choices.innerHTML="";
  if(state.dialogueLine>=d.lines.length-1&&d.choices) d.choices.forEach((c,i)=>{ const b=document.createElement("button"); b.type="button"; b.textContent=c.text; b.classList.toggle("is-selected",i===state.selectedChoice); b.onclick=()=>choice(c); ui.choices.appendChild(b); });
}
function advanceDialogue(){ const d=cur(); if(!d)return; if(state.dialogueLine<d.lines.length-1){ state.dialogueLine++; state.selectedChoice=0; renderDialogue(); } else if(d.choices?.length) confirmChoice(); else closeDialogue(); }
function moveChoice(delta){ const d=cur(); if(!d?.choices?.length||state.dialogueLine<d.lines.length-1)return; state.selectedChoice=(state.selectedChoice+delta+d.choices.length)%d.choices.length; renderDialogue(); }
function confirmChoice(){ const d=cur(); if(!d?.choices?.length||state.dialogueLine<d.lines.length-1){ advanceDialogue(); return; } choice(d.choices[state.selectedChoice]||d.choices[0]); }
function choice(c){
  if(c.stat) Object.entries(c.stat).forEach(([k,v])=>state.player[k]=Number(state.player[k]||0)+Number(v));
  if(c.set) Object.entries(c.set).forEach(([p,v])=>setDeep(p,v));
  if(c.objective)setObjective(c.objective);
  if(c.done)markDone(c.done);
  if(c.to==="fireball_first")castFireball("story");
  updateHud();
  if(c.targetMap){ closeDialogue(); loadMap(c.targetMap,c.spawn||{x:0,z:0}); return; }
  if(c.to){ state.dialogueId=c.to; state.dialogueLine=0; state.selectedChoice=0; renderDialogue(); } else closeDialogue();
}
function setObjective(t){ data.objective=t; ui.objective.textContent=t; }
function markDone(ids){ ids.forEach(id=>{ const q=state.quest.find(x=>x.id===id); if(q)q.done=true; }); if(ids.includes("merchant")) resolveCaravan(); renderQuests(); }
function resolveCaravan(){ if(beast) beast.visible=false; if(merchant){ merchant.rotation.set(0,Math.PI,0); merchant.position.set(.78,.06,1.55); } }
function setDeep(path,val){ const ks=path.split("."); let t=state; while(ks.length>1){ const k=ks.shift(); t[k]??={}; t=t[k]; } t[ks[0]]=val; }
function updateHud(){ const m=data.maps[state.map]; ui.stat.name.textContent=state.player.name; ui.stat.hp.textContent=`${state.player.hp}/${state.player.maxHp}`; ui.stat.mp.textContent=`${state.player.mp}/${state.player.maxMp}`; staminaText(); ui.stat.rank.textContent=state.player.rank; ui.stat.contract.textContent=state.player.contract; ui.objective.textContent=(state.debug?"[DEBUG FLY] ":"")+(data.objective||""); ui.area.textContent=m.name; ui.map.textContent=m.minimap; renderQuests(); }
function renderQuests(){ ui.quests.innerHTML=""; state.quest.forEach(q=>{ const li=document.createElement("li"); li.textContent=q.text; if(q.done)li.classList.add("done"); ui.quests.appendChild(li); }); }
function createLabel(text){
  const c=document.createElement("canvas"),x=c.getContext("2d"); c.width=512;c.height=128;
  x.fillStyle="rgba(10,12,18,.72)"; round(x,12,20,488,88,18); x.fill();
  x.strokeStyle="rgba(216,179,107,.75)"; x.lineWidth=4; round(x,12,20,488,88,18); x.stroke();
  x.fillStyle="#f6efe1"; x.font="bold 38px sans-serif"; x.textAlign="center"; x.textBaseline="middle"; x.fillText(text,256,64);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true})); s.scale.set(2.4,.6,1); return s;
}
function round(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

ui.start.onclick=()=>{ state.started=true; ui.title.classList.add("is-hidden"); };
addEventListener("keydown",e=>{
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();
  if(e.code==="Backquote"||e.code==="F3"){ e.preventDefault(); return toggleDebug(); }
  if(state.inDialogue){
    if(e.code==="ArrowDown")return moveChoice(1);
    if(e.code==="ArrowUp")return moveChoice(-1);
    if(e.code==="Escape")return closeDialogue();
    if(e.code==="Enter"||e.code==="Space"){e.preventDefault();return advanceDialogue();}
  }
  if(e.code==="KeyF")return toggleCamera();
  if(e.code==="KeyE"&&state.activeTarget)return interact();
  state.keys.add(e.code);
});
addEventListener("keyup",e=>state.keys.delete(e.code));
ui.canvas.addEventListener("pointerdown",e=>{state.dragging=true;state.lastX=e.clientX;state.lastY=e.clientY;});
addEventListener("pointerup",()=>state.dragging=false);
addEventListener("pointermove",e=>{
  if(!state.dragging||state.inDialogue)return;
  state.yaw-=(e.clientX-state.lastX)*.006;
  state.pitch=THREE.MathUtils.clamp(state.pitch-(e.clientY-state.lastY)*.004,-.55,.75);
  state.lastX=e.clientX; state.lastY=e.clientY;
});
addEventListener("resize",()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
