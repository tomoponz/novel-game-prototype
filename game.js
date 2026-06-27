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
  wake_after: { speaker: "ユウジ", lines: ["白い輪郭はまだ視界の端に残っている。何度見ても、現実逃避の幻覚とは思えない。", "いま必要なのは検証だ。まずはギルドか、倒れた荷車の情報を集める。"] },
  caravan_after: { speaker: "ユウジ", lines: ["荷車の周囲は片付き始めている。黒毛の噛み犬はもう動かない。", "ここで何度も火球を撃つ必要はない。紹介状を持ってギルドへ向かうべきだ。"] },
  caravan_retreat_after: { speaker: "ユウジ", lines: ["荷車の現場には、まだ血と獣臭が残っている。", "助けられなかった事実は消えない。だが、いまはギルドへ向かって身分を得る方が先だ。"] },
  guild_guide_after: { speaker: "ギルド案内係", lines: ["受付は中だ。紹介状を持っているなら、まっすぐ正面奥へ行け。", "外で同じ説明を聞くより、中で手続きを進めた方が早い。"] },
  reception_after: { speaker: "ギルド受付", lines: ["仮登録の処理は進めています。次は、指定された目的を済ませてください。", "同じ説明を繰り返すより、行動で確認した方が早いです。"] },
  priest_after: { speaker: "司祭", lines: ["確認書の話は済みました。ギルドに戻れば受付が読めるはずです。", "この街では、言葉より紙の方が強い時があります。"] }
};

const state = {
  player: { stamina: 100, maxStamina: 100, ...structuredClone(data.player) },
  quest: structuredClone(data.quests), currentMap: "plaza", keys: new Set(), yaw: 0, pitch: 0.08,
  cameraMode: "third", started: false, dragging: false, lastX: 0, lastY: 0,
  activeTarget: null, inDialogue: false, dialogueId: null, dialogueLine: 0,
  selectedChoice: 0, choiceCooldown: 0, padButtons: [], isDashing: false
};
state.player.stamina ??= 100;
state.player.maxStamina ??= 100;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 100);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const world = new THREE.Group();
scene.add(world);
const clock = new THREE.Clock();
const player = createPlayer();
scene.add(player);

let npcs = [];
let locations = [];
let bounds = { minX: -17, maxX: 17, minZ: -17, maxZ: 17 };
let caravan = null;
let beast = null;
let merchant = null;
const projectiles = [];
const bursts = [];

initLights();
loadMap("plaza", { x: 0, z: 5.8 });
updateHud();
setTimeout(() => ui.loading.classList.add("is-hidden"), 300);
requestAnimationFrame(loop);

function initLights(){
  scene.add(new THREE.HemisphereLight(0xf8efde,0x28364a,2.6));
  const sun = new THREE.DirectionalLight(0xfff0ce,3.0);
  sun.position.set(12,18,8); sun.castShadow = true; sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{ near:.5, far:70, left:-26, right:26, top:26, bottom:-26 });
  scene.add(sun);
}
function mat(color, rough=.8, em=0x000000, power=0){ return new THREE.MeshStandardMaterial({ color, roughness: rough, emissive: em, emissiveIntensity: power, flatShading: true }); }
function add(geo, material, parent=world, cast=true, receive=true){ const m = new THREE.Mesh(geo, material); m.castShadow = cast; m.receiveShadow = receive; parent.add(m); return m; }
function rand(a,b){ return a + Math.random() * (b-a); }
function questDone(id){ return state.quest.some(q => q.id === id && q.done); }

function loadMap(id, spawn){
  state.currentMap = id; world.clear(); npcs.forEach(n => scene.remove(n)); npcs = [];
  caravan = beast = merchant = null; projectiles.length = 0; bursts.length = 0;
  if(id === "plaza") buildPlaza();
  if(id === "guildHall") buildGuildHall();
  if(id === "church") buildChurch();
  const md = data.maps[id];
  locations = md.locations.map(l => ({ ...l, kind: l.targetMap ? "door" : "spot" }));
  locations.forEach(addMarker);
  md.npcs.forEach(addNpc);
  player.position.set(spawn.x, 0, spawn.z);
  updateHud();
}
function env(color, near, far){ scene.background = new THREE.Color(color); scene.fog = new THREE.Fog(color, near, far); }
function buildPlaza(){
  env(0x8fb5ca,18,46); bounds = { minX:-17, maxX:17, minZ:-17, maxZ:17 };
  const ground = add(new THREE.PlaneGeometry(42,42), mat(0x526653,.95)); ground.rotation.x = -Math.PI/2;
  const plaza = add(new THREE.CircleGeometry(8.1,48), mat(0x817969,.98)); plaza.rotation.x = -Math.PI/2; plaza.position.y=.015;
  for(let i=0;i<120;i++){ const a=Math.random()*Math.PI*2, r=Math.sqrt(Math.random())*7.8; const s=add(new THREE.BoxGeometry(rand(.35,1),.03,rand(.2,.6)), mat(0x9a927f,1)); s.position.set(Math.cos(a)*r,.04,Math.sin(a)*r); s.rotation.y=rand(0,Math.PI); }
  addRoad(0,-12,4.6,18); addRoad(-11,0,18,4.2); addRoad(11,0,18,4.2);
  addHouse("冒険者ギルド",0,-12.2,6.4,4.6,4.5,0x6a5036,0x3b2a1e,0xab8b58,"guild");
  addHouse("教会",-10.5,-6.5,4.8,4.5,5.8,0x7c7a76,0x353948,0xd9c693,"church");
  addHouse("市場",10.5,-5.8,5.8,3.8,3.5,0x8d6542,0x742831,0xd2b57e,"market");
  addHouse("宿屋",-11.5,6.5,5.4,4,3.8,0x6b4e3b,0x2c4256,0xc7a168,"inn");
  addHouse("倉庫",10.5,6.8,5.4,3.8,3.4,0x595a56,0x242833,0x8c7b5b,"warehouse");
  [[-4.8,-4.1],[4.9,-4.2],[-4.8,5.3],[4.9,5.4]].forEach(v=>addLamp(...v));
  addMarket(); addTrees(); addWell(0,1.1); addCrates(8.5,5.2,5); addCrates(-8.2,7.1,3);
  addCaravanScene();
  const guide = add(new THREE.ConeGeometry(.8,1.9,3), mat(0xd8b36b,.55,0xd8b36b,.15)); guide.position.set(0,.95,-6.8); guide.rotation.y=Math.PI/3;
}
function buildGuildHall(){
  env(0x1f1711,12,28); bounds = { minX:-7.5, maxX:7.5, minZ:-6.8, maxZ:7.2 };
  addRoom(16,15,3.2,0x4c3727,0x3a281c,0x5b402b);
  const counter=add(new THREE.BoxGeometry(6.4,1.1,.9), mat(0x6b4a2f,.82)); counter.position.set(0,.55,-4.5);
  const shelf=add(new THREE.BoxGeometry(5.6,2.4,.5), mat(0x5a3d27,.8)); shelf.position.set(0,1.2,-6.2);
  for(let i=-2;i<=2;i++){ const b=add(new THREE.CylinderGeometry(.08,.1,.48,8), mat(0x6c8aa6,.45,0x25465c,.12)); b.position.set(i*.85,1.95,-5.95); }
  addSign(0,-5.4,"RECEPTION"); addQuestBoard(-5.6,-4.4); addTable(-3.4,1.4); addTable(3.6,1.2); addCrates(5.6,4.4,4); addLamp(-6.8,-2); addLamp(6.8,-2);
  const carpet=add(new THREE.BoxGeometry(4.2,.03,8.6), mat(0x652b2d,.94)); carpet.position.set(0,.05,1.7);
}
function buildChurch(){
  env(0x151823,12,28); bounds = { minX:-6.7, maxX:6.7, minZ:-6.2, maxZ:6.8 };
  addRoom(14,14,4,0x5b5a55,0x44434a,0x6a604b);
  const altar=add(new THREE.BoxGeometry(3.8,1.05,1.25), mat(0xddd1ae,.86)); altar.position.set(0,.55,-4.4);
  const top=add(new THREE.BoxGeometry(3.1,.08,.95), mat(0xf2e5c0,.72)); top.position.set(0,1.1,-4.4);
  [[-1,-4.15],[1,-4.15],[-.55,-3.85],[.55,-3.85]].forEach(v=>addCandle(...v));
  for(let i=0;i<4;i++){ addBench(-2.6,-1.2+i*1.45); addBench(2.6,-1.2+i*1.45); }
  addSign(0,-5.4,"ALTAR");
}
function addRoad(x,z,w,d){ const r=add(new THREE.BoxGeometry(w,.04,d), mat(0x6e6657,1)); r.position.set(x,.03,z); }
function addRoom(w,d,h,floor,wall,beam){ const f=add(new THREE.BoxGeometry(w,.12,d),mat(floor,.9)); f.position.y=-.02; [[0,-d/2,w,.35],[-w/2,0,.35,d],[w/2,0,.35,d],[-w*.3,d/2,w*.4,.35],[w*.3,d/2,w*.4,.35]].forEach(([x,z,ww,dd])=>{ const m=add(new THREE.BoxGeometry(ww,h,dd),mat(wall,.9)); m.position.set(x,h/2,z); }); for(let i=0;i<6;i++){ const b=add(new THREE.BoxGeometry(w-.8,.24,.26),mat(beam,.88)); b.position.set(0,h-.3,-d/2+1+i*((d-2)/5)); } }
function addHouse(name,x,z,w,d,h,wall,roof,trim,type){ const g=new THREE.Group(); g.position.set(x,0,z); world.add(g); const put=(geo,ma,xx,yy,zz)=>{const m=add(geo,ma,g); m.position.set(xx,yy,zz); return m;}; put(new THREE.BoxGeometry(w+.3,.35,d+.3),mat(0x54483a,.94),0,.18,0); put(new THREE.BoxGeometry(w,h,d),mat(wall,.88),0,h/2+.18,0); const rf=put(new THREE.ConeGeometry(Math.max(w,d)*.82,2.1,4),mat(roof,.84),0,h+1.18,0); rf.rotation.y=Math.PI/4; put(new THREE.BoxGeometry(w+.25,.24,d+.25),mat(trim,.72),0,h-.15,0); put(new THREE.BoxGeometry(1.25,1.9,.12),mat(0x231810,.9),0,1.08,d/2+.1); put(new THREE.BoxGeometry(2.05,.12,.9),mat(trim,.72),0,2.35,d/2+.5); [-w*.28,w*.28].forEach(xx=>[1.7,2.7].forEach(yy=>{ if(Math.abs(xx)<.8&&yy<2)return; put(new THREE.BoxGeometry(.72,.92,.1),mat(trim,.6),xx,yy,d/2+.07); put(new THREE.BoxGeometry(.52,.72,.05),mat(type==="church"?0x8cb8d9:0x89a8bd,.32,0x35546b,.22),xx,yy,d/2+.11); })); if(type==="guild"){ [-1.9,1.9].forEach((xx,i)=>put(new THREE.BoxGeometry(.5,1,.04),mat(i?0x7f2a2f:0x234a78,.82),xx,1.85,d/2+.22)); } if(type==="church"){ put(new THREE.ConeGeometry(1.1,3.3,4),mat(0x323742,.82),0,h+3,0); put(new THREE.BoxGeometry(.42,.08,.08),mat(0xd6c181,.5,0xd6c181,.25),0,h+4.8,0); put(new THREE.BoxGeometry(.08,.72,.08),mat(0xd6c181,.5,0xd6c181,.25),0,h+4.6,0); } const label=createLabel(name); label.position.set(0,h+2.6,d/2+.2); g.add(label); }
function addMarket(){ const cols=[0xb43d46,0x2f6f9f,0xd8b36b,0x3f815a]; for(let i=0;i<4;i++){ const g=new THREE.Group(); g.position.set(6.7+i*1.65,0,-1.9+(i%2)*1.6); world.add(g); const t=add(new THREE.BoxGeometry(1.2,.5,.8),mat(0x6a4d35,.8),g); t.position.y=.25; const r=add(new THREE.BoxGeometry(1.55,.08,1.1),mat(cols[i%4],.8),g); r.position.y=1.3; r.rotation.z=(i%2?-1:1)*.08; } }
function addTrees(){ [[-7.5,4.2],[-6.8,-2.2],[7.2,3.4],[5.7,7.2],[-15,-1.8],[15,2.3]].forEach(([x,z])=>{ const g=new THREE.Group(); g.position.set(x,0,z); world.add(g); const tr=add(new THREE.CylinderGeometry(.22,.32,1.7,8),mat(0x5b3a24,.9),g); tr.position.y=.85; const l1=add(new THREE.DodecahedronGeometry(1.15,0),mat(0x2f6f45,.92),g); l1.position.y=1.95; const l2=add(new THREE.DodecahedronGeometry(.72,0),mat(0x3d8a59,.92),g); l2.position.set(.45,2.5,-.1); }); }
function addWell(x,z){ const w=add(new THREE.CylinderGeometry(.75,.85,.75,16),mat(0x6f6b63,1)); w.position.set(x,.38,z); const r=add(new THREE.ConeGeometry(.95,.8,6),mat(0x654d39,.84)); r.position.set(x,1.75,z); }
function addCrates(x,z,n){ for(let i=0;i<n;i++){ const c=add(new THREE.BoxGeometry(.7,.7,.7),mat(0x735334,.86)); c.position.set(x+(i%2)*.8,.35+Math.floor(i/2)*.38,z+Math.floor(i/2)*.75); c.rotation.y=rand(-.2,.2); } }
function addLamp(x,z){ const p=add(new THREE.CylinderGeometry(.07,.09,2.8,10),mat(0x3d342f,.9)); p.position.set(x,1.4,z); const l=add(new THREE.SphereGeometry(.18,10,8),mat(0xe7c56f,.4,0xe7c56f,.8)); l.position.set(x+.35,2.5,z); }
function addSign(x,z,text){ const p=add(new THREE.CylinderGeometry(.08,.08,1.5,8),mat(0x332315,.85)); p.position.set(x,.75,z); const s=createLabel(text); s.scale.set(1.5,.42,1); s.position.set(x,1.75,z); world.add(s); }
function addQuestBoard(x,z){ const b=add(new THREE.BoxGeometry(.18,2.2,2.2),mat(0x4a301c,.88)); b.position.set(x,1.25,z); const l=createLabel("QUEST"); l.scale.set(1.3,.34,1); l.position.set(x+.15,2.55,z); world.add(l); }
function addTable(x,z){ const t=add(new THREE.BoxGeometry(2,.35,1.2),mat(0x5a3e28,.85)); t.position.set(x,.55,z); [-.75,.75].forEach(s=>{ const c=add(new THREE.BoxGeometry(.45,.55,.45),mat(0x3e2a1d,.85)); c.position.set(x+s,.32,z+.95); }); }
function addCandle(x,z){ const b=add(new THREE.CylinderGeometry(.06,.07,.42,10),mat(0xe8e0c9,.65)); b.position.set(x,1.34,z); const f=add(new THREE.SphereGeometry(.05,8,8),mat(0xf2cb6b,.3,0xf2cb6b,1)); f.position.set(x,1.62,z); }
function addBench(x,z){ const b=add(new THREE.BoxGeometry(2.4,.35,.55),mat(0x5d4129,.85)); b.position.set(x,.28,z); }
function addMarker(l){ const c=l.targetMap?0xd8b36b:0x87c7ff; const ring=add(new THREE.TorusGeometry(.56,.025,8,28),mat(c,.42,c,.7)); ring.position.set(l.position.x,.08,l.position.z); ring.rotation.x=Math.PI/2; const cone=add(new THREE.ConeGeometry(.16,.7,4),mat(c,.45,c,.55)); cone.position.set(l.position.x,.65,l.position.z); cone.rotation.y=Math.PI/4; }

function addCaravanScene(){
  const g = new THREE.Group(); g.position.set(6.2,0,-2.2); g.rotation.y = -0.25; world.add(g); caravan = g;
  const cart = add(new THREE.BoxGeometry(2.2,.55,1.35), mat(0x6a4328,.85), g); cart.position.set(0,.55,0); cart.rotation.z = questDone("merchant") ? 0.05 : -0.18;
  const axle = add(new THREE.CylinderGeometry(.08,.08,2.8,10), mat(0x3b2a1d,.85), g); axle.rotation.z = Math.PI/2; axle.position.set(0,.32,0);
  for(const sx of [-1.15,1.15]) for(const sz of [-.62,.62]){ const wheel=add(new THREE.TorusGeometry(.34,.07,8,18),mat(0x2c2018,.9),g); wheel.position.set(sx,.35,sz); wheel.rotation.y=Math.PI/2; }
  for(let i=0;i<7;i++){ const box=add(new THREE.BoxGeometry(.45,.38,.45),mat([0x8c6239,0x6d5237,0x9a7b4d][i%3],.9),g); box.position.set(rand(-.8,.8),.95+Math.floor(i/3)*.33,rand(-.45,.45)); box.rotation.y=rand(-.4,.4); }
  const horse = createHorse(); horse.position.set(-1.95,.05,0); horse.rotation.y = Math.PI/2; g.add(horse);
  merchant = createPerson({ id:"merchant", variant:"traveler", color:0x6f8aa6 }); merchant.position.set(.7,.06,questDone("merchant")?1.45:1.05); merchant.rotation.z = questDone("merchant") ? 0 : Math.PI/2; merchant.rotation.y = questDone("merchant") ? Math.PI : 0; g.add(merchant);
  if(!questDone("merchant")){
    beast = createBeast(); beast.position.set(1.85,.05,-.55); beast.rotation.y = -Math.PI/2; g.add(beast);
  } else {
    const solved = createLabel("RESCUED"); solved.scale.set(1.2,.32,1); solved.position.set(0,1.75,0); g.add(solved);
  }
}
function createHorse(){ const g=new THREE.Group(); const body=add(new THREE.BoxGeometry(1.15,.55,.38),mat(0x5b3a28,.85),g); body.position.y=.78; const neck=add(new THREE.BoxGeometry(.25,.55,.22),mat(0x5b3a28,.85),g); neck.position.set(.5,1.05,0); neck.rotation.z=-.35; const head=add(new THREE.BoxGeometry(.35,.25,.25),mat(0x5b3a28,.85),g); head.position.set(.75,1.25,0); for(const x of [-.38,.38]) for(const z of [-.14,.14]){ const leg=add(new THREE.BoxGeometry(.12,.65,.12),mat(0x3b281d,.9),g); leg.position.set(x,.34,z); } return g; }
function createBeast(){ const g=new THREE.Group(); const body=add(new THREE.BoxGeometry(.95,.42,.36),mat(0x111015,.85,0x2b0606,.15),g); body.position.y=.62; const head=add(new THREE.BoxGeometry(.36,.28,.32),mat(0x09090d,.9),g); head.position.set(-.58,.72,0); const jaw=add(new THREE.BoxGeometry(.22,.1,.28),mat(0x3a0c0c,.9,0x5f0808,.25),g); jaw.position.set(-.76,.61,0); for(const x of [-.32,.32]) for(const z of [-.13,.13]){ const leg=add(new THREE.BoxGeometry(.11,.46,.11),mat(0x09090d,.9),g); leg.position.set(x,.28,z); } for(const z of [-.09,.09]){ const eye=add(new THREE.SphereGeometry(.035,8,6),mat(0xff2a1c,.2,0xff2a1c,1.1),g); eye.position.set(-.77,.78,z); } const tail=add(new THREE.CylinderGeometry(.035,.06,.55,6),mat(0x0b0b0d,.9),g); tail.position.set(.57,.72,0); tail.rotation.z=.8; return g; }
function createBurst(pos){ const group=new THREE.Group(); group.position.copy(pos); world.add(group); for(let i=0;i<12;i++){ const spark=add(new THREE.SphereGeometry(.055,8,6),mat(0xffb447,.35,0xff5d1f,1.4),group); const a=i/12*Math.PI*2; spark.userData.vel=new THREE.Vector3(Math.cos(a)*rand(1.2,2.2),rand(.3,1.4),Math.sin(a)*rand(1.2,2.2)); } bursts.push({ group, life:.45, max:.45 }); }
function castFireball(){ if(state.currentMap!=="plaza")return; const start=new THREE.Vector3(player.position.x,1.35,player.position.z); const end=new THREE.Vector3(8.0,.8,-2.75); if(beast){ beast.getWorldPosition(end); end.y=.8; } const ball=add(new THREE.SphereGeometry(.22,16,10),mat(0xff7a1c,.2,0xff5a00,1.8)); ball.position.copy(start); projectiles.push({ mesh:ball, start, end, t:0, speed:1.9 }); }
function updateEffects(dt,t){
  if(beast && !questDone("merchant")){ beast.position.x = 1.7 + Math.sin(t*4.2)*.22; beast.position.y = .05 + Math.abs(Math.sin(t*5.2))*.06; beast.rotation.z = Math.sin(t*6)*.08; }
  if(caravan && !questDone("merchant")){ caravan.rotation.z = Math.sin(t*2.6)*.018; }
  for(let i=projectiles.length-1;i>=0;i--){ const p=projectiles[i]; p.t += dt*p.speed; const k=Math.min(1,p.t); p.mesh.position.lerpVectors(p.start,p.end,k); p.mesh.scale.setScalar(1 + Math.sin(k*Math.PI)*.8); if(k>=1){ createBurst(p.end); world.remove(p.mesh); projectiles.splice(i,1); if(beast){ beast.rotation.z = -.4; beast.position.y += .18; } } }
  for(let i=bursts.length-1;i>=0;i--){ const b=bursts[i]; b.life -= dt; b.group.scale.setScalar(1 + (1-b.life/b.max)*2.5); b.group.children.forEach(s=>s.position.addScaledVector(s.userData.vel,dt)); if(b.life<=0){ world.remove(b.group); bursts.splice(i,1); } }
}

function addNpc(npc){ const n=createPerson(npc); n.position.set(npc.position.x,0,npc.position.z); n.userData={...npc,kind:"npc"}; const label=createLabel(npc.name); label.position.set(0,2.55,0); n.add(label); scene.add(n); npcs.push(n); }
function createPlayer(){ return createPerson({ id:"player", variant:"player", color:0x24395d }); }
function createPerson(n){ const g=new THREE.Group(), v=n.variant||n.id, base=n.color, skin=0xd8ad84, hair=v==="receptionist"?0xf1dbc5:v==="priest"?0xd5cfbc:v==="veteran"?0x7b5b3f:0x2e2218; body(g,base,v==="priest"?0xcfc8b4:null); head(g,skin,hair,v==="receptionist"?"bun":v==="priest"?"hood":"short"); limbs(g,base,v==="priest"?0xc7c2b1:0x252d3c,0x39281c,skin); if(v==="guard"){ const plate=add(new THREE.BoxGeometry(.62,.58,.18),mat(0xa8acb6,.42),g); plate.position.set(0,1,.28); const spear=add(new THREE.CylinderGeometry(.03,.03,2.2,8),mat(0x6e5134,.85),g); spear.position.set(-.42,1.05,0); spear.rotation.z=.1; } if(v==="receptionist"){ const apron=add(new THREE.BoxGeometry(.45,.6,.12),mat(0xf1dbc5,.5),g); apron.position.set(0,.78,.25); } if(v==="priest"){ [-.12,.12].forEach(x=>{ const st=add(new THREE.BoxGeometry(.12,.96,.14),mat(0xd5c089,.45),g); st.position.set(x,.9,.23); }); } if(v==="guild_guide"){ const sash=add(new THREE.BoxGeometry(.15,.92,.14),mat(0xd8b36b,.6),g); sash.position.set(.18,.92,.23); sash.rotation.z=-.5; } return g; }
function body(g,color,robe){ const torso=add(new THREE.BoxGeometry(.74,.92,.38),mat(color,.72),g); torso.position.set(0,1.02,0); if(robe){ const rb=add(new THREE.ConeGeometry(.5,.95,6),mat(robe,.78),g); rb.position.set(0,.55,-.03); rb.rotation.x=Math.PI; } else { const cape=add(new THREE.BoxGeometry(.62,.55,.12),mat(0x1b2740,.82),g); cape.position.set(0,.86,-.31); cape.rotation.x=.12; } const belt=add(new THREE.BoxGeometry(.82,.11,.46),mat(0x8c6740,.82),g); belt.position.set(0,.74,0); }
function head(g,skin,hair,style){ const neck=add(new THREE.CylinderGeometry(.08,.08,.14,10),mat(skin,.75),g); neck.position.set(0,1.49,0); const face=add(new THREE.SphereGeometry(.29,20,16),mat(skin,.82),g); face.position.set(0,1.78,0); const eyeM=mat(0x17223a,.45,0x17223a,.08); [[-.1,1.8,.285],[.1,1.8,.285]].forEach(p=>{ const e=add(new THREE.BoxGeometry(.055,.035,.018),eyeM,g); e.position.set(...p); }); if(style==="hood"){ const h=add(new THREE.SphereGeometry(.36,16,12),mat(hair,.88),g); h.scale.set(1.04,.9,1.06); h.position.set(0,1.82,-.04); } else { const cap=add(new THREE.SphereGeometry(.335,18,12),mat(hair,.92),g); cap.scale.set(1.05,.54,1.03); cap.position.set(0,1.95,-.035); [-.17,0,.17].forEach((x,i)=>{ const bang=add(new THREE.BoxGeometry(.11,.24,.055),mat(hair,.92),g); bang.position.set(x,1.87,.295); bang.rotation.z=(i-1)*.18; }); if(style==="bun"){ const bun=add(new THREE.SphereGeometry(.16,12,10),mat(hair,.92),g); bun.position.set(0,1.95,-.28); } } const nose=add(new THREE.BoxGeometry(.05,.08,.05),mat(skin,.72),g); nose.position.set(0,1.755,.305); }
function limbs(g,sleeve,leg,boot,skin){ [-1,1].forEach(s=>{ const a=add(new THREE.BoxGeometry(.17,.52,.17),mat(sleeve,.78),g); a.position.set(s*.46,1.05,0); a.rotation.z=s*.16; const hand=add(new THREE.SphereGeometry(.085,10,8),mat(skin,.8),g); hand.position.set(s*.52,.72,.03); const l=add(new THREE.BoxGeometry(.19,.62,.19),mat(leg,.82),g); l.position.set(s*.15,.38,0); const b=add(new THREE.BoxGeometry(.22,.16,.34),mat(boot,.86),g); b.position.set(s*.15,.07,.08); }); }

function loop(){ const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime; viewKeys(dt); gamepad(dt); move(dt); updateEffects(dt,t); npcs.forEach((n,i)=>{ n.position.y=Math.sin(t*1.6+i*.8)*.02; n.rotation.y=Math.sin(t*.6+i)*.12; }); detect(); cameraUpdate(); renderer.render(scene,camera); requestAnimationFrame(loop); }
function viewKeys(dt){ if(!state.started||state.inDialogue)return; state.yaw += ((state.keys.has("ArrowLeft")?1:0)-(state.keys.has("ArrowRight")?1:0))*2.25*dt; state.pitch = THREE.MathUtils.clamp(state.pitch+((state.keys.has("ArrowUp")?1:0)-(state.keys.has("ArrowDown")?1:0))*1.35*dt,-.45,.65); }
function pad(){ const ps=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[]; return ps.find(p=>/dualshock|wireless controller|dualsense|playstation/i.test(p.id))||ps[0]||null; }
function dz(v){ return Math.abs(v)<.16?0:v; }
function gamepad(dt){
  state.choiceCooldown = Math.max(0, state.choiceCooldown - dt);
  const p=pad(); if(!p||!state.started)return;
  const now=p.buttons.map(b=>b.pressed), down=i=>now[i]&&!state.padButtons[i];
  if(state.inDialogue){
    const y = dz(p.axes[1]||0);
    if((down(13) || y>.55) && state.choiceCooldown<=0){ moveChoice(1); state.choiceCooldown=.22; }
    if((down(12) || y<-.55) && state.choiceCooldown<=0){ moveChoice(-1); state.choiceCooldown=.22; }
    if(down(0)) confirmChoice();
    if(down(1)) closeDialogue();
    state.padButtons=now; return;
  }
  state.yaw-=dz(p.axes[2]||0)*2.8*dt; state.pitch=THREE.MathUtils.clamp(state.pitch-dz(p.axes[3]||0)*1.8*dt,-.45,.65);
  if(down(0)&&state.activeTarget) interact();
  if(down(3)||down(9)) toggleCamera();
  state.padButtons=now;
}
function stick(){ const p=pad(); return p?{x:dz(p.axes[0]||0),y:-dz(p.axes[1]||0),dash:(p.buttons[7]?.value||0)>.25||p.buttons[10]?.pressed}:{x:0,y:0,dash:false}; }
function move(dt){ if(!state.started||state.inDialogue)return; const s=stick(); let x=(state.keys.has("KeyD")?1:0)-(state.keys.has("KeyA")?1:0)+s.x, y=(state.keys.has("KeyW")?1:0)-(state.keys.has("KeyS")?1:0)+s.y; const len=Math.hypot(x,y); if(len<.01){ regen(dt,24); state.isDashing=false; return; } x/=Math.max(1,len); y/=Math.max(1,len); state.isDashing=(state.keys.has("ShiftLeft")||state.keys.has("ShiftRight")||s.dash)&&state.player.stamina>2; const speed=state.isDashing?8.2:4.6; state.isDashing?state.player.stamina=Math.max(0,state.player.stamina-30*dt):regen(dt,18); const rx=Math.cos(state.yaw), rz=-Math.sin(state.yaw), fx=-Math.sin(state.yaw), fz=-Math.cos(state.yaw); const dx=rx*x+fx*y, dzv=rz*x+fz*y; player.position.x=THREE.MathUtils.clamp(player.position.x+dx*speed*dt,bounds.minX,bounds.maxX); player.position.z=THREE.MathUtils.clamp(player.position.z+dzv*speed*dt,bounds.minZ,bounds.maxZ); player.rotation.y=Math.atan2(dx,dzv); staminaText(); }
function regen(dt,a){ state.player.stamina=Math.min(state.player.maxStamina,state.player.stamina+a*dt); staminaText(); }
function staminaText(){ if(ui.stat.stamina) ui.stat.stamina.textContent=`${Math.round(state.player.stamina)}/${state.player.maxStamina}`; }
function detect(){ let near=null,dist=Infinity; npcs.forEach(n=>{const d=player.position.distanceTo(n.position); if(d<dist){dist=d; near=n.userData;}}); locations.forEach(l=>{const d=Math.hypot(player.position.x-l.position.x,player.position.z-l.position.z); if(d<dist){dist=d; near=l;}}); const r=near?.radius??2.2; if(near&&dist<r&&!state.inDialogue&&state.started){ state.activeTarget=near; ui.hintText.textContent=near.kind==="npc"?"話す":near.name; ui.hint.classList.remove("is-hidden"); } else { state.activeTarget=null; ui.hint.classList.add("is-hidden"); } }
function cameraUpdate(){ const desired=state.isDashing?(state.cameraMode==="first"?70:61):55; camera.fov+=(desired-camera.fov)*.12; camera.updateProjectionMatrix(); const target=new THREE.Vector3(player.position.x,1.08,player.position.z); if(state.cameraMode==="first"){ const eye=new THREE.Vector3(player.position.x,1.55,player.position.z), look=new THREE.Vector3(-Math.sin(state.yaw)*Math.cos(state.pitch),Math.sin(state.pitch),-Math.cos(state.yaw)*Math.cos(state.pitch)); camera.position.lerp(eye,.35); camera.lookAt(eye.clone().add(look)); player.visible=false; return; } player.visible=true; const radius=state.currentMap==="plaza"?8.8:6.8, base=state.currentMap==="plaza"?5.8:4.8, off=new THREE.Vector3(Math.sin(state.yaw)*radius,base+Math.sin(state.pitch)*4.2,Math.cos(state.yaw)*radius); camera.position.lerp(target.clone().add(off),.12); camera.lookAt(target); }
function toggleCamera(){ state.cameraMode=state.cameraMode==="third"?"first":"third"; }

function getDialogueIdForTarget(t){
  if(t.id === "wake_point" && questDone("wake")) return "wake_after";
  if(t.id === "caravan_site"){
    if(questDone("merchant")) return "caravan_after";
    if(questDone("caravan")) return "caravan_retreat_after";
  }
  if(t.id === "guild_guide" && questDone("guild")) return "guild_guide_after";
  if(t.id === "receptionist" && questDone("register")) return "reception_after";
  if(t.id === "priest" && questDone("church")) return "priest_after";
  return t.dialogue;
}
function interact(){ const t=state.activeTarget; if(!t)return; if(t.targetMap){ if(t.id==="guild_door") markDone(["guild"]); if(t.targetMap==="guildHall") setObjective("受付で登録条件を聞く"); loadMap(t.targetMap,t.spawn); return; } const id=getDialogueIdForTarget(t); if(id) openDialogue(id); }
function openDialogue(id){ state.dialogueId=id; state.dialogueLine=0; state.selectedChoice=0; state.inDialogue=true; if(id === "street_attack_start") startCaravanAttackFocus(); if(id === "fireball_first") castFireball(); ui.choices.innerHTML=""; ui.dialog.classList.remove("is-hidden"); ui.hint.classList.add("is-hidden"); renderDialogue(); }
function closeDialogue(){ state.inDialogue=false; state.dialogueId=null; ui.dialog.classList.add("is-hidden"); }
function cur(){ return data.dialogues[state.dialogueId] || extraDialogues[state.dialogueId]; }
function renderDialogue(){ const d=cur(); if(!d)return closeDialogue(); ui.speaker.textContent=d.speaker||""; ui.line.textContent=d.lines[state.dialogueLine]||""; ui.choices.innerHTML=""; const show=state.dialogueLine>=d.lines.length-1&&d.choices; if(show) d.choices.forEach((c,i)=>{ const b=document.createElement("button"); b.type="button"; b.textContent=c.text; b.classList.toggle("is-selected",i===state.selectedChoice); b.onclick=()=>choice(c); ui.choices.appendChild(b); }); }
function advanceDialogue(){ const d=cur(); if(!d)return; if(state.dialogueLine<d.lines.length-1){ state.dialogueLine++; state.selectedChoice=0; renderDialogue(); } else if(d.choices?.length){ confirmChoice(); } else closeDialogue(); }
function moveChoice(delta){ const d=cur(); if(!d?.choices?.length || state.dialogueLine<d.lines.length-1) return; state.selectedChoice=(state.selectedChoice+delta+d.choices.length)%d.choices.length; renderDialogue(); }
function confirmChoice(){ const d=cur(); if(!d?.choices?.length || state.dialogueLine<d.lines.length-1){ advanceDialogue(); return; } choice(d.choices[state.selectedChoice] || d.choices[0]); }
function choice(c){ if(c.stat) Object.entries(c.stat).forEach(([k,v])=>state.player[k]=Number(state.player[k]||0)+Number(v)); if(c.set) Object.entries(c.set).forEach(([p,v])=>setDeep(p,v)); if(c.objective)setObjective(c.objective); if(c.done)markDone(c.done); if(c.to === "fireball_first") castFireball(); updateHud(); if(c.targetMap){ closeDialogue(); loadMap(c.targetMap,c.spawn||{x:0,z:0}); return; } if(c.to){ state.dialogueId=c.to; state.dialogueLine=0; state.selectedChoice=0; if(c.to === "fireball_first") castFireball(); renderDialogue(); } else closeDialogue(); }
function startCaravanAttackFocus(){ if(state.currentMap !== "plaza") return; state.yaw = -1.35; if(beast) beast.scale.set(1.12,1.12,1.12); }
function setObjective(t){ data.objective=t; ui.objective.textContent=t; }
function markDone(ids){ ids.forEach(id=>{ const q=state.quest.find(x=>x.id===id); if(q)q.done=true; }); if(ids.includes("merchant")) resolveCaravan(); renderQuests(); }
function resolveCaravan(){ if(beast){ beast.visible=false; } if(merchant){ merchant.rotation.set(0,Math.PI,0); merchant.position.set(.7,.06,1.45); } }
function setDeep(path,val){ const ks=path.split("."); let t=state; while(ks.length>1){ const k=ks.shift(); t[k]??={}; t=t[k]; } t[ks[0]]=val; }
function updateHud(){ const m=data.maps[state.currentMap]; ui.stat.name.textContent=state.player.name; ui.stat.hp.textContent=`${state.player.hp}/${state.player.maxHp}`; ui.stat.mp.textContent=`${state.player.mp}/${state.player.maxMp}`; staminaText(); ui.stat.rank.textContent=state.player.rank; ui.stat.contract.textContent=state.player.contract; ui.objective.textContent=data.objective; ui.area.textContent=m.name; ui.map.textContent=m.minimap; renderQuests(); }
function renderQuests(){ ui.quests.innerHTML=""; state.quest.forEach(q=>{ const li=document.createElement("li"); li.textContent=q.text; if(q.done)li.classList.add("done"); ui.quests.appendChild(li); }); }
function createLabel(text){ const c=document.createElement("canvas"),x=c.getContext("2d"); c.width=512;c.height=128;x.fillStyle="rgba(10,12,18,.72)"; round(x,12,20,488,88,18); x.fill(); x.strokeStyle="rgba(216,179,107,.75)"; x.lineWidth=4; round(x,12,20,488,88,18); x.stroke(); x.fillStyle="#f6efe1"; x.font="bold 38px sans-serif"; x.textAlign="center"; x.textBaseline="middle"; x.fillText(text,256,64); const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true})); s.scale.set(2.4,.6,1); return s; }
function round(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

ui.start.onclick=()=>{ state.started=true; ui.title.classList.add("is-hidden"); };
addEventListener("keydown",e=>{ if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault(); if(state.inDialogue){ if(e.code==="ArrowDown") return moveChoice(1); if(e.code==="ArrowUp") return moveChoice(-1); if(e.code==="Escape")return closeDialogue(); if(e.code==="Enter"||e.code==="Space"){e.preventDefault();return advanceDialogue();} } if(e.code==="KeyF")return toggleCamera(); if(e.code==="KeyE"&&state.activeTarget)return interact(); state.keys.add(e.code); });
addEventListener("keyup",e=>state.keys.delete(e.code));
ui.canvas.addEventListener("pointerdown",e=>{state.dragging=true;state.lastX=e.clientX;state.lastY=e.clientY;});
addEventListener("pointerup",()=>state.dragging=false);
addEventListener("pointermove",e=>{ if(!state.dragging||state.inDialogue)return; state.yaw-=(e.clientX-state.lastX)*.006; state.pitch=THREE.MathUtils.clamp(state.pitch-(e.clientY-state.lastY)*.004,-.45,.65); state.lastX=e.clientX; state.lastY=e.clientY; });
addEventListener("resize",()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
