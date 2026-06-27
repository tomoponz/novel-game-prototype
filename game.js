import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $ = (id) => document.getElementById(id);
const data = window.GAME_DATA;
const ui = {
  canvas: $("game-canvas"), loading: $("loading"), title: $("title-screen"), start: $("start-btn"),
  hint: $("interact-hint"), hintText: $("interact-text"), dialog: $("dialogue"),
  speaker: $("speaker"), line: $("line"), choices: $("choices"), objective: $("objective"),
  area: $("area-name"), map: $("mini-map-text"), quests: $("quest-list"),
  stat: { name: $("stat-name"), hp: $("stat-hp"), mp: $("stat-mp"), rank: $("stat-rank"), contract: $("stat-contract") }
};

const state = {
  player: structuredClone(data.player), quest: structuredClone(data.quests), currentMap: "plaza",
  keys: new Set(), yaw: 0, pitch: 0.08, cameraMode: "third", dragging: false, lastX: 0, lastY: 0, started: false,
  activeTarget: null, inDialogue: false, dialogueId: null, dialogueLine: 0,
  gamepadButtons: []
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const clock = new THREE.Clock();
const world = new THREE.Group();
scene.add(world);
const player = createPlayer();
scene.add(player);
let npcs = [], locations = [], bounds = { minX: -17, maxX: 17, minZ: -17, maxZ: 17 };

initLights();
loadMap("plaza", { x: 0, z: 5.8 });
updateHud();
setTimeout(() => ui.loading.classList.add("is-hidden"), 350);
requestAnimationFrame(loop);

function initLights() {
  scene.add(new THREE.HemisphereLight(0xf8efde, 0x243244, 2.6));
  const sun = new THREE.DirectionalLight(0xfff0ce, 2.9);
  sun.position.set(12, 18, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { near: .5, far: 70, left: -26, right: 26, top: 26, bottom: -26 });
  scene.add(sun);
}

function loadMap(mapId, spawn) {
  state.currentMap = mapId;
  world.clear();
  for (const npc of npcs) scene.remove(npc);
  npcs = []; locations = [];
  ({ plaza: buildPlaza, guildHall: buildGuildHall, church: buildChurch }[mapId])();
  const mapData = data.maps[mapId];
  mapData.npcs.forEach(addNpc);
  locations = mapData.locations.map((loc) => ({ ...loc, kind: loc.targetMap ? "door" : "spot" }));
  player.position.set(spawn.x, 0, spawn.z);
  player.rotation.y = 0;
  updateHud();
}

function setEnvironment(bg, near, far) {
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, near, far);
}

function buildPlaza() {
  setEnvironment(0x8fb5ca, 18, 46);
  bounds = { minX: -17, maxX: 17, minZ: -17, maxZ: 17 };
  addGround(42, 0x526653);
  addRoundPlaza(8.1, 0x817969);
  scatterStones(120, 7.8);
  addRoad(0, -12, 4.6, 18); addRoad(-11, 0, 18, 4.2); addRoad(11, 0, 18, 4.2);
  addHouse({ name: "冒険者ギルド", x: 0, z: -12.2, w: 6.4, d: 4.6, h: 4.5, wall: 0x6a5036, roof: 0x3b2a1e, trim: 0xab8b58, type: "guild" });
  addHouse({ name: "教会", x: -10.5, z: -6.5, w: 4.8, d: 4.5, h: 5.8, wall: 0x7c7a76, roof: 0x353948, trim: 0xd9c693, type: "church" });
  addHouse({ name: "市場", x: 10.5, z: -5.8, w: 5.8, d: 3.8, h: 3.5, wall: 0x8d6542, roof: 0x742831, trim: 0xd2b57e, type: "market" });
  addHouse({ name: "宿屋", x: -11.5, z: 6.5, w: 5.4, d: 4.0, h: 3.8, wall: 0x6b4e3b, roof: 0x2c4256, trim: 0xc7a168, type: "inn" });
  addHouse({ name: "倉庫", x: 10.5, z: 6.8, w: 5.4, d: 3.8, h: 3.4, wall: 0x595a56, roof: 0x242833, trim: 0x8c7b5b, type: "warehouse" });
  [[-4.8,-4.1],[4.9,-4.2],[-4.8,5.3],[4.9,5.4]].forEach(([x,z])=>addLampPost(x,z));
  addMarketStalls(); addTrees(); addWell(0,1.1); addCrates(8.5,5.2,5); addBarrels(-8.2,7.1,3);
}

function buildGuildHall() {
  setEnvironment(0x1f1711, 12, 28);
  bounds = { minX: -7.5, maxX: 7.5, minZ: -6.8, maxZ: 7.2 };
  addRoom(16, 15, 3.2, 0x4c3727, 0x3a281c, 0x5b402b, 6);
  mesh(new THREE.BoxGeometry(6.4,1.1,.9), mat(0x6b4a2f,.82)).at(0,.55,-4.5,true);
  mesh(new THREE.BoxGeometry(5.6,2.4,.5), mat(0x5a3d27,.8)).at(0,1.2,-6.2,true);
  for (let i=-2;i<=2;i++) mesh(new THREE.CylinderGeometry(.08,.1,.48,8), mat(0x6c8aa6,.45,0x25465c,.12)).at(i*.85,1.95,-5.95);
  addSignBoard(0,-5.4,"RECEPTION"); addQuestBoard(-5.6,-4.4); addTable(-3.4,1.4); addTable(3.6,1.2); addCrates(5.6,4.4,4); addBarrels(6,-1.8,2);
  mesh(new THREE.BoxGeometry(4.2,.03,8.6), mat(0x652b2d,.94)).at(0,.05,1.7,false,true);
  addWallLantern(-6.8,-2,0); addWallLantern(6.8,-2,Math.PI);
}

function buildChurch() {
  setEnvironment(0x151823, 12, 28);
  bounds = { minX: -6.7, maxX: 6.7, minZ: -6.2, maxZ: 6.8 };
  addRoom(14,14,4,0x5b5a55,0x44434a,0x6a604b,5);
  mesh(new THREE.BoxGeometry(3.8,1.05,1.25), mat(0xddd1ae,.86)).at(0,.55,-4.4,true);
  mesh(new THREE.BoxGeometry(3.1,.08,.95), mat(0xf2e5c0,.72)).at(0,1.1,-4.4);
  mesh(new THREE.CylinderGeometry(.18,.24,1.6,12), mat(0xd8b36b,.5,0xd8b36b,.7)).at(0,1.65,-4.35);
  [[-1,-4.15],[1,-4.15],[-.55,-3.85],[.55,-3.85]].forEach(([x,z])=>addCandle(x,z));
  for (let i=0;i<4;i++){ addBench(-2.6,-1.2+i*1.45); addBench(2.6,-1.2+i*1.45); }
  addSignBoard(0,-5.4,"ALTAR");
  [[-6.85,-2.6,Math.PI/2],[6.85,-2.6,-Math.PI/2],[-6.85,1.8,Math.PI/2],[6.85,1.8,-Math.PI/2]].forEach(v=>addStainedWindow(...v));
}

function addGround(size, color) { mesh(new THREE.PlaneGeometry(size,size), mat(color,.95)).rot(-Math.PI/2,0,0).at(0,0,0,false,true); }
function addRoundPlaza(r, color) { mesh(new THREE.CircleGeometry(r,48), mat(color,.98)).rot(-Math.PI/2,0,0).at(0,.014,0,false,true); }
function addRoad(x,z,w,d){ mesh(new THREE.BoxGeometry(w,.04,d), mat(0x6e6657,1)).at(x,.03,z,false,true); }
function scatterStones(n,r){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2,s=Math.sqrt(Math.random())*r; mesh(new THREE.BoxGeometry(rand(.35,1),.03,rand(.22,.6)), mat(0x9a927f,1)).rot(0,rand(0,Math.PI),0).at(Math.cos(a)*s,.04,Math.sin(a)*s,false,true);} }

function addRoom(w,d,h,floorColor,wallColor,beamColor,beams){
  mesh(new THREE.BoxGeometry(w,.12,d), mat(floorColor,.9)).at(0,-.02,0,false,true);
  [[0,-(d/2+.1),w,.35],[0,0,.35,d], [0,0,.35,d], [-(w/2+.1),0,.35,d], [w/2+.1,0,.35,d], [-(w*.3),d/2+.1,w*.4,.35], [w*.3,d/2+.1,w*.4,.35]]
    .forEach(([x,z,ww,dd],idx)=>{ if(idx===2) return; mesh(new THREE.BoxGeometry(ww,h,dd), mat(wallColor,.9)).at(x,h/2,z,true,true); });
  for(let i=0;i<beams;i++) mesh(new THREE.BoxGeometry(w-.8,.24,.26), mat(beamColor,.88)).at(0,h-.3,-(d/2)+1+i*((d-2)/(Math.max(beams-1,1))),true);
}

function addHouse(o){
  const g=new THREE.Group(); g.position.set(o.x,0,o.z);
  const add=(geo,matr,x,y,z,rx=0,ry=0,rz=0,shadow=true)=>{ const m=new THREE.Mesh(geo,matr); m.position.set(x,y,z); m.rotation.set(rx,ry,rz); m.castShadow=shadow; m.receiveShadow=true; g.add(m); return m; };
  add(new THREE.BoxGeometry(o.w+.3,.35,o.d+.3), mat(0x54483a,.94), 0,.18,0,0,0,0,false);
  add(new THREE.BoxGeometry(o.w,o.h,o.d), mat(o.wall,.88), 0,o.h/2+.18,0);
  add(new THREE.ConeGeometry(Math.max(o.w,o.d)*.82,2.1,4), mat(o.roof,.84), 0,o.h+1.18,0,0,Math.PI/4,0);
  add(new THREE.BoxGeometry(o.w+.25,.24,o.d+.25), mat(o.trim,.72), 0,o.h-.15,0);
  add(new THREE.BoxGeometry(1.25,1.9,.12), mat(0x231810,.9), 0,1.08,o.d/2+.1,0,0,0,false);
  add(new THREE.BoxGeometry(2.05,.12,.9), mat(o.trim,.72), 0,2.35,o.d/2+.5);
  [-o.w*.28,o.w*.28].forEach(x=>[1.7,2.7].forEach(y=>{ if(Math.abs(x)<.8&&y<2) return; add(new THREE.BoxGeometry(.72,.92,.1), mat(o.trim,.6), x,y,o.d/2+.07,0,0,0,false); add(new THREE.BoxGeometry(.52,.72,.05), mat(o.type==="church"?0x8cb8d9:0x89a8bd,.32,0x35546b,.22), x,y,o.d/2+.11,0,0,0,false); }));
  if(o.type==="guild"){
    [-1.9,1.9].forEach((x,i)=>{ add(new THREE.CylinderGeometry(.03,.03,.72,8), mat(0x2e2217,.8), x,2.4,o.d/2+.18,0,0,Math.PI/2,false); add(new THREE.BoxGeometry(.5,1,.04), mat(i?0x7f2a2f:0x234a78,.82), x,1.85,o.d/2+.22); });
    for(let i=0;i<3;i++) add(new THREE.BoxGeometry(2.4-i*.25,.18,.55), mat(0x7b6d58,.98), 0,.1+i*.18,o.d/2+.8+i*.18,0,0,0,false);
    add(new THREE.CylinderGeometry(.42,.42,.12,6), mat(0xab8b58,.55), 0,3.15,o.d/2+.24,Math.PI/2,0,0,false);
  }
  if(o.type==="church"){
    add(new THREE.ConeGeometry(1.1,3.3,4), mat(0x323742,.82), 0,o.h+3,0); add(new THREE.BoxGeometry(.08,.72,.08), mat(0xd6c181,.5,0xd6c181,.25), 0,o.h+4.6,0,false); add(new THREE.BoxGeometry(.42,.08,.08), mat(0xd6c181,.5,0xd6c181,.25), 0,o.h+4.8,0,false);
  }
  if(o.type==="market"){
    add(new THREE.BoxGeometry(2.9,.14,1.2), mat(0xb43d46,.82), 0,2.1,o.d/2+.48,.2,0,0); [-1.5,1.3].forEach(x=>addCratesToGroup(g,x,o.d/2+1.15));
  }
  if(o.type==="inn"){
    const s=createLabelSprite("INN"); s.scale.set(1.2,.34,1); s.position.set(-2.2,2.7,o.d/2+.18); g.add(s); add(new THREE.BoxGeometry(.48,1.5,.48), mat(0x605449,.9), 1.2,o.h+1,-.6);
  }
  if(o.type==="warehouse") [-1.8,1.1].forEach(x=>addCratesToGroup(g,x,o.d/2+1.05));
  const label=createLabelSprite(o.name); label.position.set(0,o.h+2.6,o.d/2+.2); g.add(label); world.add(g);
}
function addCratesToGroup(g,x,z){ for(let i=0;i<3;i++){ const c=new THREE.Mesh(new THREE.BoxGeometry(.52,.52,.52), mat(0x7a5a38,.88)); c.position.set(x+(i%2)*.52,.45+Math.floor(i/2)*.32,z+Math.floor(i/2)*.45); c.castShadow=true; g.add(c);} }

function addMarketStalls(){ const cols=[0xb43d46,0x2f6f9f,0xd8b36b,0x3f815a]; for(let i=0;i<4;i++){ const g=new THREE.Group(); g.position.set(6.7+i*1.65,0,-1.9+(i%2)*1.6); const t=new THREE.Mesh(new THREE.BoxGeometry(1.2,.5,.8), mat(0x6a4d35,.8)); t.position.y=.25; t.castShadow=true; g.add(t); const roof=new THREE.Mesh(new THREE.BoxGeometry(1.55,.08,1.1), mat(cols[i%cols.length],.8)); roof.position.y=1.3; roof.rotation.z=(i%2?-1:1)*.08; roof.castShadow=true; g.add(roof); [0xbf5545,0xd8b36b,0x5f9056].forEach((c,j)=>{ const item=new THREE.Mesh(new THREE.DodecahedronGeometry(.12,0), mat(c,.85)); item.position.set(-.25+j*.25,.58,(j%2)*.08); g.add(item); }); world.add(g);} }
function addTrees(){ [[-7.5,4.2],[-6.8,-2.2],[7.2,3.4],[5.7,7.2],[-15,-1.8],[15,2.3],[-3.2,10.5],[3.2,10.8]].forEach(([x,z])=>{ const g=new THREE.Group(); g.position.set(x,0,z); const tr=new THREE.Mesh(new THREE.CylinderGeometry(.22,.32,1.7,8), mat(0x5b3a24,.9)); tr.position.y=.85; tr.castShadow=true; g.add(tr); [[1.15,1.95,0,0],[.72,2.5,.45,-.1]].forEach(([s,y,xx,zz],i)=>{ const lf=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0), mat(i?0x3d8a59:0x2f6f45,.92)); lf.position.set(xx,y,zz); lf.castShadow=true; g.add(lf); }); world.add(g); }); }
function addLampPost(x,z){ mesh(new THREE.CylinderGeometry(.07,.09,2.8,10), mat(0x3d342f,.9)).at(x,1.4,z,true); mesh(new THREE.BoxGeometry(.65,.08,.08), mat(0x3d342f,.9)).at(x+.3,2.6,z,true); mesh(new THREE.SphereGeometry(.18,10,8), mat(0xe7c56f,.4,0xe7c56f,.8)).at(x+.6,2.5,z,false); }
function addWallLantern(x,z,ry){ mesh(new THREE.BoxGeometry(.16,.6,.16), mat(0x4f412f,.8)).rot(0,ry,0).at(x,2,z); mesh(new THREE.SphereGeometry(.18,10,8), mat(0xe7c56f,.4,0xe7c56f,.85)).at(x*.97,1.95,z,false); }
function addWell(x,z){ mesh(new THREE.CylinderGeometry(.75,.85,.75,16), mat(0x6f6b63,1)).at(x,.38,z,true,true); mesh(new THREE.ConeGeometry(.95,.8,6), mat(0x654d39,.84)).at(x,1.75,z,true); }
function addCrates(x,z,n){ for(let i=0;i<n;i++) mesh(new THREE.BoxGeometry(.7,.7,.7), mat(0x735334,.86)).rot(0,rand(-.2,.2),0).at(x+(i%2)*.8,.35+Math.floor(i/2)*.38,z+Math.floor(i/2)*.75,true); }
function addBarrels(x,z,n){ for(let i=0;i<n;i++) mesh(new THREE.CylinderGeometry(.24,.27,.62,10), mat(0x6c4b2e,.85)).at(x+i*.55,.31,z+(i%2)*.18,true); }
function addQuestBoard(x,z){ mesh(new THREE.BoxGeometry(.18,2.2,2.2), mat(0x4a301c,.88)).at(x,1.25,z,true); const l=createLabelSprite("QUEST"); l.scale.set(1.3,.34,1); l.position.set(x+.15,2.55,z); world.add(l); }
function addTable(x,z){ mesh(new THREE.BoxGeometry(2,.35,1.2), mat(0x5a3e28,.85)).at(x,.55,z,true); [-.75,.75].forEach(s=>mesh(new THREE.BoxGeometry(.45,.55,.45), mat(0x3e2a1d,.85)).at(x+s,.32,z+.95,true)); mesh(new THREE.CylinderGeometry(.08,.09,.2,8), mat(0xdac8a3,.5)).at(x+.2,.82,z-.1,false); }
function addCandle(x,z){ mesh(new THREE.CylinderGeometry(.06,.07,.42,10), mat(0xe8e0c9,.65)).at(x,1.34,z,false); mesh(new THREE.SphereGeometry(.05,8,8), mat(0xf2cb6b,.3,0xf2cb6b,1)).at(x,1.62,z,false); }
function addBench(x,z){ mesh(new THREE.BoxGeometry(2.4,.35,.55), mat(0x5d4129,.85)).at(x,.28,z,true); }
function addStainedWindow(x,z,ry){ mesh(new THREE.BoxGeometry(.12,1.7,1.05), mat(0x85775e,.82)).rot(0,ry,0).at(x,2.1,z,false); mesh(new THREE.BoxGeometry(.05,1.45,.78), mat(0x7f9fc0,.32,0x4f6f9b,.3)).rot(0,ry,0).at(x*.995,2.1,z,false); }
function addSignBoard(x,z,text){ mesh(new THREE.CylinderGeometry(.08,.08,1.5,8), mat(0x332315,.85)).at(x,.75,z,true); const s=createLabelSprite(text); s.scale.set(1.5,.42,1); s.position.set(x,1.75,z); world.add(s); }

function addNpc(npcData){ const npc=createNpc(npcData); npc.position.set(npcData.position.x,0,npcData.position.z); npc.userData={...npcData,kind:"npc"}; const label=createLabelSprite(npcData.name); label.position.set(0,2.5,0); npc.add(label); scene.add(npc); npcs.push(npc); }
function createPlayer(){ const g=new THREE.Group(); addBody(g,0x24395d,0x1b2740); addHead(g,0xd9b58e,0x2e2218,"short"); addLimbs(g,0x24395d,0x1c2334,0x3b2819,0xd9b58e); mesh(new THREE.BoxGeometry(.22,.32,.16), mat(0x6e5134,.86)).at(-.34,.68,.18,true,g); return g; }
function createNpc(n){ const g=new THREE.Group(), v=n.variant||n.id, base=n.color, hair=v==="receptionist"?0xf1dbc5:v==="priest"?0xd5cfbc:v==="veteran"?0x7b5b3f:0x87654b; addBody(g,base,v==="priest"?0xcfc8b4:null); addHead(g,0xd6ad83,hair,v==="receptionist"?"bun":v==="priest"?"hood":"short"); addLimbs(g,base,v==="priest"?0xc7c2b1:0x352c2b,0x39281c,0xd6ad83); if(v==="guard"){ mesh(new THREE.BoxGeometry(.62,.58,.18), mat(0xa8acb6,.42)).at(0,1,.28,true,g); mesh(new THREE.CylinderGeometry(.03,.03,2.2,8), mat(0x6e5134,.85)).rot(0,0,.1).at(-.42,1.05,0,false,g); mesh(new THREE.ConeGeometry(.08,.24,5), mat(0xc0c3ca,.4)).rot(0,0,.1).at(-.53,2.08,0,false,g);} if(v==="guild_guide") mesh(new THREE.BoxGeometry(.15,.92,.14), mat(0xd8b36b,.6)).rot(0,0,-.5).at(.18,.92,.23,false,g); if(v==="receptionist") mesh(new THREE.BoxGeometry(.45,.6,.12), mat(0xf1dbc5,.5)).at(0,.78,.25,false,g); if(v==="veteran") mesh(new THREE.BoxGeometry(.26,.22,.42), mat(0x8a8d94,.42)).at(.34,1.18,.05,false,g); if(v==="priest"){ mesh(new THREE.ConeGeometry(.52,1.2,6), mat(0xcfc8b4,.78)).rot(Math.PI,0,0).at(0,.62,-.02,false,g); [-.12,.12].forEach(x=>mesh(new THREE.BoxGeometry(.12,.96,.14), mat(0xd5c089,.45)).at(x,.9,.23,false,g)); } return g; }
function addBody(g,color,robeColor){ mesh(new THREE.BoxGeometry(.75,1,.42), mat(color,.74)).at(0,.98,0,true,g); mesh(new THREE.ConeGeometry(.52,1.18,6), mat(robeColor||0x1b2740,.8)).rot(Math.PI,0,0).at(0,.7,-.12,true,g); mesh(new THREE.BoxGeometry(.8,.12,.46), mat(0x8c6740,.82)).at(0,.72,0,false,g); }
function addHead(g,skin,hair,style){ mesh(new THREE.CylinderGeometry(.08,.08,.12,10), mat(skin,.75)).at(0,1.5,0,false,g); mesh(new THREE.SphereGeometry(.29,18,14), mat(skin,.82)).at(0,1.78,0,true,g); if(style==="short") mesh(new THREE.SphereGeometry(.31,14,10), mat(hair,.9)).scl(1,.72,1).at(0,1.84,-.03,true,g); if(style==="bun"){ mesh(new THREE.SphereGeometry(.3,14,10), mat(hair,.9)).scl(1,.68,1).at(0,1.82,-.03,true,g); mesh(new THREE.SphereGeometry(.12,10,10), mat(hair,.9)).at(0,1.93,-.22,false,g);} if(style==="hood") mesh(new THREE.SphereGeometry(.34,14,10), mat(hair,.88)).scl(1.02,.82,1.02).at(0,1.8,-.02,true,g); mesh(new THREE.BoxGeometry(.05,.08,.05), mat(skin,.72)).at(0,1.76,.27,false,g); }
function addLimbs(g,sleeve,leg,boot,skin){ [-1,1].forEach(s=>{ mesh(new THREE.BoxGeometry(.18,.58,.18), mat(sleeve,.78)).rot(0,0,s*.16).at(s*.46,1.02,0,true,g); mesh(new THREE.SphereGeometry(.09,10,8), mat(skin,.8)).at(s*.52,.62,.02,false,g); mesh(new THREE.BoxGeometry(.2,.7,.2), mat(leg,.82)).at(s*.14,.25,0,true,g); mesh(new THREE.BoxGeometry(.22,.18,.34), mat(boot,.86)).at(s*.14,-.16,.07,true,g); }); }

function loop(){ const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime; handleViewInput(dt); handleGamepad(dt); movePlayer(dt); npcs.forEach((n,i)=>{ n.position.y=Math.sin(t*1.6+i*.8)*.02; n.rotation.y=Math.sin(t*.6+i)*.12; }); detectTarget(); updateCamera(); renderer.render(scene,camera); requestAnimationFrame(loop); }
function handleViewInput(dt){
  if(!state.started || state.inDialogue) return;
  const turn = (state.keys.has("ArrowLeft") ? 1 : 0) - (state.keys.has("ArrowRight") ? 1 : 0);
  const look = (state.keys.has("ArrowUp") ? 1 : 0) - (state.keys.has("ArrowDown") ? 1 : 0);
  state.yaw += turn * 2.25 * dt;
  state.pitch = THREE.MathUtils.clamp(state.pitch + look * 1.35 * dt, -0.45, 0.65);
}

function handleGamepad(dt){
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const pad = pads.find(p => /dualshock|wireless controller|dualsense|playstation/i.test(p.id)) || pads[0];
  if(!pad || !state.started) return;

  const rx = deadzone(pad.axes[2] ?? 0);
  const ry = deadzone(pad.axes[3] ?? 0);
  if(!state.inDialogue){
    state.yaw -= rx * 2.8 * dt;
    state.pitch = THREE.MathUtils.clamp(state.pitch - ry * 1.8 * dt, -0.45, 0.65);
  }

  const pressed = pad.buttons.map(b => b.pressed);
  const down = (i) => pressed[i] && !state.gamepadButtons[i];

  if(down(0)){
    if(state.inDialogue) advanceDialogue();
    else if(state.activeTarget) interact();
  }
  if(down(1) && state.inDialogue) closeDialogue();
  if(down(3)) toggleCameraMode();
  if(down(9) && !state.inDialogue) toggleCameraMode();

  state.gamepadButtons = pressed;
}

function getGamepadMove(){
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const pad = pads.find(p => /dualshock|wireless controller|dualsense|playstation/i.test(p.id)) || pads[0];
  if(!pad) return { x: 0, y: 0 };
  return { x: deadzone(pad.axes[0] ?? 0), y: -deadzone(pad.axes[1] ?? 0) };
}

function deadzone(v){ return Math.abs(v) < 0.16 ? 0 : v; }

function movePlayer(dt){
  if(!state.started||state.inDialogue) return;

  const stick = getGamepadMove();
  let x = (state.keys.has("KeyD") ? 1 : 0) - (state.keys.has("KeyA") ? 1 : 0) + stick.x;
  let y = (state.keys.has("KeyW") ? 1 : 0) - (state.keys.has("KeyS") ? 1 : 0) + stick.y;
  const len = Math.hypot(x, y);
  if(len < 0.01) return;
  x /= Math.max(1, len);
  y /= Math.max(1, len);

  const rightX = Math.cos(state.yaw);
  const rightZ = -Math.sin(state.yaw);
  const forwardX = -Math.sin(state.yaw);
  const forwardZ = -Math.cos(state.yaw);
  const dx = rightX * x + forwardX * y;
  const dz = rightZ * x + forwardZ * y;

  player.position.x = THREE.MathUtils.clamp(player.position.x + dx * 4.2 * dt, bounds.minX, bounds.maxX);
  player.position.z = THREE.MathUtils.clamp(player.position.z + dz * 4.2 * dt, bounds.minZ, bounds.maxZ);
  player.rotation.y = Math.atan2(dx, dz);
}
function detectTarget(){ let near=null, dist=Infinity; npcs.forEach(n=>{ const d=player.position.distanceTo(n.position); if(d<dist){dist=d; near=n.userData;}}); locations.forEach(l=>{ const d=Math.hypot(player.position.x-l.position.x,player.position.z-l.position.z); if(d<dist){dist=d; near=l;}}); const r=near?.radius??2.2; if(near&&dist<r&&!state.inDialogue&&state.started){ state.activeTarget=near; ui.hintText.textContent=near.kind==="npc"?"話す":near.name; ui.hint.classList.remove("is-hidden"); } else { state.activeTarget=null; ui.hint.classList.add("is-hidden"); } }
function updateCamera(){
  const target = new THREE.Vector3(player.position.x, player.position.y + 1.08, player.position.z);
  if(state.cameraMode === "first"){
    const eye = new THREE.Vector3(player.position.x, player.position.y + 1.55, player.position.z);
    const look = new THREE.Vector3(-Math.sin(state.yaw) * Math.cos(state.pitch), Math.sin(state.pitch), -Math.cos(state.yaw) * Math.cos(state.pitch));
    camera.position.lerp(eye, .35);
    camera.lookAt(eye.clone().add(look));
    player.visible = false;
    return;
  }

  player.visible = true;
  const radius = state.currentMap === "plaza" ? 8.8 : 6.8;
  const baseHeight = state.currentMap === "plaza" ? 5.8 : 4.8;
  const vertical = baseHeight + Math.sin(state.pitch) * 4.2;
  const horizontal = radius * Math.cos(state.pitch * .65);
  const offset = new THREE.Vector3(Math.sin(state.yaw) * horizontal, vertical, Math.cos(state.yaw) * horizontal);
  camera.position.lerp(target.clone().add(offset), .12);
  camera.lookAt(target);
}

function toggleCameraMode(){
  state.cameraMode = state.cameraMode === "third" ? "first" : "third";
}

function interact(){ const t=state.activeTarget; if(!t) return; if(t.targetMap){ if(t.id==="guild_door") markDone(["guild"]); if(t.targetMap==="guildHall") setObjective("受付で登録条件を聞く"); loadMap(t.targetMap,t.spawn); return; } if(t.dialogue) openDialogue(t.dialogue); }
function openDialogue(id){ state.dialogueId=id; state.dialogueLine=0; state.inDialogue=true; ui.choices.innerHTML=""; ui.dialog.classList.remove("is-hidden"); ui.hint.classList.add("is-hidden"); renderDialogue(); }
function closeDialogue(){ state.inDialogue=false; state.dialogueId=null; state.dialogueLine=0; ui.dialog.classList.add("is-hidden"); }
function currentDialogue(){ return data.dialogues[state.dialogueId]; }
function renderDialogue(){ const d=currentDialogue(); if(!d) return closeDialogue(); ui.speaker.textContent=d.speaker||""; ui.line.textContent=d.lines[state.dialogueLine]||""; ui.choices.innerHTML=""; if(state.dialogueLine>=d.lines.length-1&&d.choices) d.choices.forEach(c=>{ const b=document.createElement("button"); b.type="button"; b.textContent=c.text; b.addEventListener("click",()=>applyChoice(c)); ui.choices.appendChild(b); }); }
function advanceDialogue(){ const d=currentDialogue(); if(!d) return; if(state.dialogueLine<d.lines.length-1){ state.dialogueLine++; renderDialogue(); } else if(!d.choices?.length) closeDialogue(); }
function applyChoice(c){ if(c.stat) Object.entries(c.stat).forEach(([k,v])=> state.player[k]=Number(state.player[k]||0)+Number(v)); if(c.set) Object.entries(c.set).forEach(([p,v])=>setDeepValue(p,v)); if(c.objective) setObjective(c.objective); if(c.done) markDone(c.done); updateHud(); if(c.targetMap){ closeDialogue(); loadMap(c.targetMap,c.spawn||{x:0,z:0}); return; } if(c.to){ state.dialogueId=c.to; state.dialogueLine=0; renderDialogue(); } else closeDialogue(); }

function setObjective(text){ data.objective=text; ui.objective.textContent=text; }
function markDone(ids){ ids.forEach(id=>{ const q=state.quest.find(v=>v.id===id); if(q) q.done=true; }); renderQuests(); }
function setDeepValue(path,value){ const ks=path.split("."); let t=state; while(ks.length>1){ const k=ks.shift(); if(t[k]==null||typeof t[k]!=="object") t[k]={}; t=t[k]; } t[ks[0]]=value; }
function updateHud(){ const m=data.maps[state.currentMap]; ui.stat.name.textContent=state.player.name; ui.stat.hp.textContent=`${state.player.hp}/${state.player.maxHp}`; ui.stat.mp.textContent=`${state.player.mp}/${state.player.maxMp}`; ui.stat.rank.textContent=state.player.rank; ui.stat.contract.textContent=state.player.contract; ui.objective.textContent=data.objective; ui.area.textContent=m.name; ui.map.textContent=m.minimap; renderQuests(); }
function renderQuests(){ ui.quests.innerHTML=""; state.quest.forEach(q=>{ const li=document.createElement("li"); li.textContent=q.text; if(q.done) li.classList.add("done"); ui.quests.appendChild(li); }); }

function createLabelSprite(text){ const c=document.createElement("canvas"), x=c.getContext("2d"); c.width=512; c.height=128; x.fillStyle="rgba(10,12,18,.72)"; roundRect(x,12,20,488,88,18); x.fill(); x.strokeStyle="rgba(216,179,107,.75)"; x.lineWidth=4; roundRect(x,12,20,488,88,18); x.stroke(); x.fillStyle="#f6efe1"; x.font="bold 38px sans-serif"; x.textAlign="center"; x.textBaseline="middle"; x.fillText(text,256,64); const s=new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true })); s.scale.set(2.4,.6,1); return s; }
function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function mat(color,rough=.8,em=0x000000,intensity=0){ return new THREE.MeshStandardMaterial({ color, roughness:rough, emissive:em, emissiveIntensity:intensity, flatShading:true }); }
function rand(a,b){ return a+Math.random()*(b-a); }
function mesh(geometry, material){
  const m=new THREE.Mesh(geometry,material);
  m.at=(x=0,y=0,z=0,cast=false,receive=false,parent=world)=>{
    if(receive && receive.isObject3D){ parent=receive; receive=false; }
    if(cast && cast.isObject3D){ parent=cast; cast=false; }
    m.position.set(x,y,z); m.castShadow=!!cast; m.receiveShadow=!!receive; parent.add(m); return m;
  };
  m.rot=(x=0,y=0,z=0)=>{ m.rotation.set(x,y,z); return m; };
  m.scl=(x=1,y=1,z=1)=>{ m.scale.set(x,y,z); return m; };
  return m;
}

ui.start.addEventListener("click",()=>{ state.started=true; ui.title.classList.add("is-hidden"); });
addEventListener("keydown",e=>{
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
  if(e.code==="KeyF" && !state.inDialogue) return toggleCameraMode();
  if(e.code==="KeyE"&&state.activeTarget&&!state.inDialogue) return interact();
  if(state.inDialogue){ if(e.code==="Escape") closeDialogue(); if(e.code==="Enter"||e.code==="Space"){ e.preventDefault(); advanceDialogue(); } return; }
  state.keys.add(e.code);
});
addEventListener("keyup",e=>state.keys.delete(e.code));
ui.canvas.addEventListener("pointerdown",e=>{ state.dragging=true; state.lastX=e.clientX; state.lastY=e.clientY; });
addEventListener("pointerup",()=>state.dragging=false);
addEventListener("pointermove",e=>{
  if(!state.dragging||state.inDialogue) return;
  state.yaw-=(e.clientX-state.lastX)*.006;
  state.pitch=THREE.MathUtils.clamp(state.pitch-(e.clientY-state.lastY)*.004,-0.45,0.65);
  state.lastX=e.clientX; state.lastY=e.clientY;
});
addEventListener("gamepadconnected",()=>{ state.gamepadButtons = []; });
addEventListener("resize",()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
