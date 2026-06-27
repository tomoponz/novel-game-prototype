import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $ = (id) => document.getElementById(id);
const clone = (v) => (typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v)));
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
  low:    { pixelRatio: 1.0, houseMul: .75, propMul: .55, npcMul: .55, trees: .55, carts: 3, fogFar: 620, cull: 220, shadow: false },
  medium: { pixelRatio: 1.25, houseMul: 1.0, propMul: .75, npcMul: .85, trees: .75, carts: 5, fogFar: 760, cull: 300, shadow: true },
  high:   { pixelRatio: 1.5, houseMul: 1.25, propMul: 1.0, npcMul: 1.0, trees: 1.0, carts: 7, fogFar: 920, cull: 420, shadow: true }
};
let qualityName = QUALITY[params.get("render")] ? params.get("render") : "medium";
let quality = QUALITY[qualityName];

const basePlayer = data.player || { name:"ユウジ・サトウ", hp:200, maxHp:200, mp:25, maxMp:25, rank:"未登録", contract:"未契約" };
const baseQuests = data.quests || [];
const extraQuests = [
  { id:"gate", text:"北門で検問を通過する", done:false },
  { id:"plaza", text:"中央広場で王都の構造を確認する", done:false },
  { id:"market_case", text:"市場通りの盗難騒ぎを確認する", done:false },
  { id:"church_record", text:"教会で身分記録の手続きを聞く", done:false },
  { id:"training_spell", text:"外門練習場で火球を試射する", done:false },
  { id:"alley_info", text:"怪しい路地裏で情報屋に接触する", done:false }
];

const extraDialogues = {
  wake_after: { speaker:"ユウジ", lines:["白い輪郭はまだ視界の端に残っている。これは幻覚ではなく、この世界の仕組みだ。", "同じ場所で悩むより、街道の先にある荷車と王都門を確認する。"] },
  caravan_after: { speaker:"ユウジ", lines:["黒毛の噛み犬はもう動かない。荷車の周囲には焦げ跡と散らばった木箱だけが残っている。", "何度も火球を撃つ必要はない。紹介状を持って王都へ向かう。"] },
  caravan_retreat_after: { speaker:"ユウジ", lines:["荷車の現場にはまだ獣臭が残っている。", "助けなかった事実は消えない。だが、ギルドへ行かなければ身分も得られない。"] },
  north_gate_scene: { speaker:"北門衛兵", lines:["止まれ。王都アウレリアに入る者は、名と目的を言え。", "……街道で商人を助けた？　紹介状があるなら、門内のギルドに先に出せ。", "城下は広い。大通りを南へ。噴水を越え、剣と盾の看板を探せ。"], choices:[{text:"王都へ入る", done:["gate"], objective:"中央広場を抜けて冒険者ギルドへ向かう"}] },
  central_plaza_scene: { speaker:"ユウジ", lines:["城壁の内側に、家が押し込まれている。大通りには馬車、脇道には店、遠くには王城。", "ただ広いだけじゃない。身分、職業、金、信仰で住む場所が分かれている。", "まずはギルド。次に教会。路地裏は……必要になるまで近づかない方がいい。"], choices:[{text:"地図感覚を整理する", done:["plaza"], objective:"冒険者ギルドで紹介状を出す"}] },
  guild_gate_scene: { speaker:"ギルド案内係", lines:["登録なら中だ。紹介状があるなら受付へ。", "ただし、仮登録までは武器の携帯にも制限がある。王都の中では、力より先に紙が物を言う。"], choices:[{text:"ギルド内部へ入る", targetMap:"guildHall", spawn:{x:0,z:6.4}, done:["guild"], objective:"受付で登録と魔力測定を受ける"}] },
  market_case_scene: { speaker:"市場の商人", lines:["おい、そこの旅人。今、薬草束がひとつ消えた。", "犯人は子どもか、裏路地の連中か……いや、決めつけは商売を壊す。", "見たなら教えてくれ。見ていないなら、余計な正義感を出すな。"], choices:[{text:"盗難騒ぎを記録しておく", done:["market_case"], objective:"教会かギルドで身分確認を進める"},{text:"路地裏の情報屋を探す", objective:"怪しい路地裏で情報屋に接触する"}] },
  church_record_scene: { speaker:"記録係の見習い", lines:["洗礼記録、出生記録、移住記録。この街では、記録がない人は“いない人”に近い扱いです。", "紹介状があるなら仮の確認書は作れます。ただ、正式な身分には保証人が必要です。"], choices:[{text:"確認書の手続きを聞く", done:["church_record","church"], set:{"player.contract":"教会確認書"}, objective:"ギルドへ戻って仮登録を進める"}] },
  training_scene: { speaker:"訓練教官", lines:["街中で火球を撃つな。試すならここだ。", "的を見ろ。息を止めるな。恥ずかしい詠唱でも、出るなら使え。", "ただし魔力は無限じゃない。強い技ほど、隙も重くなる。"], choices:[{text:"火球を試射する", done:["training_spell"], stat:{knowledge:1}, objective:"ギルドに戻り、模擬戦の準備をする"}] },
  shady_alley: { speaker:"路地裏の男", lines:["よそ者だな。北門から来た顔をしている。", "ここでは、金より身元が高く売れる。ギルド証も教会印もないなら、噂を買うだけでも高い。", "黒い羽を見たら拾うな。割れた水晶を見ても触るな。それが、この街で長生きするコツだ。"], choices:[{text:"情報だけ覚えて戻る", done:["alley_info"], objective:"ギルドか教会で正式な足場を作る"}] },
  fountain_hint: { speaker:"広場の噴水", lines:["噴水の水面に、王城、教会の鐘楼、ギルドの看板、市場の布屋根が映っている。", "北門から来た者はここで足を止める。ここが王都の胃袋であり、目印だ。"] },
  blacksmith: { speaker:"鍛冶職人", lines:["火床に近づくな。登録前の客には武器の研ぎも慎重になる。", "腕より先に、信用を持ってこい。"] },
  innkeeper: { speaker:"宿屋の女将", lines:["部屋はあるよ。長逗留ならギルド証か教会の確認書を見せておくれ。"] },
  reception_after: { speaker:"ギルド受付", lines:["受付処理は進んでいます。次は指定された目的を済ませてください。", "同じ説明を聞くより、行動で確認する方が早いです。"] },
  priest_after: { speaker:"司祭", lines:["確認書の話は済みました。ギルドに戻れば受付が読めるはずです。"] }
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 1500);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, powerPreference:"high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
renderer.shadowMap.enabled = quality.shadow;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const world = new THREE.Group();
scene.add(world);
const clock = new THREE.Clock();
const player = createPerson({ variant:"player", color:0x24395d });
scene.add(player);

const state = {
  player:{ stamina:100, maxStamina:100, ...clone(basePlayer) },
  quest: mergeQuests(baseQuests, extraQuests), map: initialMap(),
  keys:new Set(), yaw:0, pitch:.06, cameraMode:"third", debug:params.has("debug"), started:false,
  dragging:false, lastX:0, lastY:0, activeTarget:null, inDialogue:false, dialogueId:null, dialogueLine:0, selectedChoice:0,
  choiceCooldown:0, padButtons:[], isDashing:false, fireCooldown:0, burstCooldown:0, cameraShake:0, hitStop:0, moverAcc:0, cullAcc:0
};

let npcs=[], locations=[], movers=[], colliders=[], cullables=[], colliderGrid=new Map();
let bounds={minX:-90,maxX:90,minZ:-130,maxZ:130};
let caravan=null, beast=null, merchant=null;
const projectiles=[], bursts=[];
const gridSize=24;
const mats=new Map();

initLights();
loadMap(state.map, initialSpawn(state.map));
updateHud();
setTimeout(()=>ui.loading?.classList.add("is-hidden"),250);
requestAnimationFrame(loop);

function mergeQuests(a,b){ const m=new Map(); [...a,...b].forEach(q=>m.set(q.id,{...q})); return [...m.values()]; }
function initialMap(){ const q=params.get("map"); return (data.maps && data.maps[q]) || q==="plaza" ? (q || data.startMap || "forestRoad") : (data.startMap || "forestRoad"); }
function initialSpawn(id){ return ({ forestRoad:data.startSpawn || {x:0,z:74}, plaza:{x:0,z:610}, guildHall:{x:0,z:6.4}, church:{x:0,z:5.5}, trainingGround:{x:0,z:48} })[id] || {x:0,z:74}; }
function initLights(){
  scene.add(new THREE.HemisphereLight(0xf7eddb,0x28364a,2.7));
  const sun=new THREE.DirectionalLight(0xfff0ce,3.15); sun.position.set(80,120,60); sun.castShadow=quality.shadow;
  sun.shadow.mapSize.set(1536,1536); Object.assign(sun.shadow.camera,{near:.5,far:520,left:-360,right:360,top:360,bottom:-360}); scene.add(sun);
}
function mat(color,rough=.82,em=0x000000,power=0){ const k=`${color}-${rough}-${em}-${power}`; if(!mats.has(k)) mats.set(k,new THREE.MeshStandardMaterial({color,roughness:rough,emissive:em,emissiveIntensity:power,flatShading:true})); return mats.get(k); }
function add(geo,material,parent=world,cast=false,receive=true){ const m=new THREE.Mesh(geo,material); m.castShadow=Boolean(cast&&quality.shadow); m.receiveShadow=receive; parent.add(m); return m; }
function rand(a,b){return a+Math.random()*(b-a)}
function pick(a){return a[Math.floor(rand(0,a.length))]}
function questDone(id){return state.quest.some(q=>q.id===id&&q.done)}
function env(color,near,far){scene.background=new THREE.Color(color); scene.fog=new THREE.Fog(color,near,far)}
function keyFor(x,z){return `${Math.floor(x/gridSize)},${Math.floor(z/gridSize)}`}
function addCollider(x,z,w,d,label=""){ const c={x,z,w,d,label}; colliders.push(c); const minX=Math.floor((x-w/2)/gridSize),maxX=Math.floor((x+w/2)/gridSize),minZ=Math.floor((z-d/2)/gridSize),maxZ=Math.floor((z+d/2)/gridSize); for(let gx=minX;gx<=maxX;gx++)for(let gz=minZ;gz<=maxZ;gz++){const k=`${gx},${gz}`; if(!colliderGrid.has(k)) colliderGrid.set(k,[]); colliderGrid.get(k).push(c)} return c }
function nearColliders(x,z,r=2){ const out=[],seen=new Set(); const minX=Math.floor((x-r)/gridSize),maxX=Math.floor((x+r)/gridSize),minZ=Math.floor((z-r)/gridSize),maxZ=Math.floor((z+r)/gridSize); for(let gx=minX;gx<=maxX;gx++)for(let gz=minZ;gz<=maxZ;gz++){const cell=colliderGrid.get(`${gx},${gz}`); if(!cell)continue; for(const c of cell)if(!seen.has(c)){seen.add(c);out.push(c)}} return out }
function colliderAt(x,z,r=.58,dynamic=true){ for(const c of nearColliders(x,z,r+2)){ if(x>c.x-c.w/2-r&&x<c.x+c.w/2+r&&z>c.z-c.d/2-r&&z<c.z+c.d/2+r)return c } if(dynamic){ for(const m of movers){ if(m.object.visible===false)continue; const rr=(m.radius||.7)+r; if(Math.hypot(x-m.object.position.x,z-m.object.position.z)<rr)return m } } return null }
function registerCullable(o,type="prop",x=o.position.x,z=o.position.z,range=quality.cull){ cullables.push({o,type,x,z,range}); return o }
function box(x,y,z,w,h,d,color,label="",parent=world,type="prop"){ const m=add(new THREE.BoxGeometry(w,h,d),mat(color),parent,label==="major"||label==="castle"||label==="guild"||label==="church",true); m.position.set(x,y,z); if(parent===world&&label)addCollider(x,z,w,d,label); if(parent===world)registerCullable(m,type,x,z,type==="major"?quality.cull*2.8:quality.cull); return m }
function cyl(x,y,z,r,h,color,label="",parent=world,type="prop"){ const m=add(new THREE.CylinderGeometry(r,r,h,12),mat(color),parent,label==="major",true); m.position.set(x,y,z); if(parent===world&&label)addCollider(x,z,r*2,r*2,label); if(parent===world)registerCullable(m,type,x,z,type==="major"?quality.cull*2.8:quality.cull); return m }
function ground(w,d,color){ const g=add(new THREE.PlaneGeometry(w,d),mat(color,.95),world,false,true); g.rotation.x=-Math.PI/2; return g }
function road(x,z,w,d,color=0x766b5b){ const r=box(x,.025,z,w,.05,d,color,"",world,"major"); r.receiveShadow=true; return r }

function loadMap(id,spawn){
  state.map=id; world.clear(); npcs.forEach(n=>scene.remove(n)); npcs=[]; locations=[]; movers=[]; colliders=[]; cullables=[]; colliderGrid=new Map(); caravan=beast=merchant=null; projectiles.length=0; bursts.length=0;
  const builders={forestRoad:buildForestRoad,plaza:buildMegaCity,guildHall:buildGuildHall,church:buildChurch,trainingGround:buildTrainingGround}; (builders[id]||buildMegaCity)();
  const md=(data.maps&&data.maps[id])||{name:id,minimap:""};
  locations=(md.locations||[]).map(l=>({...l,kind:l.targetMap?"door":"spot"})); addMapLocations(id);
  locations.forEach(addMarker); (md.npcs||[]).forEach(addNpc);
  player.position.set(spawn.x,spawn.y||0,spawn.z); updateCulling(true); updateHud();
}
function addMapLocations(id){
  if(id==="forestRoad") locations.push({id:"road_gate",name:"北門の検問を受ける",position:{x:0,z:-108},dialogue:"north_gate_scene",radius:5,kind:"spot"});
  if(id==="plaza") locations.push(
    {id:"plaza_info",name:"中央広場を見渡す",position:{x:0,z:40},dialogue:"central_plaza_scene",radius:10,kind:"spot"},
    {id:"north_gate_inside",name:"北門へ戻る",position:{x:0,z:610},targetMap:"forestRoad",spawn:{x:0,z:-96},radius:10,kind:"door"},
    {id:"guild_entry_big",name:"冒険者ギルドに入る",position:{x:135,z:-60},dialogue:"guild_gate_scene",radius:9,kind:"spot"},
    {id:"market_case",name:"市場の盗難騒ぎを見る",position:{x:260,z:95},dialogue:"market_case_scene",radius:12,kind:"spot"},
    {id:"church_record",name:"教会記録所で相談する",position:{x:-185,z:-70},dialogue:"church_record_scene",radius:11,kind:"spot"},
    {id:"training_scene",name:"外門練習場で魔法を試す",position:{x:360,z:330},dialogue:"training_scene",radius:12,kind:"spot"},
    {id:"shady_alley",name:"怪しい路地裏に入る",position:{x:-390,z:235},dialogue:"shady_alley",radius:10,kind:"spot"},
    {id:"fountain",name:"噴水広場を調べる",position:{x:0,z:0},dialogue:"fountain_hint",radius:9,kind:"spot"},
    {id:"blacksmith",name:"鍛冶屋に近づく",position:{x:330,z:-110},dialogue:"blacksmith",radius:8,kind:"spot"},
    {id:"inn",name:"宿屋を見る",position:{x:92,z:82},dialogue:"innkeeper",radius:8,kind:"spot"}
  );
}

function buildForestRoad(){
  env(0x6f91a1,40,quality.fogFar); bounds={minX:-95,maxX:95,minZ:-135,maxZ:135}; ground(210,290,0x35513d); road(0,0,9,260,0x746756);
  for(let z=-120;z<=120;z+=18){ road(-15,z,20,3.2,0x665b4f); road(16,z+8,18,2.8,0x665b4f) }
  for(let i=0;i<Math.floor(260*quality.trees);i++){ const side=Math.random()<.5?-1:1; addTree(side*rand(12,86),rand(-128,128),rand(.8,1.55),true) }
  for(let i=0;i<Math.floor(70*quality.propMul);i++) addRock(rand(-85,85),rand(-125,125),rand(.3,.8));
  addGateModel(0,-112); addCaravanScene(6,15); addWanderingGuards(); addSignPost(-6,82,"STATUS"); addSignPost(7,-90,"ROYAL CAPITAL");
}
function buildMegaCity(){
  env(0x9db9c5,70,quality.fogFar+260); bounds={minX:-680,maxX:680,minZ:-680,maxZ:680}; ground(1420,1420,0x4d634d);
  cityWall();
  road(0,0,24,1240,0x817767); road(0,0,1240,24,0x817767); road(-220,0,13,1040,0x746958); road(220,0,13,1040,0x746958); road(0,-230,1040,13,0x746958); road(0,230,1040,13,0x746958);
  for(const z of [-430,-330,-130,130,330,430]) road(0,z,980,9,0x6f6657);
  for(const x of [-430,-330,-130,130,330,430]) road(x,0,9,980,0x6f6657);
  addCastle(0,-535); addCentralPlaza(); addGuildDistrict(135,-70); addChurchDistrict(-185,-85); addMarketDistrict(285,85); addCraftDistrict(350,-125); addNobleDistrict(-250,-350); addSlumDistrict(-410,245); addTrainingDistrict(380,330); addGateDistrict(0,610);
  generateDenseBlocks(); addTrafficCarts(); addPedestrians(); addStreetDetails(); addSignPost(0,610,"NORTH GATE"); addSignPost(135,-38,"GUILD"); addSignPost(-185,-48,"CHURCH"); addSignPost(285,125,"MARKET"); addSignPost(-390,235,"ALLEY"); addSignPost(0,-445,"CASTLE");
}
function cityWall(){ for(const [x,z,w,d] of [[0,-675,1320,10],[0,675,1320,10],[-675,0,10,1320],[675,0,10,1320]]) box(x,5,z,w,10,d,0x6d6c64,"wall",world,"major"); for(let i=-620;i<=620;i+=75){ box(i,10,-675,10,18,10,0x74736b,"tower",world,"major"); box(i,10,675,10,18,10,0x74736b,"tower",world,"major"); box(-675,10,i,10,18,10,0x74736b,"tower",world,"major"); box(675,10,i,10,18,10,0x74736b,"tower",world,"major") } }
function addGateModel(x,z){ box(x,4,z,38,8,7,0x6d6c64,"gate",world,"major"); box(x-15,11,z,7,18,10,0x74736b,"gateTower",world,"major"); box(x+15,11,z,7,18,10,0x74736b,"gateTower",world,"major") }
function addGateDistrict(x,z){ addGateModel(x,z+55); for(let i=-2;i<=2;i++) addGuard(x+i*6,z-8); box(x-22,2,z-25,20,4,14,0x6a5e52,"checkpoint",world,"major"); box(x+22,2,z-25,20,4,14,0x6a5e52,"checkpoint",world,"major") }
function addCastle(x,z){ box(x,9,z,92,18,64,0x8b8a82,"castle",world,"major"); box(x,20,z-24,54,22,30,0x989790,"castle",world,"major"); for(const [sx,sz] of [[-45,-30],[45,-30],[-45,30],[45,30],[0,-58]]){ box(x+sx,18,z+sz,15,36,15,0x7e7d76,"castle",world,"major"); const roof=add(new THREE.ConeGeometry(11,16,4),mat(0x394456),world,true); roof.position.set(x+sx,44,z+sz); roof.rotation.y=Math.PI/4; registerCullable(roof,"major",x+sx,z+sz,quality.cull*3) } for(let i=-2;i<=2;i++) addFlag(x+i*16,z-66,0xc43d3d) }
function addCentralPlaza(){ road(0,0,86,86,0x8e8370); addFountain(0,0,3.2); const statue=box(0,3.2,-22,5,6,5,0x7c7a72,"statue",world,"major"); const head=add(new THREE.SphereGeometry(2.2,16,10),mat(0x8a887e),world,true); head.position.set(0,8.5,-22); registerCullable(head,"major",0,-22,quality.cull*2); for(let a=0;a<Math.PI*2;a+=Math.PI/4) addLamp(Math.cos(a)*38,Math.sin(a)*38) }
function addGuildDistrict(x,z){ addMedievalHouse(x,z,36,24,15,0x6a5036,"GUILD",true); box(x,3,z+13,9,6,.7,0x201610,"guild",world,"major"); addQuestBoard(x-22,z+4); for(let i=0;i<8;i++) addNpcObject("adventurer",x+rand(-28,28),z+rand(18,36),pick([0x8c6f4f,0x58718d,0x5f7b55])); addCrateStack(x+25,z+18,6); addStable(x-32,z+22) }
function addChurchDistrict(x,z){ addMedievalHouse(x,z,34,26,18,0x7c7a76,"CHURCH",true); const sp=add(new THREE.ConeGeometry(7,24,4),mat(0x2f3541),world,true); sp.position.set(x,32,z); sp.rotation.y=Math.PI/4; registerCullable(sp,"major",x,z,quality.cull*3); for(let i=0;i<8;i++) addNpcObject("faithful",x+rand(-35,35),z+rand(18,45),0xc9c4ad); addFountain(x-32,z+28,1.3) }
function addMarketDistrict(x,z){ for(let i=0;i<50*quality.propMul;i++){ const px=x+rand(-70,70), pz=z+rand(-50,50); addStall(px,pz,pick([0xb43d46,0x2f6f9f,0xd8b36b,0x3f815a])); if(i%5===0) addNpcObject("merchant",px+rand(-2,2),pz+rand(3,5),0x9a6f54) } for(let i=0;i<12;i++) addCrateStack(x+rand(-80,80),z+rand(-55,55),Math.floor(rand(3,8))) }
function addCraftDistrict(x,z){ addMedievalHouse(x,z,24,18,9,0x70482c,"SMITH",true); const forge=box(x+18,1.1,z+5,8,2.2,5,0x3a2a21,"forge",world,"major"); const fire=add(new THREE.SphereGeometry(1.1,12,8),mat(0xff6a1a,.4,0xff4a00,1.6),world,false); fire.position.set(x+18,2.6,z+5); registerCullable(fire,"major",x+18,z+5,quality.cull*2); box(x+10,.8,z-5,4,1.6,2.2,0x3d3d40,"anvil"); addNpcObject("blacksmith",x+22,z+8,0x6f4b32); for(let i=0;i<16;i++) addMedievalHouse(x+rand(-85,85),z+rand(-58,58),rand(8,13),rand(7,12),rand(5,9),pick([0x6d5237,0x70482c,0x5e5142]),pick(["TOOLS","BOW","LEATHER",null]),false) }
function addNobleDistrict(x,z){ for(let i=0;i<28*quality.houseMul;i++){ const px=x+rand(-110,110), pz=z+rand(-90,90); addMedievalHouse(px,pz,rand(14,24),rand(12,22),rand(9,15),pick([0x8b806d,0x90785e,0x7a776f]),null,true); if(i%4===0){ addFountain(px+rand(-12,12),pz+rand(12,18),.9); addGuard(px+rand(-10,10),pz+rand(-10,10)) } } }
function addSlumDistrict(x,z){ for(let i=0;i<80*quality.houseMul;i++) addSlumHouse(x+rand(-120,120),z+rand(-90,90)); for(let i=0;i<40*quality.propMul;i++) addCrateStack(x+rand(-125,125),z+rand(-95,95),Math.floor(rand(2,6))); for(let i=0;i<10;i++) addNpcObject("slum",x+rand(-100,100),z+rand(-80,80),0x4f4238); addAlleyDetails(x+20,z-10) }
function addTrainingDistrict(x,z){ box(x,.06,z,90,.12,55,0x746b56,"yard",world,"major"); for(let i=0;i<18;i++) cyl(x+rand(-38,38),1,z+rand(-22,22),.28,2,0x8a5d38,"target"); addNpcObject("guard",x-36,z+20,0xb77954); addSignPost(x,z+34,"TRAINING") }
function generateDenseBlocks(){ const zones=[[-360,80,-80,570,"slum"],[-520,-120,-520,-150,"noble"],[-60,520,-500,-180,"res"],[-560,560,150,560,"res"],[-560,-260,-120,120,"res"],[160,560,-60,280,"marketres"],[160,560,-300,-130,"craft"]]; for(const [x1,x2,z1,z2,type] of zones){ for(let x=x1;x<=x2;x+=38){ for(let z=z1;z<=z2;z+=34){ if(Math.abs(x)<55&&Math.abs(z)<55)continue; if(Math.random()>quality.houseMul*.75)continue; if(type==="slum") addSlumHouse(x+rand(-5,5),z+rand(-4,4)); else addMedievalHouse(x+rand(-4,4),z+rand(-4,4),rand(8,15),rand(8,13),rand(5,10),pick([0x7b5a3d,0x83684d,0x6d5d4a,0x8d6542]),Math.random()<.18?pick(["INN","FOOD","HERB","BAKER",null]):null,false) } } } }
function addStreetDetails(){ for(let i=0;i<180*quality.propMul;i++){ const x=rand(-590,590),z=rand(-590,590); if(Math.random()<.55)addCrateStack(x,z,Math.floor(rand(2,5))); else if(Math.random()<.75)addBarrel(x,z); else addRock(x,z,rand(.25,.6)) } for(let i=0;i<90*quality.propMul;i++) addLamp(rand(-600,600),rand(-600,600)) }

function addMedievalHouse(x,z,w,d,h,color,sign=null,important=false){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rand(-.025,.025); world.add(g); box(0,1.1,0,w*.95,2.2,d*.95,0x76614a,"",g); box(0,2.4+(h-2.2)/2,0,w,h-2.2,d,color,"",g); const roof=add(new THREE.ConeGeometry(Math.max(w,d)*.75,3.2,4),mat(pick([0x3b2a1e,0x2c4256,0x742831,0x4d2f28])),g,important); roof.position.set(0,h+1.6,0); roof.rotation.y=Math.PI/4; for(const sx of [-w*.29,w*.29])for(const yy of [1.8,3.0]){ box(sx,yy,d/2+.05,.72,.82,.08,0x9b835d,"",g); box(sx,yy,d/2+.1,.48,.58,.04,0x83a4b6,"",g) } box(0,1.05,d/2+.1,1.4,1.9,.14,0x201610,"",g); if(sign){ const lab=createLabel(sign); lab.scale.set(1.2,.3,1); lab.position.set(0,2.9,d/2+.45); g.add(lab) } if(Math.random()<.45) box(-w*.35,h+1.8,-d*.2,.5,1.8,.5,0x50453b,"",g); addCollider(x,z,w,d,important?"major":"house"); registerCullable(g,important?"major":"prop",x,z,important?quality.cull*3:quality.cull) }
function addSlumHouse(x,z){ const w=rand(5,10),d=rand(5,9),h=rand(3,6); const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rand(-.12,.12); world.add(g); box(0,h/2,0,w,h,d,pick([0x4f4238,0x5d4b39,0x6d5237]),"",g); const roof=box(0,h+.45,0,w*1.1,.8,d*1.05,pick([0x2d2520,0x3b2a1e,0x4d2f28]),"",g); roof.rotation.z=rand(-.08,.08); if(Math.random()<.55)box(rand(-w*.3,w*.3),h*.6,d/2+.08,1.2,.08,.08,0x8f7a5c,"",g); addCollider(x,z,w,d,"slumHouse"); registerCullable(g,"prop",x,z,quality.cull) }
function addStall(x,z,color){ const g=new THREE.Group(); g.position.set(x,0,z); world.add(g); box(0,.35,0,3,.7,1.7,0x6a4d35,"",g); const roof=box(0,1.35,0,3.5,.14,2.3,color,"",g); roof.rotation.z=rand(-.08,.08); for(let i=0;i<4;i++){ const item=add(new THREE.DodecahedronGeometry(.16,0),mat(pick([0xbf5545,0xd8b36b,0x5f9056,0x8f6b3f])),g,false); item.position.set(rand(-1.1,1.1),.85,rand(-.5,.5)) } addCollider(x,z,3.5,2.3,"stall"); registerCullable(g,"prop",x,z,quality.cull) }
function addBarrel(x,z){ cyl(x,.45,z,.33,.8,0x6b432d,"barrel") }
function addRock(x,z,s=.55){ const r=add(new THREE.DodecahedronGeometry(s,0),mat(0x6b6b62,.95),world,false); r.position.set(x,.2,z); r.scale.y=.55; addCollider(x,z,s*1.2,s*1.2,"rock"); registerCullable(r,"prop",x,z,quality.cull) }
function addTree(x,z,s=1,solid=false){ const g=new THREE.Group(); g.position.set(x,0,z); world.add(g); cyl(0,.75*s,0,.18*s,1.5*s,0x5b3a24,"",g); const l1=add(new THREE.DodecahedronGeometry(1*s,0),mat(0x2f6f45),g,false); l1.position.y=1.8*s; const l2=add(new THREE.DodecahedronGeometry(.65*s,0),mat(0x3d8a59),g,false); l2.position.set(.35*s,2.35*s,-.12*s); if(solid)addCollider(x,z,.9*s,.9*s,"tree"); registerCullable(g,"prop",x,z,quality.cull) }
function addCrateStack(x,z,n){ for(let i=0;i<n;i++){ box(x+(i%2)*.75,.35+Math.floor(i/2)*.38,z+Math.floor(i/2)*.75,.7,.7,.7,0x735334,"crate") } }
function addLamp(x,z){ cyl(x,1.4,z,.08,2.8,0x3d342f,"",world,"major"); const l=add(new THREE.SphereGeometry(.18,10,8),mat(0xe7c56f,.4,0xe7c56f,.85),world,false); l.position.set(x+.35,2.5,z); registerCullable(l,"prop",x,z,quality.cull) }
function addFountain(x,z,s=1){ cyl(x,.4*s,z,1.8*s,.8*s,0x6f7a80,"fountain",world,"major"); const w=add(new THREE.CylinderGeometry(1.35*s,1.35*s,.08,24),mat(0x69a7d2,.25,0x69a7d2,.12),world,false); w.position.set(x,.85*s,z); registerCullable(w,"major",x,z,quality.cull*2) }
function addFlag(x,z,color){ cyl(x,6,z,.07,12,0x332315,"",world,"major"); box(x+.9,10,z,1.8,1.1,.08,color,"",world,"major") }
function addSignPost(x,z,text){ cyl(x,.75,z,.08,1.5,0x332315,"",world,"major"); const s=createLabel(text); s.scale.set(1.55,.42,1); s.position.set(x,1.75,z); world.add(s); registerCullable(s,"major",x,z,quality.cull*2) }
function addQuestBoard(x,z){ box(x,1.25,z,.18,2.2,2.2,0x4a301c,"questBoard",world,"major"); const l=createLabel("QUEST"); l.scale.set(1.3,.34,1); l.position.set(x+.15,2.55,z); world.add(l) }
function addStable(x,z){ box(x,1.5,z,10,3,7,0x5a402c,"stable"); for(let i=0;i<2;i++){ const h=createHorse(); h.position.set(x-2+i*4,0,z); world.add(h); registerCullable(h,"major",x,z,quality.cull) } }
function addAlleyDetails(x,z){ for(let i=0;i<12;i++){ addBarrel(x+rand(-25,25),z+rand(-20,20)); addLamp(x+rand(-35,35),z+rand(-35,35)) } const circle=add(new THREE.TorusGeometry(3,.08,8,30),mat(0x7446aa,.45,0x5c28ff,.6),world,false); circle.position.set(x,0.08,z); circle.rotation.x=Math.PI/2; registerCullable(circle,"major",x,z,quality.cull*2) }
function addMarker(l){ const c=l.targetMap?0xd8b36b:0x87c7ff; const ring=add(new THREE.TorusGeometry(.9,.035,8,32),mat(c,.42,c,.7),world,false,false); ring.position.set(l.position.x,.08,l.position.z); ring.rotation.x=Math.PI/2; const cone=add(new THREE.ConeGeometry(.2,1,4),mat(c,.45,c,.55),world,false,false); cone.position.set(l.position.x,.9,l.position.z); cone.rotation.y=Math.PI/4; registerCullable(ring,"major",l.position.x,l.position.z,quality.cull*2); registerCullable(cone,"major",l.position.x,l.position.z,quality.cull*2) }

function addTrafficCarts(){ const routes=[[[-610,15],[-220,15],[80,15],[610,15]],[[15,620],[15,260],[15,-40],[15,-610]],[[-15,-610],[-15,-300],[-15,40],[-15,620]],[[240,260],[350,90],[420,-120],[260,-260]]]; for(let i=0;i<quality.carts;i++){ const cart=createMovingCart(); const p=routes[i%routes.length][0]; cart.position.set(p[0],0,p[1]+i*4); world.add(cart); movers.push({type:"cart",object:cart,path:routes[i%routes.length],index:1,speed:rand(2.4,4.2),wait:0,radius:2.35}) } }
function addPedestrians(){ const routes=[[[-580,8],[-280,8],[0,8],[280,8],[580,8]],[[8,600],[8,260],[8,-80],[8,-580]],[[-390,260],[-420,230],[-360,180],[-300,210]],[[230,100],[300,110],[350,80],[280,40]],[[130,-55],[0,0],[-185,-75]]]; const count=Math.floor(45*quality.npcMul); for(let i=0;i<count;i++){ const path=clone(pick(routes)); const p=createPerson({variant:pick(["traveler","merchant","adventurer","faithful","slum"]),color:pick([0x7f9fbd,0x8c6f4f,0x6f8aa6,0x8c7b5b,0x9a6f54])}); p.position.set(path[0][0]+rand(-4,4),0,path[0][1]+rand(-4,4)); scene.add(p); npcs.push(p); movers.push({type:"ped",object:p,path,index:1,speed:rand(1.1,2.2),wait:rand(0,1),radius:.62}) } }
function addWanderingGuards(){ for(let i=0;i<4;i++) addGuard(rand(-6,6),rand(-70,55),true) }
function addGuard(x,z,moving=false){ const g=addNpcObject("guard",x,z,0xb77954); if(moving)movers.push({type:"ped",object:g,path:[[x,z+40],[x,z],[x,z-70]],index:1,speed:1.6,wait:0,radius:.72}); return g }
function addNpcObject(variant,x,z,color){ const n=createPerson({variant,color}); n.position.set(x,0,z); n.userData={id:variant+Math.random(),kind:"npc",name:npcName(variant),dialogue:npcDialogue(variant),radius:.75}; addNameLabel(n,n.userData.name,.85); scene.add(n); npcs.push(n); return n }
function npcName(v){ return {guard:"衛兵",merchant:"商人",adventurer:"冒険者",faithful:"信徒",blacksmith:"鍛冶職人",slum:"路地の住人"}[v]||"通行人" }
function npcDialogue(v){ return {guard:"guard_checkpoint",merchant:"market_case_scene",adventurer:"adventurer_chatter",faithful:"church_faithful",blacksmith:"blacksmith",slum:"shady_alley"}[v]||"fountain_hint" }
function addNpc(npc){ const n=createPerson(npc); n.position.set(npc.position.x,0,npc.position.z); n.userData={...npc,kind:"npc",radius:.75}; addNameLabel(n,npc.name,1); scene.add(n); npcs.push(n) }
function addNameLabel(obj,text,scale=1){ const label=createLabel(text); label.scale.set(2*scale,.5*scale,1); label.position.set(0,2.55,0); obj.add(label) }
function createMovingCart(){ const g=new THREE.Group(); box(0,.55,0,2.8,.8,1.6,0x70482c,"",g); const horse=createHorse(); horse.position.set(0,0,-1.55); g.add(horse); for(const sx of [-1.3,1.3])for(const sz of [-.7,.7]){ const w=add(new THREE.TorusGeometry(.36,.07,8,18),mat(0x2c2018),g,false); w.position.set(sx,.35,sz); w.rotation.y=Math.PI/2 } return g }
function createHorse(){ const g=new THREE.Group(); box(0,.78,0,1.15,.55,.38,0x5b3a28,"",g); const neck=box(.5,1.05,0,.25,.55,.22,0x5b3a28,"",g); neck.rotation.z=-.35; box(.75,1.25,0,.35,.25,.25,0x5b3a28,"",g); for(const x of [-.38,.38])for(const z of [-.14,.14])box(x,.34,z,.12,.65,.12,0x3b281d,"",g); return g }

function addCaravanScene(x,z){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=-.22; world.add(g); caravan=g; const cart=box(0,.55,0,2.4,.6,1.45,0x6a4328,"",g); cart.rotation.z=questDone("merchant")?.05:-.18; for(const sx of [-1.25,1.25])for(const sz of [-.66,.66]){ const w=add(new THREE.TorusGeometry(.36,.075,8,18),mat(0x2c2018),g,false); w.position.set(sx,.35,sz); w.rotation.y=Math.PI/2 } for(let i=0;i<10;i++){ const b=box(rand(-.9,.9),.95+Math.floor(i/3)*.33,rand(-.52,.52),.48,.38,.48,pick([0x8c6239,0x6d5237,0x9a7b4d]),"",g); b.rotation.y=rand(-.45,.45) } const horse=createHorse(); horse.position.set(-2.15,.05,0); horse.rotation.y=Math.PI/2; g.add(horse); merchant=createPerson({variant:"merchant",color:0x6f8aa6}); merchant.position.set(.78,.06,questDone("merchant")?1.55:1.08); merchant.rotation.z=questDone("merchant")?0:Math.PI/2; g.add(merchant); if(!questDone("merchant")){ beast=createBeast(); beast.position.set(2.05,.05,-.55); beast.rotation.y=-Math.PI/2; g.add(beast) } addCollider(x,z,4.2,3.4,"caravan"); registerCullable(g,"major",x,z,quality.cull*2) }
function createBeast(){ const g=new THREE.Group(); box(0,.62,0,.95,.42,.36,0x111015,"",g); box(-.58,.72,0,.36,.28,.32,0x09090d,"",g); box(-.76,.61,0,.22,.1,.28,0x3a0c0c,"",g); for(const x of [-.32,.32])for(const z of [-.13,.13])box(x,.28,z,.11,.46,.11,0x09090d,"",g); for(const z of [-.09,.09]){ const e=add(new THREE.SphereGeometry(.035,8,6),mat(0xff2a1c,.2,0xff2a1c,1.1),g,false); e.position.set(-.77,.78,z)} return g }
function createPerson(n){ const g=new THREE.Group(),v=n.variant||"traveler",base=n.color||0x6f8aa6,skin=0xd8ad84,hair=v==="receptionist"?0xf1dbc5:v==="priest"||v==="faithful"?0xd5cfbc:v==="merchant"?0x5a392a:0x2e2218; body(g,base,v==="priest"||v==="faithful"?0xcfc8b4:null); head(g,skin,hair,v==="receptionist"?"bun":v==="priest"?"hood":"short"); limbs(g,base,v==="priest"||v==="faithful"?0xc7c2b1:0x252d3c,0x39281c,skin); if(v==="guard"){ box(0,1,.28,.62,.58,.18,0xa8acb6,"",g); const spear=cyl(-.42,1.05,0,.03,2.2,0x6e5134,"",g); spear.rotation.z=.1 } if(v==="merchant")box(.28,1.08,.26,.18,.55,.12,0xd8b36b,"",g); if(v==="adventurer"){ const blade=box(.43,1.02,-.28,.08,.8,.08,0xc8cbd0,"",g); blade.rotation.z=.45 } if(v==="blacksmith")box(0,1.25,.31,.65,.35,.12,0x333333,"",g); return g }
function body(g,color,robe){ box(0,1.02,0,.74,.92,.38,color,"",g); if(robe){ const rb=add(new THREE.ConeGeometry(.5,.95,6),mat(robe),g,false); rb.position.set(0,.55,-.03); rb.rotation.x=Math.PI } else { const cape=box(0,.86,-.31,.62,.55,.12,0x1b2740,"",g); cape.rotation.x=.12 } box(0,.74,0,.82,.11,.46,0x8c6740,"",g) }
function head(g,skin,hair,style){ cyl(0,1.49,0,.08,.14,skin,"",g); add(new THREE.SphereGeometry(.29,16,12),mat(skin),g,false).position.set(0,1.78,0); [[-.1,1.8,.285],[.1,1.8,.285]].forEach(p=>box(p[0],p[1],p[2],.055,.035,.018,0x17223a,"",g)); const cap=add(new THREE.SphereGeometry(.335,14,10),mat(hair),g,false); cap.scale.set(1.05,style==="hood"?.9:.54,1.03); cap.position.set(0,style==="hood"?1.82:1.95,-.035); if(style!=="hood")[-.17,0,.17].forEach((x,i)=>{ const bang=box(x,1.87,.295,.11,.24,.055,hair,"",g); bang.rotation.z=(i-1)*.18 }) }
function limbs(g,sleeve,leg,boot,skin){ [-1,1].forEach(s=>{ const a=box(s*.46,1.05,0,.17,.52,.17,sleeve,"",g); a.rotation.z=s*.16; add(new THREE.SphereGeometry(.085,8,6),mat(skin),g,false).position.set(s*.52,.72,.03); box(s*.15,.38,0,.19,.62,.19,leg,"",g); box(s*.15,.07,.08,.22,.16,.34,boot,"",g) }) }

function buildGuildHall(){ env(0x1f1711,12,34); bounds={minX:-8,maxX:8,minZ:-7,maxZ:7}; ground(16,15,0x4c3727); roomWalls(16,15,3.2,0x3a281c); box(0,.55,-4.5,6.4,1.1,.9,0x6b4a2f,"counter",world,"major"); box(0,1.2,-6.2,5.6,2.4,.5,0x5a3d27,"shelf",world,"major"); addQuestBoard(-5.6,-4.4); for(let i=0;i<6;i++)addCrateStack(rand(-6,6),rand(-2,5),2); addNpcObject("receptionist",0,-3.3,0xd8b36b); addNpcObject("adventurer",-3.8,.9,0x8c6f4f) }
function buildChurch(){ env(0x151823,12,34); bounds={minX:-7,maxX:7,minZ:-7,maxZ:7}; ground(14,14,0x5b5a55); roomWalls(14,14,4,0x44434a); box(0,.55,-4.4,3.8,1.05,1.25,0xddd1ae,"altar",world,"major"); for(let i=0;i<4;i++){ box(-2.6,.28,-1.2+i*1.45,2.4,.35,.55,0x5d4129,"bench"); box(2.6,.28,-1.2+i*1.45,2.4,.35,.55,0x5d4129,"bench") } addNpcObject("priest",0,-2.5,0xc9c4ad) }
function buildTrainingGround(){ env(0x88a6b4,25,180); bounds={minX:-60,maxX:60,minZ:-70,maxZ:70}; ground(130,150,0x556c4c); road(0,0,18,130,0x776b5a); for(let i=0;i<18;i++)cyl(rand(-35,35),.85,rand(-40,40),.25,1.7,0x7a5635,"target"); addSignPost(0,48,"TO CAPITAL") }
function roomWalls(w,d,h,color){ [[0,-d/2,w,.35],[-w/2,0,.35,d],[w/2,0,.35,d],[-w*.3,d/2,w*.4,.35],[w*.3,d/2,w*.4,.35]].forEach(([x,z,ww,dd])=>box(x,h/2,z,ww,h,dd,color,"wall")) }

function updateMovers(dt){ state.moverAcc+=dt; if(state.moverAcc<.06)return; const step=state.moverAcc; state.moverAcc=0; for(const m of movers){ if(m.object.visible===false&&!state.debug)continue; if(m.wait>0){m.wait-=step;continue} const target=m.path[m.index]; const dx=target[0]-m.object.position.x,dz=target[1]-m.object.position.z,dist=Math.hypot(dx,dz); if(dist<1.5){m.index=(m.index+1)%m.path.length; if(m.type==="ped")m.wait=rand(.2,1.3); continue} const vx=dx/dist,vz=dz/dist; const nx=m.object.position.x+vx*m.speed*step,nz=m.object.position.z+vz*m.speed*step; if(m.type==="cart"&&colliderAt(nx,nz,m.radius||2.2,false)){m.wait=.5;continue} m.object.position.x=nx;m.object.position.z=nz;m.object.rotation.y=Math.atan2(vx,vz); if(m.type==="ped")m.object.position.y=Math.abs(Math.sin(clock.elapsedTime*5))*0.025 } }
function updateCulling(force=false){ state.cullAcc-=force?99:1; if(!force&&state.cullAcc>0)return; state.cullAcc=10; const px=player.position.x,pz=player.position.z; for(const c of cullables)c.o.visible=state.debug||Math.hypot(px-c.x,pz-c.z)<=c.range; for(const n of npcs)n.visible=state.debug||Math.hypot(px-n.position.x,pz-n.position.z)<=quality.cull; for(const m of movers)m.object.visible=state.debug||Math.hypot(px-m.object.position.x,pz-m.object.position.z)<=(m.type==="cart"?quality.cull*1.4:quality.cull) }
function createBurst(pos,color=0xff7a1c){ const g=new THREE.Group(); g.position.copy(pos); world.add(g); for(let i=0;i<16;i++){ const s=add(new THREE.SphereGeometry(.06,8,6),mat(color,.32,color,1.4),g,false,false); const a=i/16*Math.PI*2; s.userData.vel=new THREE.Vector3(Math.cos(a)*rand(1.4,3),rand(.4,1.8),Math.sin(a)*rand(1.4,3)) } bursts.push({g,life:.5,max:.5}) }
function castFireball(mode="action"){ const cd=mode==="burst"?state.burstCooldown:state.fireCooldown; if(mode!=="story"&&cd>0)return; const cost=mode==="burst"?8:3; if(mode!=="story"&&state.player.mp<cost)return; if(mode!=="story"){state.player.mp-=cost; if(mode==="burst")state.burstCooldown=.95; else state.fireCooldown=.32; updateHud()} const start=new THREE.Vector3(); camera.getWorldPosition(start); if(state.cameraMode!=="first")start.copy(player.position).add(new THREE.Vector3(0,1.35,0)); const dir=new THREE.Vector3(); camera.getWorldDirection(dir); const ball=add(new THREE.SphereGeometry(mode==="burst"?.34:.22,16,10),mat(0xff7a1c,.2,0xff5a00,2.2),world,false,false); ball.position.copy(start); let target=null; if(mode==="story"&&beast){target=new THREE.Vector3(); beast.getWorldPosition(target); target.y=.8} projectiles.push({mesh:ball,dir,start:start.clone(),target,t:0,speed:mode==="burst"?42:32,life:2.5}) }
function updateEffects(dt,t){ state.fireCooldown=Math.max(0,state.fireCooldown-dt); state.burstCooldown=Math.max(0,state.burstCooldown-dt); state.cameraShake=Math.max(0,state.cameraShake-dt*3); if(ui.cooldowns.fire)ui.cooldowns.fire.value=state.fireCooldown>0?1-state.fireCooldown/.32:1; if(ui.cooldowns.burst)ui.cooldowns.burst.value=state.burstCooldown>0?1-state.burstCooldown/.95:1; if(beast&&!questDone("merchant")){beast.position.x=2+Math.sin(t*4.2)*.25; beast.position.y=.05+Math.abs(Math.sin(t*5.2))*.08; beast.rotation.z=Math.sin(t*6)*.1} for(let i=projectiles.length-1;i>=0;i--){ const p=projectiles[i]; p.t+=dt;p.life-=dt; if(p.target){const k=Math.min(1,p.t*1.8); p.mesh.position.lerpVectors(p.start,p.target,k); if(k>=1)hitProjectile(p,i)}else{p.mesh.position.addScaledVector(p.dir,p.speed*dt); if(p.life<=0||p.mesh.position.distanceTo(player.position)>120)hitProjectile(p,i,false)}} for(let i=bursts.length-1;i>=0;i--){const b=bursts[i]; b.life-=dt; b.g.scale.setScalar(1+(1-b.life/b.max)*2.2); b.g.children.forEach(s=>s.position.addScaledVector(s.userData.vel,dt)); if(b.life<=0){world.remove(b.g);bursts.splice(i,1)}} }
function hitProjectile(p,i,explode=true){ if(explode){createBurst(p.mesh.position.clone()); state.cameraShake=.18; state.hitStop=.035} world.remove(p.mesh); projectiles.splice(i,1) }
function dodge(){ if(state.inDialogue||!state.started)return; const back=new THREE.Vector3(Math.sin(state.yaw),0,Math.cos(state.yaw)); tryMove(back.x*2.8,back.z*2.8,0); createBurst(player.position.clone().add(new THREE.Vector3(0,.5,0)),0x87c7ff) }
function loop(){ const raw=Math.min(clock.getDelta(),.05),t=clock.elapsedTime; let dt=raw; if(state.hitStop>0){state.hitStop-=raw;dt=0} viewKeys(dt); gamepad(dt); move(dt); if(dt>0){updateMovers(dt);updateEffects(dt,t);updateCulling()} detect(); cameraUpdate(); renderer.render(scene,camera); requestAnimationFrame(loop) }
function viewKeys(dt){ if(!state.started||state.inDialogue)return; state.yaw+=((state.keys.has("ArrowLeft")?1:0)-(state.keys.has("ArrowRight")?1:0))*2.25*dt; state.pitch=THREE.MathUtils.clamp(state.pitch+((state.keys.has("ArrowUp")?1:0)-(state.keys.has("ArrowDown")?1:0))*1.35*dt,-.55,.75) }
function pad(){const ps=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[]; return ps.find(p=>/dualshock|wireless controller|dualsense|playstation/i.test(p.id))||ps[0]||null}
function dz(v){return Math.abs(v)<.16?0:v}
function gamepad(dt){ state.choiceCooldown=Math.max(0,state.choiceCooldown-dt); const p=pad(); if(!p||!state.started)return; const now=p.buttons.map(b=>b.pressed),down=i=>now[i]&&!state.padButtons[i]; if(state.inDialogue){const y=dz(p.axes[1]||0); if((down(13)||y>.55)&&state.choiceCooldown<=0){moveChoice(1);state.choiceCooldown=.22} if((down(12)||y<-.55)&&state.choiceCooldown<=0){moveChoice(-1);state.choiceCooldown=.22} if(down(0))confirmChoice(); if(down(1))closeDialogue(); state.padButtons=now; return} state.yaw-=dz(p.axes[2]||0)*2.8*dt; state.pitch=THREE.MathUtils.clamp(state.pitch-dz(p.axes[3]||0)*1.8*dt,-.55,.75); if(down(0)&&state.activeTarget)interact(); if(down(1))dodge(); if(down(2))castFireball("action"); if(down(3))castFireball("burst"); if(down(9)||down(11))toggleCamera(); state.padButtons=now }
function stick(){const p=pad(); return p?{x:dz(p.axes[0]||0),y:-dz(p.axes[1]||0),dash:(p.buttons[7]?.value||0)>.25||p.buttons[10]?.pressed}:{x:0,y:0,dash:false}}
function move(dt){ if(!state.started||state.inDialogue)return; const s=stick(); let x=(state.keys.has("KeyD")?1:0)-(state.keys.has("KeyA")?1:0)+s.x,y=(state.keys.has("KeyW")?1:0)-(state.keys.has("KeyS")?1:0)+s.y; if(state.keys.has("KeyJ")){castFireball("action");state.keys.delete("KeyJ")} if(state.keys.has("KeyK")){dodge();state.keys.delete("KeyK")} if(state.keys.has("KeyL")){castFireball("burst");state.keys.delete("KeyL")} const up=(state.debug&&state.keys.has("Space")?1:0)-(state.debug&&(state.keys.has("ControlLeft")||state.keys.has("ControlRight"))?1:0); const len=Math.hypot(x,y,up); if(len<.01){regen(dt,24);state.isDashing=false;return} x/=Math.max(1,len);y/=Math.max(1,len); state.isDashing=(state.keys.has("ShiftLeft")||state.keys.has("ShiftRight")||s.dash)&&state.player.stamina>2; const speed=state.debug?(state.isDashing?120:55):(state.isDashing?8.2:4.6); if(!state.debug)state.isDashing?state.player.stamina=Math.max(0,state.player.stamina-30*dt):regen(dt,18); const rx=Math.cos(state.yaw),rz=-Math.sin(state.yaw),fx=-Math.sin(state.yaw),fz=-Math.cos(state.yaw); const dx=(rx*x+fx*y)*speed*dt,dzv=(rz*x+fz*y)*speed*dt; tryMove(dx,dzv,up*speed*dt); if(Math.hypot(dx,dzv)>.001)player.rotation.y=Math.atan2(dx,dzv); staminaText() }
function tryMove(dx,dz,dy){ const nx=THREE.MathUtils.clamp(player.position.x+dx,bounds.minX,bounds.maxX); if(state.debug||!colliderAt(nx,player.position.z,.58,true))player.position.x=nx; const nz=THREE.MathUtils.clamp(player.position.z+dz,bounds.minZ,bounds.maxZ); if(state.debug||!colliderAt(player.position.x,nz,.58,true))player.position.z=nz; player.position.y=state.debug?THREE.MathUtils.clamp(player.position.y+dy,0,160):0 }
function regen(dt,a){state.player.stamina=Math.min(state.player.maxStamina,state.player.stamina+a*dt);staminaText()}
function staminaText(){if(ui.stat.stamina)ui.stat.stamina.textContent=`${Math.round(state.player.stamina)}/${state.player.maxStamina}`}
function detect(){ let near=null,dist=Infinity; npcs.forEach(n=>{if(n.visible===false)return; const d=player.position.distanceTo(n.position); if(d<dist){dist=d;near=n.userData}}); locations.forEach(l=>{const d=Math.hypot(player.position.x-l.position.x,player.position.z-l.position.z); if(d<dist){dist=d;near=l}}); const r=near?.radius??2.4; if(near&&dist<r&&!state.inDialogue&&state.started){state.activeTarget=near;ui.hintText.textContent=near.kind==="npc"?"話す":near.name;ui.hint.classList.remove("is-hidden")}else{state.activeTarget=null;ui.hint.classList.add("is-hidden")}}
function cameraUpdate(){ const desired=state.isDashing?(state.cameraMode==="first"?72:63):55; camera.fov+=(desired-camera.fov)*.12; camera.updateProjectionMatrix(); const target=new THREE.Vector3(player.position.x,player.position.y+1.08,player.position.z); if(state.cameraMode==="first"){const eye=new THREE.Vector3(player.position.x,player.position.y+1.55,player.position.z),look=new THREE.Vector3(-Math.sin(state.yaw)*Math.cos(state.pitch),Math.sin(state.pitch),-Math.cos(state.yaw)*Math.cos(state.pitch)); camera.position.lerp(eye,.45); if(state.cameraShake>0)camera.position.add(new THREE.Vector3(rand(-.035,.035),rand(-.025,.025),0)); camera.lookAt(eye.clone().add(look)); player.visible=false; return} player.visible=true; const radius=state.map==="plaza"?18:8.8,base=state.map==="plaza"?10:5.8; const off=new THREE.Vector3(Math.sin(state.yaw)*radius,base+Math.sin(state.pitch)*7,Math.cos(state.yaw)*radius); camera.position.lerp(target.clone().add(off),.12); camera.lookAt(target) }
function toggleCamera(){state.cameraMode=state.cameraMode==="third"?"first":"third"}
function getDialogueId(t){ if(t.id==="wake_point"&&questDone("wake"))return"wake_after"; if(t.id==="caravan_site"){if(questDone("merchant"))return"caravan_after"; if(questDone("caravan"))return"caravan_retreat_after"} if(t.id==="receptionist"&&questDone("register"))return"reception_after"; if(t.id==="priest"&&questDone("church"))return"priest_after"; return t.dialogue }
function interact(){ const t=state.activeTarget; if(!t)return; if(t.targetMap){ if(t.id==="guild_door"||t.id==="guild_entry_big")markDone(["guild"]); loadMap(t.targetMap,t.spawn); return} const id=getDialogueId(t); if(id)openDialogue(id) }
function openDialogue(id){state.dialogueId=id;state.dialogueLine=0;state.selectedChoice=0;state.inDialogue=true;if(id==="fireball_first")castFireball("story");ui.choices.innerHTML="";ui.dialog.classList.remove("is-hidden");ui.hint.classList.add("is-hidden");renderDialogue()}
function closeDialogue(){state.inDialogue=false;state.dialogueId=null;ui.dialog.classList.add("is-hidden")}
function cur(){return (data.dialogues&&data.dialogues[state.dialogueId])||extraDialogues[state.dialogueId]}
function renderDialogue(){const d=cur(); if(!d)return closeDialogue(); ui.speaker.textContent=d.speaker||""; ui.line.textContent=d.lines[state.dialogueLine]||""; ui.choices.innerHTML=""; if(state.dialogueLine>=d.lines.length-1&&d.choices)d.choices.forEach((c,i)=>{const b=document.createElement("button"); b.type="button"; b.textContent=c.text; b.classList.toggle("is-selected",i===state.selectedChoice); b.onclick=()=>choice(c); ui.choices.appendChild(b)})}
function advanceDialogue(){const d=cur(); if(!d)return; if(state.dialogueLine<d.lines.length-1){state.dialogueLine++;state.selectedChoice=0;renderDialogue()}else if(d.choices?.length)confirmChoice(); else closeDialogue()}
function moveChoice(delta){const d=cur(); if(!d?.choices?.length||state.dialogueLine<d.lines.length-1)return; state.selectedChoice=(state.selectedChoice+delta+d.choices.length)%d.choices.length; renderDialogue()}
function confirmChoice(){const d=cur(); if(!d?.choices?.length||state.dialogueLine<d.lines.length-1){advanceDialogue();return} choice(d.choices[state.selectedChoice]||d.choices[0])}
function choice(c){ if(c.stat)Object.entries(c.stat).forEach(([k,v])=>state.player[k]=Number(state.player[k]||0)+Number(v)); if(c.set)Object.entries(c.set).forEach(([p,v])=>setDeep(p,v)); if(c.objective)setObjective(c.objective); if(c.done)markDone(c.done); if(c.to==="fireball_first")castFireball("story"); updateHud(); if(c.targetMap){closeDialogue();loadMap(c.targetMap,c.spawn||{x:0,z:0});return} if(c.to){state.dialogueId=c.to;state.dialogueLine=0;state.selectedChoice=0;renderDialogue()}else closeDialogue()}
function markDone(ids){ids.forEach(id=>{const q=state.quest.find(x=>x.id===id); if(q)q.done=true}); if(ids.includes("merchant"))resolveCaravan(); renderQuests()}
function resolveCaravan(){if(beast)beast.visible=false;if(merchant){merchant.rotation.set(0,Math.PI,0);merchant.position.set(.78,.06,1.55)}}
function setObjective(t){data.objective=t;ui.objective.textContent=t}
function setDeep(path,val){const ks=path.split(".");let t=state;while(ks.length>1){const k=ks.shift();t[k]??={};t=t[k]}t[ks[0]]=val}
function updateHud(){const md=(data.maps&&data.maps[state.map])||{name:state.map,minimap:""}; ui.stat.name.textContent=state.player.name;ui.stat.hp.textContent=`${state.player.hp}/${state.player.maxHp}`;ui.stat.mp.textContent=`${state.player.mp}/${state.player.maxMp}`;staminaText();ui.stat.rank.textContent=state.player.rank;ui.stat.contract.textContent=state.player.contract;ui.objective.textContent=(state.debug?"[DEBUG FLY] ":"")+(data.objective||"ギルドへ向かう");ui.area.textContent=state.map==="plaza"?"王都アウレリア城下町・拡張版":md.name; ui.map.textContent=state.map==="plaza"?"[北門]\n  |\n[市場]-[中央広場]-[職人区]\n  |      |       \\\n[スラム]-[ギルド]-[訓練場]\n  |\n[教会]-[貴族街]-[王城]":md.minimap; renderQuests()}
function renderQuests(){ui.quests.innerHTML="";state.quest.forEach(q=>{const li=document.createElement("li");li.textContent=q.text;if(q.done)li.classList.add("done");ui.quests.appendChild(li)})}
function createLabel(text){const c=document.createElement("canvas"),x=c.getContext("2d");c.width=512;c.height=128;x.fillStyle="rgba(10,12,18,.72)";round(x,12,20,488,88,18);x.fill();x.strokeStyle="rgba(216,179,107,.75)";x.lineWidth=4;round(x,12,20,488,88,18);x.stroke();x.fillStyle="#f6efe1";x.font="bold 38px sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(text,256,64);return new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}))}
function round(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
ui.start.onclick=()=>{state.started=true;ui.title.classList.add("is-hidden")};
addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();if(e.code==="Backquote"||e.code==="F3"){e.preventDefault();state.debug=!state.debug;updateHud();return} if(state.inDialogue){if(e.code==="ArrowDown")return moveChoice(1);if(e.code==="ArrowUp")return moveChoice(-1);if(e.code==="Escape")return closeDialogue();if(e.code==="Enter"||e.code==="Space"){e.preventDefault();return advanceDialogue()}} if(e.code==="KeyF")return toggleCamera(); if(e.code==="KeyE"&&state.activeTarget)return interact(); state.keys.add(e.code)});
addEventListener("keyup",e=>state.keys.delete(e.code));
ui.canvas.addEventListener("pointerdown",e=>{state.dragging=true;state.lastX=e.clientX;state.lastY=e.clientY});
addEventListener("pointerup",()=>state.dragging=false);
addEventListener("pointermove",e=>{if(!state.dragging||state.inDialogue)return;state.yaw-=(e.clientX-state.lastX)*.006;state.pitch=THREE.MathUtils.clamp(state.pitch-(e.clientY-state.lastY)*.004,-.55,.75);state.lastX=e.clientX;state.lastY=e.clientY});
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,quality.pixelRatio))});
