import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/SkeletonUtils.js";

const $ = (id) => document.getElementById(id);
const data = window.GAME_DATA || {};
const params = new URLSearchParams(location.search);

const ui = {
  canvas: $("game-canvas"), loading: $("loading"), title: $("title-screen"), start: $("start-btn"),
  hint: $("interact-hint"), hintText: $("interact-text"), dialog: $("dialogue"), speaker: $("speaker"), line: $("line"), choices: $("choices"),
  objective: $("objective"), area: $("area-name"), map: $("mini-map-text"), quests: $("quest-list"),
  stat: { name: $("stat-name"), hp: $("stat-hp"), mp: $("stat-mp"), stamina: $("stat-stamina"), rank: $("stat-rank"), contract: $("stat-contract"), trust: $("stat-trust") },
  cooldowns: { fire: $("fire-cooldown"), burst: $("burst-cooldown") },
  quality: $("quality-select"),
  banner: { objective: $("play-objective"), area: $("play-area") },
  vital: { mp: $("vital-mp"), stamina: $("vital-stamina") },
  hearts: $("hp-hearts"), hotbar: $("hotbar"), menu: $("menu"), menuClose: $("menu-close"), audioToggle: $("audio-toggle")
};

const QUALITY = {
  low: { pixelRatio: 1, houses: .7, props: .5, npcs: .55, carts: 3, shadow: false, fog: 560, cull: 300 },
  medium: { pixelRatio: 1.25, houses: 1, props: .75, npcs: .85, carts: 5, shadow: true, fog: 760, cull: 380 },
  high: { pixelRatio: 1.5, houses: 1.22, props: 1, npcs: 1, carts: 7, shadow: true, fog: 980, cull: 460 }
};
const qualityParam = params.get("quality") || params.get("render") || "medium";
const qualityMode = QUALITY[qualityParam] ? qualityParam : "medium";
const quality = QUALITY[qualityMode];
const audio = createAudioManager({
  dialogue_next: { src: "assets/audio/se/ui/dialogue_next.ogg", volume: .35 },
  ui_decide: { src: "assets/audio/se/ui/ui_decide.ogg", volume: .35 },
  ui_cancel: { src: "assets/audio/se/ui/ui_cancel.ogg", volume: .35 },
  trust_up: { src: "assets/audio/se/ui/trust_up.ogg", volume: .35 },
  door_open: { src: "assets/audio/se/world/door_open.ogg", volume: .45 },
  door_close: { src: "assets/audio/se/world/door_close.ogg", volume: .45 },
  fireball_cast: { src: "assets/audio/se/magic/fireball_cast.ogg", volume: .5 },
  fireball_hit: { src: "assets/audio/se/magic/fireball_hit.ogg", volume: .5 },
  crystal_crack: { src: "assets/audio/se/magic/crystal_crack.ogg", volume: .5 }
});
const modelLoader = new GLTFLoader();
const modelCache = new Map();
const RECEP_DIR = "assets/models/characters/guild_receptionist/";
const FEMALE_PEASANT_PARTS = [RECEP_DIR + "base.gltf", RECEP_DIR + "outfit.gltf", RECEP_DIR + "hair.gltf"];
// 共通素材参照: 現状の準備済みランタイムは女性ピーザント1セットのみ。女性系NPCはこれを色替えで流用し、
// 男性系NPC(ギルドマスター/衛兵/司祭)は別途男性ランタイムを参照する（assets/models/characters/male_common/）。
const MALE_DIR = "assets/models/characters/male_common/";
const MALE_PARTS = [MALE_DIR + "base.gltf", MALE_DIR + "outfit.gltf", MALE_DIR + "hair.gltf"];
const CHARACTER_MODELS = {
  guildReceptionist: { parts: FEMALE_PEASANT_PARTS, scale: 1.14, rotationY: 0, offset: { z: .25 }, tint: { outfit: 0x4a7a9c, hair: 0x6a4a2c }, shadow: true },
  innMarta: { parts: FEMALE_PEASANT_PARTS, scale: 1.17, rotationY: 0, offset: { z: .25 }, tint: { outfit: 0x9a5a3a, hair: 0x5a3a22 }, shadow: true },
  academyTeacher: { parts: FEMALE_PEASANT_PARTS, scale: 1.18, rotationY: 0, offset: { z: .25 }, tint: { outfit: 0x3a2e6a, hair: 0x2a2030 }, shadow: true },
  guildmaster: { parts: MALE_PARTS, scale: 1.2, rotationY: 0, offset: { z: .25 }, tint: { outfit: 0x40485a, hair: 0x55504a }, shadow: true },
  priest: { parts: MALE_PARTS, scale: 1.16, rotationY: 0, offset: { z: .2 }, tint: { outfit: 0xddd6c2, hair: 0xb8b2a2 }, shadow: true },
  guard: { parts: MALE_PARTS, scale: 1.18, rotationY: 0, offset: { z: .2 }, tint: { outfit: 0x6a6f7a, hair: 0x3a2c20 }, shadow: true },
  adventurerMale: { parts: MALE_PARTS, scale: 1.15, rotationY: 0, offset: { z: .2 }, tint: { outfit: 0x5f6b4b, hair: 0x3a2c20 } },
  adventurerFemale: { parts: FEMALE_PEASANT_PARTS, scale: 1.13, rotationY: 0, offset: { z: .25 }, tint: { outfit: 0x5b6f7f, hair: 0x4a2f1c } },
  merchantMale: { parts: MALE_PARTS, scale: 1.12, rotationY: 0, offset: { z: .2 }, tint: { outfit: 0x9a6f44, hair: 0x4a2f1c } },
  merchantFemale: { parts: FEMALE_PEASANT_PARTS, scale: 1.1, rotationY: 0, offset: { z: .25 }, tint: { outfit: 0x9a6a54, hair: 0x6a4a2c } },
  studentMale: { parts: MALE_PARTS, scale: 1.1, rotationY: 0, offset: { z: .2 }, tint: { outfit: 0x2e3a5c, hair: 0x2b2118 } },
  studentFemale: { parts: FEMALE_PEASANT_PARTS, scale: 1.08, rotationY: 0, offset: { z: .25 }, tint: { outfit: 0x2e3a5c, hair: 0x35304a } },
  townsfolkMale: { parts: MALE_PARTS, scale: 1.09, rotationY: 0, offset: { z: .2 }, tint: { outfit: 0x6f7a6a, hair: 0x4a2f1c } },
  townsfolkFemale: { parts: FEMALE_PEASANT_PARTS, scale: 1.07, rotationY: 0, offset: { z: .25 }, tint: { outfit: 0x7f6f8d, hair: 0x6e4a2a } },
  faithful: { parts: MALE_PARTS, scale: 1.12, rotationY: 0, offset: { z: .2 }, tint: { outfit: 0xd8d0bc, hair: 0x8f887a } },
  slumResident: { parts: MALE_PARTS, scale: 1.05, rotationY: 0, offset: { z: .2 }, tint: { outfit: 0x4f4238, hair: 0x2b2118 } },
  blacksmith: { parts: MALE_PARTS, scale: 1.18, rotationY: 0, offset: { z: .2 }, tint: { outfit: 0x6f4b32, hair: 0x3a2c20 }, shadow: true },
  noble: { parts: MALE_PARTS, scale: 1.16, rotationY: 0, offset: { z: .2 }, tint: { outfit: 0x3a3050, hair: 0x4a3a2a }, shadow: true }
};
const MODEL_NPC_BUDGET = { low: 12, medium: 24, high: 40 };
const AMBIENT_MODEL_NPC_BUDGET = { low: 4, medium: 10, high: 20 };
const HUMAN_MODEL_KEYS = {
  receptionist: ["guildReceptionist"],
  priest: ["priest"],
  guard: ["guard"],
  teacher: ["academyTeacher"],
  noble: ["noble"],
  blacksmith: ["blacksmith"],
  adventurer: ["adventurerMale", "adventurerFemale"],
  merchant: ["merchantMale", "merchantFemale"],
  student: ["studentFemale", "studentMale"],
  faithful: ["faithful"],
  slum: ["slumResident"],
  traveler: ["townsfolkMale", "townsfolkFemale"]
};
let modelNpcBudget = MODEL_NPC_BUDGET[qualityMode] || MODEL_NPC_BUDGET.medium;
let ambientModelNpcBudget = AMBIENT_MODEL_NPC_BUDGET[qualityMode] || AMBIENT_MODEL_NPC_BUDGET.medium;
const modelStats = { external: 0, fallback: 0, primitive: 0, loading: 0, budget: modelNpcBudget, remaining: modelNpcBudget, ambientBudget: ambientModelNpcBudget, ambientRemaining: ambientModelNpcBudget, quality: qualityMode, map: "" };
window.__AURELIA_MODEL_STATS__ = modelStats;

const ROAD_LINES = {
  vertical: [-430, -330, -130, 0, 130, 330, 430],
  horizontal: [-430, -330, -130, 0, 130, 330, 430]
};

const basePlayer = data.player || { name: "ユウジ・サトウ", hp: 200, maxHp: 200, mp: 25, maxMp: 25, rank: "未登録", contract: "未契約" };
const questSeed = [
  ...(data.quests || []),
  { id: "gate", text: "北門で検問を通過する", done: false },
  { id: "plaza", text: "中央広場で王都の構造を確認する", done: false },
  { id: "guild_apply", text: "ギルド受付で登録申請をする", done: false },
  { id: "mana_test", text: "魔力測定水晶に触れる", done: false },
  { id: "provisional", text: "F級仮登録を受ける", done: false },
  { id: "church_record", text: "教会で身分記録の手続きを聞く", done: false },
  { id: "market", text: "市場通りの盗難騒ぎを確認する", done: false },
  { id: "training", text: "外門練習場で火球を試射する", done: false },
  { id: "mock_battle", text: "翌日の模擬戦に勝つ", done: false },
  { id: "alley", text: "怪しい路地裏で情報屋に接触する", done: false },
  { id: "academy", text: "魔法学院で入学相談をする", done: false }
];
const quests = [...new Map(questSeed.map((q) => [q.id, { ...q }])).values()];

const DIALOGUES = {
  wake_after: { speaker: "ユウジ", lines: ["湿った街道の土。遠くに王都の城壁が見える。", "まずは荷車の現場と北門を確認する。"] },
  caravan_attack: { speaker: "護衛 ガラン・ホルト", lines: ["くそ、二匹いる！　馬を落ち着かせろ！", "そこの旅人——突っ立ってないで手を貸せ。火でも石でもいい、あの黒毛の噛み犬を退かせろ！", "会話で済む相手じゃない。距離を取り、Jキーか□ボタンの火球を当てろ！"], choices: [{ text: "火球の射線を作る", objective: "荷車脇の黒毛の噛み犬に火球を当てて商人を救う" }, { text: "距離を取る", objective: "Jキー/□ボタンで黒毛の噛み犬に火球を当てる" }] },
  caravan_after: { speaker: "商人 エドリック・ヴェイン", lines: ["助かった……私はエドリック・ヴェイン。商会の者だ。", "これは封蝋付きの紹介状だ。王都のギルド受付に出すといい。宿屋も門も、少しは顔が通る。", "礼じゃない、借りだ。借りには利息がつく。だが借りを抱えて生き延びるほうが、飢えるより賢い。"] },
  north_gate: { speaker: "門番 ブラム・ガーランド", lines: ["止まれ。私はブラム・ガーランド。規約どおりに扱う。……名と、契約は。", "紹介状——商会の封蝋か。本物だ。今回は通す。だが未契約のままうろつくな。", "逃げるなよ。逃げた者は“消える”。消えた者は、二度と登録できない。大通りを進み、噴水を越えてギルドへ。"], choices: [{ text: "王都へ入る", done: ["gate"], trust: { Crown: 3 }, targetMap: "plaza", spawn: { x: 0, z: 610 }, objective: "中央広場を抜けて冒険者ギルドへ向かう" }] },
  north_gate_after: { speaker: "北門衛兵", lines: ["一度入城確認をした旅人だな。", "王都へ戻るなら通れ。騒ぎは起こすなよ。"], choices: [{ text: "王都へ入る", targetMap: "plaza", spawn: { x: 0, z: 610 }, objective: "王都内で次の目的を進める" }] },
  plaza: { speaker: "ユウジ", lines: ["城壁の内側に家が押し込まれている。大通りには馬車、脇道には市場、遠くには王城。", "建物は道に正面を向けて並び、裏側には狭い生活路地が続いている。", "身分、信用、金、信仰で居場所が分かれている。ここはゲームの街というより、社会だ。"], choices: [{ text: "地図感覚を整理する", done: ["plaza"], objective: "冒険者ギルドで紹介状を出す" }] },
  plaza_after: { speaker: "ユウジ", lines: ["中央広場の位置関係は分かった。北に門、東に市場と職人区、西に教会、南に王城。", "次は目的地へ向かう。"] },
  guild: { speaker: "ギルド案内係", lines: ["登録なら中だ。紹介状があるなら受付へ。", "王都の中では力より先に紙が物を言う。"], choices: [{ text: "ギルド内部へ入る", targetMap: "guildHall", spawn: { x: 0, z: 6.4 }, objective: "受付で登録申請をする" }] },
  guild_reception: { speaker: "ギルド受付 リサ・フェン", lines: ["紹介状、確認しました。ユウジ・サトウさん。年齢、出身、証明は——無し。そう。", "未登録、未契約。登録料は銅貨2枚。逃げたら、次は通しません。", "ここにいる間、ギルド規約に従う契約です。従わない者は保護されない。……手を、水晶へ。色が出れば適性、濁れば要確認、割れれば測定器の故障。"], choices: [{ text: "魔力測定へ進む", done: ["guild_apply"], trust: { Guild: 3 }, to: "mana_measure", objective: "測定台の水晶に手を置く" }] },
  guild_reception_after: { speaker: "ギルド受付", lines: ["登録申請は受理されています。", "次は魔力測定、またはギルドマスターの判断を確認してください。"] },
  mana_measure: { speaker: "測定係", lines: ["水晶に触れた瞬間、淡い光が内部へ吸い込まれていく。", "色は変わらない。だが、奥の方から細い亀裂が走った。", "受付が顔を上げる。『……過負荷です。ですが、外側は割れていません』"], choices: [{ text: "水晶から手を離す", done: ["mana_test"], set: { "player.rank": "F級仮登録" }, effect: "crystal", to: "guildmaster", objective: "ギルドマスターの判断を聞く" }] },
  mana_after: { speaker: "測定係", lines: ["水晶の奥には細い亀裂が残っている。", "同じ測定を繰り返すのは危険です。判断はギルドマスターに任されています。"] },
  guildmaster: { speaker: "ギルドマスター ヴォルク", lines: ["荒削りだが、芯はある。魔力の通り方が妙だ。才能はある。……だが、常識がない。", "王都で無許可に火球を撃てば、魔物より先に衛兵に囲まれる。ここでは、強さは信用に直結しない。", "F級仮登録を認める。明日の模擬戦で最低限の制御を見せろ。今日は外門練習場で練習しておけ。", "強者よりも、しぶとい者を信じる。お前がどっちかは、これから見せてもらう。"], choices: [{ text: "F級仮登録を受け取る", done: ["provisional"], trust: { Guild: 4 }, targetMap: "plaza", spawn: { x: 135, z: -42 }, objective: "外門練習場で魔法制御を練習する" }] },
  guildmaster_after: { speaker: "ギルドマスター", lines: ["仮登録は出した。次は外門練習場だ。", "力を見せるより、制御できると証明してこい。"] },
  church: { speaker: "教会記録係", lines: ["洗礼記録、出生記録、移住記録。この街では記録がない人は“いない人”に近い扱いです。", "紹介状があるなら仮の確認書は作れます。正式な身分には保証人が必要です。"], choices: [{ text: "確認書を頼む", done: ["church_record", "church"], trust: { Church: 4 }, set: { "player.contract": "教会確認書" }, objective: "ギルドへ戻って仮登録を進める" }] },
  church_after: { speaker: "教会記録係", lines: ["仮の確認書は発行済みです。", "正式な保証人が見つかるまでは、ギルド証と併せて使ってください。"] },
  market: { speaker: "市場の商人", lines: ["おい、旅人。薬草束がひとつ消えた。", "犯人を決めつけると商売が壊れる。見たなら教えてくれ。"], choices: [{ text: "盗難騒ぎを記録する", done: ["market"], objective: "教会かギルドで身分確認を進める" }, { text: "路地裏の噂を聞く", objective: "怪しい路地裏で情報屋に接触する" }] },
  market_after: { speaker: "市場の商人", lines: ["さっきの騒ぎは落ち着いた。", "王都の市場では、正義感だけでは商売にならない。証拠と信用がいる。"] },
  training_gate: { speaker: "訓練場の衛兵", lines: ["魔法の試射か。街中でやられるよりは助かる。", "的は奥だ。教官の指示を聞け。"], choices: [{ text: "外門練習場へ入る", targetMap: "trainingGround", spawn: { x: 0, z: 48 }, objective: "訓練教官から火球制御を学ぶ" }] },
  training: { speaker: "訓練教官", lines: ["街中で火球を撃つな。試すならここだ。ここはギルド管理下の練習場——お前の一射は、全部査定簿に残る。", "的を見ろ。息を止めるな。恥ずかしい詠唱でも、出るなら使え。", "見ているのは威力じゃない。出した力を、狙った場所で止められるかだ。止められない力は、ただの危険物として記録される。"], choices: [{ text: "火球を試射する", done: ["training"], effect: "fire", trust: { Guild: 2 }, objective: "翌日の模擬戦を受ける" }] },
  training_after: { speaker: "訓練教官", lines: ["さっきよりは狙いがまともになった。", "模擬戦では威力ではなく、相手の動きを止める使い方をしろ。"] },
  mock_battle: { speaker: "試験官", lines: ["翌日。木剣を持った新人冒険者が前に出る。", "相手は速くない。だが、こちらが火球を外せば距離を詰められる。", "ユウジは小さな火球で足元を牽制し、相手の踏み込みを止めた。勝負あり。"], choices: [{ text: "模擬戦を終える", done: ["mock_battle"], trust: { Guild: 6 }, set: { "player.rank": "F級冒険者" }, targetMap: "plaza", spawn: { x: 135, z: -42 }, objective: "西の魔法学院を訪ね、入学相談をする" }] },
  mock_after: { speaker: "試験官", lines: ["模擬戦は終了だ。", "F級冒険者として、まずは王都内の小さな依頼から始めろ。", "それと——ギルドマスターが、お前を魔法学院に推すと言っていた。西の学院を訪ねてみろ。常識を学んでこい。"] },
  alley: { speaker: "路地裏の男", lines: ["よそ者だな。ここでは金より身元が高く売れる。", "黒い羽を見たら拾うな。割れた水晶を見ても触るな。"], choices: [{ text: "情報だけ覚えて戻る", done: ["alley"], objective: "ギルドか教会で正式な足場を作る" }] },
  alley_after: { speaker: "路地裏の男", lines: ["同じ噂を二度売るほど落ちぶれてはいない。", "次に来るなら、新しい話か、金を持ってこい。"] },
  blacksmith: { speaker: "鍛冶職人", lines: ["登録前の客に刃物は売れない。腕より先に信用を持ってこい。"] },
  inn: { speaker: "宿屋の女将", lines: ["部屋はあるよ。長逗留ならギルド証か教会の確認書を見せておくれ。"] },
  generic: { speaker: "通行人", lines: ["王都は広い。看板と鐘楼を目印にしな。"] },
  academy_gate: { speaker: "学院門衛", lines: ["ここは王立魔法学院だ。学籍か推薦か、用件のある者だけが通れる。", "登録証は確認させてもらう。中では無断の詠唱は禁止だ。破れば退学より重い扱いになる。"], choices: [{ text: "学院のキャンパスに入る", targetMap: "academyCampus", spawn: { x: 0, z: 50 }, objective: "学院のキャンパスを抜けて講義棟で教師に話を聞く" }] },
  academy_campus: { speaker: "学院門衛", lines: ["王立魔法学院へようこそ。正面が講義棟、東に練習場、北東の塔は立入許可が要る。", "中庭は自由に通ってよい。ただし無断の詠唱は記録される。心得ておけ。"] },
  academy_teacher: { speaker: "魔法学院 教師", lines: ["……君が、測定で水晶にヒビを入れたという新人か。話は学院にも届いている。", "詠唱が学院の様式にない。『魔力弾』——短すぎる。普通は術式を言葉で組み上げるのに、君はほとんど省いている。", "才能は記録する。記録されない才能は、いずれ『危険』と呼ばれる。……どこで覚えた？"], choices: [{ text: "「気づいたら出ていました」と答える", done: ["academy"], trust: { Crown: 4 }, set: { "player.contract": "学院 観察対象" }, objective: "学費を稼ぎ、学院に通う足場を作る" }, { text: "推薦状について尋ねる", to: "academy_rec" }] },
  academy_rec: { speaker: "魔法学院 教師", lines: ["ギルドマスターの推薦があれば、聴講生として籍を置ける。だが学費は自分で稼げ。", "学院は才能を育てるが、施しはしない。記録と規則の中で、君がどう振る舞うかを見る。"], choices: [{ text: "理解した", done: ["academy"], trust: { Crown: 2 }, objective: "学費を稼ぎ、学院に通う足場を作る" }] },
  academy_teacher_after: { speaker: "魔法学院 教師", lines: ["君の詠唱は記録した。次は制御だ。学院の様式を学べば、その短さは『異常』ではなく『技術』になる。", "焦るな。ここでは、目立つ才能ほど早く管理される。"] },
  academy_student: { speaker: "学院生", lines: ["君、見ない顔だね。聴講生？　無属性で水晶にヒビって噂、本当？", "属性が出ないのは珍しいよ。教師たちが妙に気にしてる。気をつけて——ここは噂が速いから。"] },
  academy_orb: { speaker: "ユウジ", lines: ["天井から吊られた魔導具。中で淡い光が回っている。魔素を可視化する装置らしい。", "『触れるな』の札。……この街は、力よりも記録と許可で回っている。学院でさえ、まず手続きだ。"] },
  inn_gate: { speaker: "宿屋 曲がった匙亭", lines: ["木の看板に、曲がった匙の絵。中から酒と煮込みの匂い。", "外より安全な空気がある。喧嘩が起きても“流儀”がある場所だ。"], choices: [{ text: "宿に入る", targetMap: "inn", spawn: { x: 0, z: 5.4 }, objective: "宿屋で女将マルタに話を聞く" }] },
  inn_marta: { speaker: "女将 マルタ", lines: ["マルタだよ。……また揉め事？　あんた、運が悪いね。", "上で寝な。鐘が鳴ったら鍵を閉める。外で死んでも、うちは知らないよ。", "印、ついたかい。なら明日から少しは人扱いが増える。……その代わり、面倒も増えるよ。"], choices: [{ text: "一晩休む（噂を聞く）", trust: { Merchant: 2 }, objective: "休んで英気を養い、次の足場を探す" }, { text: "礼を言って出る" }] },
  shop_weapon: { speaker: "武器屋の主", lines: ["登録前の客に刃物は売れねえ。腕より先に信用を持ってこい。", "F級か。木剣で十分だ。鉄を握るのは、鉄に見合う身分になってからだ。"] },
  shop_armor: { speaker: "防具屋の主", lines: ["革鎧なら銀貨数枚。鉄は……今のあんたには高すぎる。", "防具は命の値段だ。安物で死ぬか、高物で借りを作るか。よく考えな。"] },
  shop_potion: { speaker: "薬師", lines: ["治癒の魔法薬は高い。神聖属性の使い手は、数が少ないからね。", "傷は消毒と包帯で足りることも多い。金がないなら、まず薬草を覚えな。"] },
  shop_magic: { speaker: "魔法具商", lines: ["魔導具の上物は、学院の許可印がないと出せない。", "あんた……無属性で水晶にヒビ、の噂の子かい。妙な詠唱の子は、妙な物に縁がある。気をつけな。"] },
  shop_bakery: { speaker: "パン屋", lines: ["黒パンは銅貨一枚。今日の分は焼けてるよ。", "腹が減ってちゃ、信用も身分も積めない。まず食いな。"] },
  shop_tavern: { speaker: "酒場の主", lines: ["席はあるが、揉め事はよそでやれ。ここは情報が酒より速く回る。", "“身元不明が三日で消える”——そんな噂、あんたも気をつけな。"] },
  shop_records: { speaker: "記録官", lines: ["出生記録、移住記録、洗礼記録。記録のない者は、この街では“いない人”に近い。", "紹介状があるなら仮の確認書は作れる。正式な身分には、保証人の署名が要る。"] },
  townsfolk: { speaker: "通行人", lines: ["昼の市場は賑やかだよ。夜は——鐘三つを過ぎたら出歩くな。人が獣より怖くなる。", "迷ったら大通りへ戻りな。看板と鐘楼を目印にすればいい。"] },
  // === 王都内施設の拡張(#47 ギルド / #50 北門詰所 / #48 宿屋 / #51 住宅・路地) ===
  guild_board: { speaker: "依頼掲示板", lines: ["討伐・採集・護衛・運搬——王都とその周辺の依頼が等級ごとに貼り出されている。", "『F級は単独受注不可』『無登録者の受注を禁ず』と赤枠の但し書き。", "ここでも、力より先に登録と等級が物を言う。"] },
  guild_clerk: { speaker: "ギルド職員", lines: ["登録は受付、測定は右の測定室、面談は奥のギルドマスター室です。", "順番と記録を守ってください。割り込みは査定に響きます。"] },
  guild_lobby: { speaker: "待機中の冒険者", lines: ["朝から待たされてる。依頼も等級で振り分けだ。", "新顔か。無登録なら、まず受付だ。妙な噂を立てられる前にな。"] },
  gate_record: { speaker: "記録係", lines: ["通行者は全員ここで記帳する。名、出身、契約、用件。", "紹介状の番号も控える。お前が逃げても、この紙が追う。"] },
  gate_notice: { speaker: "詰所の掲示", lines: ["『一時通行は身元保証ではない』『問題行動は登録抹消』『夜間通行は別許可』。", "検問は、王都が誰を入れたかを記録する制度だ。通すかどうかは紙が決める。"] },
  inn_board: { speaker: "噂掲示板", lines: ["走り書きの噂が画鋲で重ねて留められている。", "『学院の禁書区が封鎖された』『教会の地下記録室に空きが出た』", "『市場区は商会信用がないと卸さない』『王城区から呼び出しの噂』『王都外の遺跡に調査隊』。"] },
  inn_traveler: { speaker: "旅商人", lines: ["王都外の遺跡に調査隊が入ったらしい。許可がないと近づけない場所だ。", "商会信用があれば南港の話も回ってくる。なければ、ただの噂止まりさ。"] },
  inn_adventurer: { speaker: "宿の冒険者", lines: ["F級のうちは王都の中の依頼で食いつなぐしかない。", "外門の練習場で査定を上げな。記録が積めば、回ってくる依頼も変わる。"] },
  inn_student: { speaker: "学院生", lines: ["禁書区が封鎖されたって聞いた？　召喚系の資料が動いたとか。", "……無属性で水晶にヒビ、の噂の人？　学院が気にしてるよ。気をつけて。"] },
  inn_cleric: { speaker: "教会関係者", lines: ["地下記録室は、出生も移住も洗礼も、原本が眠る場所。", "身元のない人ほど、あそこに呼ばれる。記録されることは、守られることでもあり、縛られることでもある。"] },
  inn_soldier: { speaker: "兵士", lines: ["王城区から呼び出しがかかる者がいるらしい。記録が集まりすぎた者だ。", "便利になったぶん、断れなくなる。……お前も気をつけろよ。"] },
  backstreet: { speaker: "ユウジ", lines: ["大通りの裏。洗濯物が渡され、井戸の周りに水音と話し声。", "施設の街ではなく、人が暮らす街の顔がここにある。", "行き止まりと裏口が入り組み、身元のない者が息をひそめる場所でもある。"] },
  alley_warn: { speaker: "路地の住人", lines: ["見ない顔だね。ここじゃ身元のない奴は、まず疑われる。", "悪いことは言わない。ギルドでも教会でも、早く“紙”を作りな。"] },
  alley_guild: { speaker: "井戸端の女", lines: ["ギルドに登録した子は、少し人扱いが変わるよ。", "登録者は守られる。代わりに、逃げ場も記録される。どっちがいいかは、あんた次第さ。"] },
  alley_church: { speaker: "古株の住人", lines: ["教会の記録係は、よく見てる。誰が来て、誰が消えたか。", "記録に残れば、いない人にはならない。……残らなければ、三日で忘れられる。"] },
  alley_market: { speaker: "路地の小商人", lines: ["市場区はね、金より商会信用だよ。信用がなけりゃ、まともな品は卸してもらえない。", "信用は帳簿で回る。あんたの名前、まだどこにも載ってないだろ？"] },
  alley_watch: { speaker: "声をひそめる男", lines: ["王城区から、街を見てる目があるって話だ。記録の集まりすぎた奴を呼び出すとか。", "便利と監視は同じ紐の両端だ。引けば、向こうも引く。"] }
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1600);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, quality.pixelRatio));
renderer.shadowMap.enabled = quality.shadow;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const world = new THREE.Group();
scene.add(world);
const clock = new THREE.Clock();
const mats = new Map();
const geoCache = new Map();
const texCache = new Map();
const player = createPerson("player", 0x24395d);
scene.add(player);

const state = { started: false, loaded: false, map: null, keys: new Set(), yaw: 0, pitch: 0.08, cameraMode: "third", debug: params.has("debug"), player: { stamina: 100, maxStamina: 100, ...basePlayer, trust: { Guild: 0, Church: 0, Crown: 0, Merchant: 0 } }, quest: quests, active: null, inDialogue: false, dialogueId: null, lineIndex: 0, selected: 0, padButtons: [], fireCooldown: 0, burstCooldown: 0, isDashing: false, drag: false, lastX: 0, lastY: 0, shake: 0, hitStop: 0, timeOfDay: params.get("time") || "day", dayClock: 0, menuOpen: false, hotbarSlot: 1 };
let bounds = { minX: -95, maxX: 95, minZ: -135, maxZ: 135 };
let colliders = [], locations = [], npcs = [], movers = [], cullables = [], projectiles = [], bursts = [], mixers = [];
let caravanThreat = null;
let systemToastTimer = 0;
let colliderGrid = new Map();
let facadeSpecs = [], plainSpecs = [], shopAnchors = [];
let sunLight, hemiLight, ambLight;
let timeTransition = null;
const GRID_SIZE = 18;
const DAYPHASES = {
  morning: { sky: 0xb9c8d8, fog: [120, 1400], sun: 2.1, sunCol: 0xffe2c4, hemi: 1.7, amb: .5, ambCol: 0x57606e, label: "朝" },
  day: { sky: 0xbcd6e6, fog: [130, 1500], sun: 2.55, sunCol: 0xfff1d6, hemi: 1.95, amb: .5, ambCol: 0x556070, label: "昼" },
  evening: { sky: 0xe0a878, fog: [110, 1150], sun: 1.85, sunCol: 0xffae66, hemi: 1.45, amb: .46, ambCol: 0x4c4660, label: "夕方" },
  night: { sky: 0x1b2338, fog: [80, 880], sun: .5, sunCol: 0x6a7aa6, hemi: .72, amb: .36, ambCol: 0x2a3454, label: "夜" }
};
const PHASE_ORDER = ["morning", "day", "evening", "night"];
const INDOOR_MAPS = new Set(["guildHall", "church", "academy", "inn"]);

initLights();
bindQualitySelect();
bindMenu();
bindAudioToggle();
bindStartEarly();
updateHud();
ui.loading?.classList.add("is-hidden");
requestAnimationFrame(loop);
addEventListener("pointerdown", () => audio.enable(), { once: true });
addEventListener("keydown", () => audio.enable(), { once: true });

function createAudioManager(manifest) {
  const clips = new Map();
  const missing = new Set();
  let enabled = false, muted = false;
  const safeAudio = typeof Audio !== "undefined";
  return {
    setMuted(v) { muted = !!v; },
    enable() {
      if (enabled || !safeAudio) return;
      enabled = true;
      for (const [name, def] of Object.entries(manifest)) {
        try {
          const clip = new Audio(def.src);
          clip.preload = "auto";
          clip.volume = def.volume ?? .4;
          clip.addEventListener("error", () => missing.add(name), { once: true });
          clips.set(name, clip);
          clip.load();
        } catch {
          missing.add(name);
        }
      }
    },
    play(name) {
      if (!enabled || muted || missing.has(name)) return;
      try {
        const base = clips.get(name);
        if (!base) return;
        const clip = base.cloneNode(true);
        clip.volume = base.volume;
        const result = clip.play();
        if (result?.catch) result.catch(() => missing.add(name));
      } catch {
        missing.add(name);
      }
    }
  };
}

function bindQualitySelect() {
  if (!ui.quality) return;
  ui.quality.value = qualityMode;
  ui.quality.addEventListener("change", () => {
    const next = ui.quality.value;
    const url = new URL(location.href);
    url.searchParams.set(params.has("quality") ? "quality" : "render", next);
    location.assign(url.toString());
  });
}
function bindStartEarly() { const start = () => { if (state.started) return; audio.enable(); audio.play("ui_decide"); state.started = true; ui.title?.classList.add("is-hidden"); ui.loading?.classList.remove("is-hidden"); setTimeout(() => { const map = params.get("map") || data.startMap || "forestRoad"; loadMap(map, initialSpawn(map)); state.loaded = true; ui.loading?.classList.add("is-hidden"); }, 30); }; ui.start?.addEventListener("click", start); ui.start?.addEventListener("pointerup", (e) => { e.preventDefault(); start(); }); }
function initLights() { hemiLight = new THREE.HemisphereLight(0xf0e6cf, 0x415063, 1.95); scene.add(hemiLight); sunLight = new THREE.DirectionalLight(0xfff1d6, 2.55); sunLight.position.set(90, 135, 70); sunLight.castShadow = quality.shadow; sunLight.shadow.mapSize.set(1536, 1536); sunLight.shadow.bias = -0.0004; Object.assign(sunLight.shadow.camera, { near: .5, far: 620, left: -390, right: 390, top: 390, bottom: -390 }); scene.add(sunLight); ambLight = new THREE.AmbientLight(0x556070, .5); scene.add(ambLight); }
function isOutdoorMap() { return state.map === "plaza" || state.map === "forestRoad" || state.map === "trainingGround" || state.map === "academyCampus" || state.map === "churchGrounds"; }
function phaseSnapshot(phase) {
  const p = DAYPHASES[phase] || DAYPHASES.day;
  return { sky: new THREE.Color(p.sky), fogNear: p.fog[0], fogFar: p.fog[1], sun: p.sun, sunCol: new THREE.Color(p.sunCol), hemi: p.hemi, amb: p.amb, ambCol: new THREE.Color(p.ambCol) };
}
function currentTimeSnapshot() {
  const p = phaseSnapshot(state.timeOfDay);
  return {
    sky: scene.background?.isColor ? scene.background.clone() : p.sky.clone(),
    fogNear: scene.fog?.near ?? p.fogNear,
    fogFar: scene.fog?.far ?? p.fogFar,
    sun: sunLight?.intensity ?? p.sun,
    sunCol: sunLight?.color?.clone?.() || p.sunCol.clone(),
    hemi: hemiLight?.intensity ?? p.hemi,
    amb: ambLight?.intensity ?? p.amb,
    ambCol: ambLight?.color?.clone?.() || p.ambCol.clone()
  };
}
function applyTimeSnapshot(s) {
  if (sunLight) { sunLight.intensity = s.sun; sunLight.color.copy(s.sunCol); }
  if (hemiLight) hemiLight.intensity = s.hemi;
  if (ambLight) { ambLight.intensity = s.amb; ambLight.color.copy(s.ambCol); }
  if (isOutdoorMap()) {
    if (!scene.background?.isColor) scene.background = s.sky.clone();
    else scene.background.copy(s.sky);
    if (!scene.fog) scene.fog = new THREE.Fog(s.sky, s.fogNear, s.fogFar);
    else { scene.fog.color.copy(s.sky); scene.fog.near = s.fogNear; scene.fog.far = s.fogFar; }
  }
}
function applyTimeOfDay() { timeTransition = null; applyTimeSnapshot(phaseSnapshot(state.timeOfDay)); }
function transitionTimeOfDay(phase, duration = 4) {
  if (!DAYPHASES[phase]) phase = "day";
  state.timeOfDay = phase;
  timeTransition = { from: currentTimeSnapshot(), to: phaseSnapshot(phase), t: 0, d: Math.max(.1, duration) };
  updateHud();
}
function updateTimeTransition(dt) {
  if (!timeTransition) return;
  timeTransition.t += dt;
  const k = Math.min(1, timeTransition.t / timeTransition.d);
  const e = k * k * (3 - 2 * k);
  const a = timeTransition.from, b = timeTransition.to;
  applyTimeSnapshot({
    sky: a.sky.clone().lerp(b.sky, e),
    fogNear: THREE.MathUtils.lerp(a.fogNear, b.fogNear, e),
    fogFar: THREE.MathUtils.lerp(a.fogFar, b.fogFar, e),
    sun: THREE.MathUtils.lerp(a.sun, b.sun, e),
    sunCol: a.sunCol.clone().lerp(b.sunCol, e),
    hemi: THREE.MathUtils.lerp(a.hemi, b.hemi, e),
    amb: THREE.MathUtils.lerp(a.amb, b.amb, e),
    ambCol: a.ambCol.clone().lerp(b.ambCol, e)
  });
  if (k >= 1) timeTransition = null;
}
function setTimeOfDay(phase, instant = false) { if (instant) { state.timeOfDay = phase; applyTimeOfDay(); updateHud(); } else transitionTimeOfDay(phase); }
function initialSpawn(map) { return ({ forestRoad: { x: 0, z: 74 }, plaza: { x: 0, z: 610 }, guildHall: { x: 0, z: 6.2 }, church: { x: 0, z: 5.5 }, churchGrounds: { x: 0, z: 48 }, trainingGround: { x: 0, z: 48 }, academy: { x: 0, z: 9 }, academyCampus: { x: 0, z: 50 }, inn: { x: 0, z: 5.4 } })[map] || { x: 0, z: 74 }; }
function mat(color, rough = .82, em = 0x000000, pow = 0) { const k = `${color}:${rough}:${em}:${pow}`; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, emissive: em, emissiveIntensity: pow, flatShading: true })); return mats.get(k); }
function add(geo, material, parent = world, cast = false, receive = true) { const m = new THREE.Mesh(geo, material); m.castShadow = Boolean(cast && quality.shadow); m.receiveShadow = receive; parent.add(m); return m; }
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(a) { return a[Math.floor(rand(0, a.length))]; }
function done(id) { return state.quest.some((q) => q.id === id && q.done); }
function setEnv(color, near, far) { scene.background = new THREE.Color(color); scene.fog = new THREE.Fog(color, near, far); }
function gridKey(x, z) { return `${x},${z}`; }
function addCollider(x, z, w, d, label = "") {
  const c = { x, z, w, d, label };
  colliders.push(c);
  const minX = Math.floor((x - w / 2) / GRID_SIZE), maxX = Math.floor((x + w / 2) / GRID_SIZE);
  const minZ = Math.floor((z - d / 2) / GRID_SIZE), maxZ = Math.floor((z + d / 2) / GRID_SIZE);
  for (let gx = minX; gx <= maxX; gx++) for (let gz = minZ; gz <= maxZ; gz++) {
    const key = gridKey(gx, gz);
    if (!colliderGrid.has(key)) colliderGrid.set(key, []);
    colliderGrid.get(key).push(c);
  }
}
function nearbyColliders(x, z, r = .58) {
  const minX = Math.floor((x - r) / GRID_SIZE), maxX = Math.floor((x + r) / GRID_SIZE);
  const minZ = Math.floor((z - r) / GRID_SIZE), maxZ = Math.floor((z + r) / GRID_SIZE);
  const seen = new Set(), out = [];
  for (let gx = minX; gx <= maxX; gx++) for (let gz = minZ; gz <= maxZ; gz++) {
    const cell = colliderGrid.get(gridKey(gx, gz));
    if (!cell) continue;
    for (const c of cell) if (!seen.has(c)) { seen.add(c); out.push(c); }
  }
  return out;
}
function blockedStatic(x, z, r = .58) { for (const c of nearbyColliders(x, z, r)) if (x > c.x - c.w / 2 - r && x < c.x + c.w / 2 + r && z > c.z - c.d / 2 - r && z < c.z + c.d / 2 + r) return true; return false; }
function blocked(x, z, r = .58) { if (blockedStatic(x, z, r)) return true; for (const m of movers) if (Math.hypot(x - m.obj.position.x, z - m.obj.position.z) < (m.r || .7) + r) return true; return false; }
function cull(obj, x, z, range = 340) { cullables.push({ obj, x, z, range }); return obj; }
function boxGeo(w, h, d) { const k = `b${w.toFixed(2)}:${h.toFixed(2)}:${d.toFixed(2)}`; let g = geoCache.get(k); if (!g) { g = new THREE.BoxGeometry(w, h, d); geoCache.set(k, g); } return g; }
function cylGeo(r, h, seg = 12) { const k = `c${r.toFixed(2)}:${h.toFixed(2)}:${seg}`; let g = geoCache.get(k); if (!g) { g = new THREE.CylinderGeometry(r, r, h, seg); geoCache.set(k, g); } return g; }
function sphGeo(r, ws = 12, hs = 9) { const k = `s${r.toFixed(2)}:${ws}:${hs}`; let g = geoCache.get(k); if (!g) { g = new THREE.SphereGeometry(r, ws, hs); geoCache.set(k, g); } return g; }
function coneGeo(r, h, seg = 8) { const k = `n${r.toFixed(2)}:${h.toFixed(2)}:${seg}`; let g = geoCache.get(k); if (!g) { g = new THREE.ConeGeometry(r, h, seg); geoCache.set(k, g); } return g; }
function part(geo, color, parent, x, y, z) { const m = add(geo, mat(color), parent); m.position.set(x, y, z); return m; }
function unitGable() { let g = geoCache.get("gable"); if (!g) { const s = new THREE.Shape(); s.moveTo(-1, 0); s.lineTo(1, 0); s.lineTo(0, 1); s.closePath(); g = new THREE.ShapeGeometry(s); geoCache.set("gable", g); } return g; }
// 単位三角プリズム（屋根用）: 幅1, 高さ1, 奥行1, 棟はz軸方向。インスタンス化で家ごとに拡大縮小する。
const YAXIS = new THREE.Vector3(0, 1, 0);
function prismGeo() { let g = geoCache.get("prism"); if (g) return g; const v = new Float32Array([-.5, 0, .5, .5, 0, .5, 0, 1, .5, -.5, 0, -.5, .5, 0, -.5, 0, 1, -.5]); g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(v, 3)); g.setIndex([0, 1, 2, 3, 5, 4, 0, 2, 5, 0, 5, 3, 1, 4, 5, 1, 5, 2, 0, 3, 4, 0, 4, 1]); g.computeVertexNormals(); geoCache.set("prism", g); return g; }
function facadeTex() {
  if (texCache.has("facade")) return texCache.get("facade");
  const c = document.createElement("canvas"); c.width = 128; c.height = 160;
  const x = c.getContext("2d");
  x.fillStyle = "#c7ad84"; x.fillRect(0, 0, 128, 160);
  x.fillStyle = "rgba(255,245,210,.18)"; for (let i = 0; i < 26; i++) x.fillRect(rand(8, 118), rand(8, 150), rand(2, 9), 1);
  x.strokeStyle = "#4d3420"; x.lineWidth = 7; x.strokeRect(4, 4, 120, 152);
  x.beginPath(); x.moveTo(64, 4); x.lineTo(64, 44); x.moveTo(20, 40); x.lineTo(108, 40); x.moveTo(20, 96); x.lineTo(108, 96); x.moveTo(13, 14); x.lineTo(58, 92); x.moveTo(115, 14); x.lineTo(70, 92); x.stroke();
  x.fillStyle = "#2d2118"; x.fillRect(17, 52, 34, 35); x.fillRect(77, 52, 34, 35);
  x.fillStyle = "#ffd98a"; x.fillRect(22, 56, 24, 26); x.fillRect(82, 56, 24, 26);
  x.strokeStyle = "#2a1c12"; x.lineWidth = 3; x.beginPath(); x.moveTo(34, 56); x.lineTo(34, 82); x.moveTo(22, 69); x.lineTo(46, 69); x.moveTo(94, 56); x.lineTo(94, 82); x.moveTo(82, 69); x.lineTo(106, 69); x.stroke();
  x.fillStyle = "#6f4a2c"; x.fillRect(15, 88, 38, 5); x.fillRect(75, 88, 38, 5);
  x.fillStyle = "#3f7a4b"; x.fillRect(22, 90, 8, 5); x.fillRect(36, 90, 8, 5); x.fillRect(82, 90, 8, 5); x.fillRect(98, 90, 8, 5);
  x.fillStyle = "#4a3018"; x.fillRect(47, 105, 34, 51);
  x.fillStyle = "#2a1c10"; x.fillRect(52, 109, 24, 47);
  x.fillStyle = "#d8b36b"; x.fillRect(71, 131, 4, 4);
  const t = new THREE.CanvasTexture(c); texCache.set("facade", t); return t;
}
function instMat(k, opts) { if (mats.has(k)) return mats.get(k); const m = new THREE.MeshStandardMaterial(opts); mats.set(k, m); return m; }
function buildHouseBatch(specs, facade) {
  if (!specs.length) return;
  const n = specs.length;
  const body = new THREE.InstancedMesh(boxGeo(1, 1, 1), instMat("instBody", { color: 0xffffff, roughness: .92, flatShading: true }), n);
  const roof = new THREE.InstancedMesh(prismGeo(), instMat("instRoof", { color: 0xffffff, roughness: .85, flatShading: true }), n);
  const ridge = new THREE.InstancedMesh(boxGeo(1, 1, 1), instMat("instRoofRidge", { color: 0x2e241e, roughness: .86, flatShading: true }), n);
  const chimney = new THREE.InstancedMesh(boxGeo(1, 1, 1), instMat("instChimney", { color: 0x5a4a3e, roughness: .9, flatShading: true }), n);
  const fac = facade ? new THREE.InstancedMesh(boxGeo(1, 1, .14), instMat("instFacade", { map: facadeTex(), roughness: .9 }), n) : null;
  const awning = facade ? new THREE.InstancedMesh(boxGeo(1, 1, 1), instMat("instAwning", { color: 0x5f3d32, roughness: .82, flatShading: true }), n) : null;
  const balcony = facade ? new THREE.InstancedMesh(boxGeo(1, 1, 1), instMat("instBalcony", { color: 0x4b3322, roughness: .86, flatShading: true }), n) : null;
  const doorFrame = facade ? new THREE.InstancedMesh(boxGeo(1, 1, 1), instMat("instDoorFrame", { color: 0x2a1c12, roughness: .88, flatShading: true }), n) : null;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), O = new THREE.Vector3(), cb = new THREE.Color(), cr = new THREE.Color();
  const put = (mesh, i, s, q, lx, ly, lz, sx, sy, sz) => { O.set(lx, ly, lz).applyQuaternion(q); P.set(s.x + O.x, (s.y || 0) + O.y, s.z + O.z); S.set(sx, sy, sz); M.compose(P, q, S); mesh.setMatrixAt(i, M); };
  specs.forEach((s, i) => {
    Q.setFromAxisAngle(YAXIS, s.angle);
    const y = s.y || 0, rh = s.rh || s.w * .34;
    P.set(s.x, y + s.h / 2, s.z); S.set(s.w, s.h, s.d); M.compose(P, Q, S); body.setMatrixAt(i, M); body.setColorAt(i, cb.setHex(s.body));
    P.set(s.x, y + s.h, s.z); S.set(s.w * 1.05, rh, s.d * 1.08); M.compose(P, Q, S); roof.setMatrixAt(i, M); roof.setColorAt(i, cr.setHex(s.roof));
    put(ridge, i, s, Q, 0, s.h + rh * .98, 0, .28, .22, s.d * 1.16);
    put(chimney, i, s, Q, s.w * .28, s.h + rh * .68, -s.d * .18, .52, 1.35, .52);
    if (fac) {
      put(fac, i, s, Q, 0, s.h * .47, s.d / 2 + .08, s.w * .94, s.h * .92, .16);
      put(doorFrame, i, s, Q, 0, Math.min(s.h - .9, 2.05), s.d / 2 + .18, Math.min(1.9, s.w * .22), 2.1, .18);
      put(awning, i, s, Q, 0, Math.min(s.h - .45, 3.05), s.d / 2 + .42, Math.min(4.4, s.w * .46), .18, .82);
      put(balcony, i, s, Q, 0, Math.min(s.h - .7, s.h * .62), s.d / 2 + .38, Math.min(5.2, s.w * .52), .18, .62);
    }
  });
  for (const m of [body, roof, ridge, chimney, fac, doorFrame, awning, balcony]) {
    if (!m) continue;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.castShadow = false;
    m.receiveShadow = true;
    m.matrixAutoUpdate = false;
    m.matrixWorldAutoUpdate = false;
    world.add(m);
  }
}
function paintTexture(g, kind) { const R = (a, b) => a + Math.random() * (b - a); if (kind === "grass") { g.fillStyle = "#3c5639"; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 1100; i++) { g.fillStyle = `hsl(${R(82, 122)},${R(28, 46)}%,${R(20, 40)}%)`; g.fillRect(R(0, 128), R(0, 128), R(1, 2.4), R(2, 5)); } return; } if (kind === "cobble") { g.fillStyle = "#2c271f"; g.fillRect(0, 0, 128, 128); for (let ry = 0; ry < 8; ry++) for (let rx = 0; rx < 8; rx++) { const off = (ry % 2) * 8, x = rx * 16 + off, y = ry * 16, dark = Math.random() < .3; g.fillStyle = `hsl(${R(22, 42)},${R(8, 18)}%,${dark ? R(20, 30) : R(33, 47)}%)`; round(g, x + 1.9, y + 1.9, 12.2, 12.2, 5); g.fill(); g.fillStyle = "rgba(255,255,255,.05)"; round(g, x + 2.6, y + 2.6, 5, 4, 2); g.fill(); } return; } if (kind === "dirt") { g.fillStyle = "#6b5942"; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 800; i++) { g.fillStyle = `hsl(${R(24, 40)},${R(18, 36)}%,${R(26, 46)}%)`; g.fillRect(R(0, 128), R(0, 128), R(1, 3), R(1, 3)); } return; } if (kind === "stone") { g.fillStyle = "#46453d"; g.fillRect(0, 0, 128, 128); for (let ry = 0; ry < 4; ry++) for (let rx = 0; rx < 4; rx++) { const off = (ry % 2) * 16; g.fillStyle = `hsl(${R(34, 50)},${R(4, 10)}%,${R(40, 54)}%)`; round(g, rx * 32 + off + 2, ry * 32 + 2, 28, 28, 3); g.fill(); } return; } if (kind === "plank") { for (let i = 0; i < 8; i++) { g.fillStyle = `hsl(${R(22, 34)},${R(34, 50)}%,${R(22, 36)}%)`; g.fillRect(i * 16, 0, 16, 128); g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(i * 16, 0, 1.6, 128); } return; } g.fillStyle = "#555"; g.fillRect(0, 0, 128, 128); }
function texFor(kind) { if (texCache.has(kind)) return texCache.get(kind); const c = document.createElement("canvas"); c.width = c.height = 128; paintTexture(c.getContext("2d"), kind); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texCache.set(kind, t); return t; }
function surfaceMat(kind, repX, repZ) { const k = `surf:${kind}:${repX.toFixed(1)}:${repZ.toFixed(1)}`; if (mats.has(k)) return mats.get(k); const t = texFor(kind).clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repX, repZ); const m = new THREE.MeshStandardMaterial({ map: t, roughness: .95 }); mats.set(k, m); return m; }
function box(x, y, z, w, h, d, color, label = "", parent = world, important = false) { const m = add(boxGeo(w, h, d), mat(color), parent, important); m.position.set(x, y, z); if (parent === world && label) addCollider(x, z, w, d, label); if (parent === world) cull(m, x, z, important ? 900 : 350); return m; }
function cyl(x, y, z, r, h, color, label = "", parent = world, important = false) { const m = add(cylGeo(r, h), mat(color), parent, important); m.position.set(x, y, z); if (parent === world && label) addCollider(x, z, r * 2, r * 2, label); if (parent === world) cull(m, x, z, important ? 900 : 350); return m; }
function ground(w, d, color, kind = "grass") { const g = add(new THREE.PlaneGeometry(w, d), surfaceMat(kind, w / 8, d / 8), world, false, true); g.rotation.x = -Math.PI / 2; return g; }
function road(x, z, w, d, color = 0x766b5b, kind = "cobble") { const m = add(boxGeo(w, .05, d), surfaceMat(kind, Math.max(1, w / 4), Math.max(1, d / 4)), world, false, true); m.position.set(x, .03, z); cull(m, x, z, 900); return m; }
function faceToward(dx, dz) { return Math.atan2(dx, dz); }
function roadFacingAngle(x, z) { let best = { dist: Infinity, dx: 0, dz: 1 }; for (const rx of ROAD_LINES.vertical) { const dist = Math.abs(x - rx); if (dist < best.dist) best = { dist, dx: rx - x, dz: 0 }; } for (const rz of ROAD_LINES.horizontal) { const dist = Math.abs(z - rz); if (dist < best.dist) best = { dist, dx: 0, dz: rz - z }; } return faceToward(best.dx, best.dz || 0.0001); }
function rotatedAabb(w, d, angle) { const c = Math.abs(Math.cos(angle)), s = Math.abs(Math.sin(angle)); return { w: w * c + d * s, d: w * s + d * c }; }

function loadMap(id, spawn) {
  state.map = id;
  world.clear();
  npcs.forEach((n) => scene.remove(n));
  npcs = [];
  movers = [];
  locations = [];
  colliders = [];
  colliderGrid = new Map();
  cullables = [];
  projectiles = [];
  bursts = [];
  mixers = [];
  caravanThreat = null;
  facadeSpecs = [];
  plainSpecs = [];
  shopAnchors = [];
  resetModelNpcBudget(id);
  ({ forestRoad: buildForestRoad, plaza: buildCity, guildHall: buildGuildHall, church: buildChurch, trainingGround: buildTrainingGround, academy: buildAcademy, academyCampus: buildAcademyCampus, churchGrounds: buildChurchGrounds, inn: buildInn }[id] || buildForestRoad)();
  locations.forEach(addMarker);
  applyTimeOfDay();
  player.position.set(spawn.x, spawn.y || 0, spawn.z);
  updateHud();
  updateCulling();
}
function playMapTransitionSound(targetMap) { audio.play(INDOOR_MAPS.has(state.map) && !INDOOR_MAPS.has(targetMap) ? "door_close" : "door_open"); }
function loadGltf(url) {
  return new Promise((resolve, reject) => modelLoader.load(url, resolve, undefined, reject));
}
function loadCharacterModel(key, urls) {
  const cacheKey = `${key}:${urls.join("|")}`;
  if (!modelCache.has(cacheKey)) {
    const promise = Promise.all(urls.map(loadGltf));
    promise.catch(() => modelCache.delete(cacheKey));
    modelCache.set(cacheKey, promise);
  }
  return modelCache.get(cacheKey).then((gltfs) => {
    const g = new THREE.Group();
    gltfs.forEach((gltf) => g.add(cloneSkeleton(gltf.scene)));
    // 将来 idle 入りの GLB を差し替えた場合に備え、アニメclipがあれば保持(現状のCC0素体は0個)。
    const clips = gltfs.flatMap((gltf) => gltf.animations || []);
    if (clips.length) g.userData.clips = clips;
    return g;
  });
}
function matKind(name) { name = (name || "").toLowerCase(); if (name.includes("hair") || name.includes("beard")) return "hair"; if (name.includes("eye")) return "eye"; if (name.includes("peasant") || name.includes("ranger") || name.includes("outfit") || name.includes("cloth") || name.includes("robe")) return "outfit"; return "skin"; }
function fitExternalNpcModel(model, scale, tint, castShadow = false) {
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  if (Number.isFinite(box.min.y)) model.position.y -= box.min.y;
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = Boolean(castShadow);
    obj.receiveShadow = false;
    obj.frustumCulled = true;
    const mats = (Array.isArray(obj.material) ? obj.material : [obj.material]).filter(Boolean);
    mats.forEach((m) => { m.roughness = Math.max(m.roughness || 0, .82); if (tint && m.color) { const c = tint[matKind(m.name)]; if (c != null) m.color.setHex(c); } m.needsUpdate = true; });
  });
  return model;
}
const modelDebug = params.has("modelDebug");
function resetModelNpcBudget(mapId) {
  modelNpcBudget = MODEL_NPC_BUDGET[qualityMode] || MODEL_NPC_BUDGET.medium;
  ambientModelNpcBudget = AMBIENT_MODEL_NPC_BUDGET[qualityMode] || AMBIENT_MODEL_NPC_BUDGET.medium;
  Object.assign(modelStats, { external: 0, fallback: 0, primitive: 0, loading: 0, budget: modelNpcBudget, remaining: modelNpcBudget, ambientBudget: ambientModelNpcBudget, ambientRemaining: ambientModelNpcBudget, quality: qualityMode, map: mapId });
  updateModelStatsDataset();
}
function reserveModelNpcSlot(ambient = false) {
  if (modelNpcBudget <= 0) return false;
  if (ambient && ambientModelNpcBudget <= 0) return false;
  modelNpcBudget--;
  if (ambient) ambientModelNpcBudget--;
  modelStats.remaining = modelNpcBudget;
  modelStats.ambientRemaining = ambientModelNpcBudget;
  updateModelStatsDataset();
  return true;
}
function modelStatusBucket(status) {
  if (status === "loaded") return "external";
  if (status === "loading") return "loading";
  if (status === "primitive") return "primitive";
  if (status === "fallback" || status === "invalid-box") return "fallback";
  return null;
}
function updateModelStatsDataset() {
  try {
    document.body.dataset.modelExternal = String(modelStats.external);
    document.body.dataset.modelFallback = String(modelStats.fallback);
    document.body.dataset.modelPrimitive = String(modelStats.primitive);
    document.body.dataset.modelLoading = String(modelStats.loading);
    document.body.dataset.modelBudget = String(modelStats.budget);
    document.body.dataset.modelRemaining = String(modelStats.remaining);
    document.body.dataset.modelAmbientBudget = String(modelStats.ambientBudget);
    document.body.dataset.modelAmbientRemaining = String(modelStats.ambientRemaining);
  } catch {}
}
const AMBIENT_HUMAN_DIALOGUES = new Set(["generic", "townsfolk", "market", "alley", "academy_student"]);
function isAmbientHumanNpc(variant, dialogue, options = {}) {
  if (options.priority === "fixed") return false;
  if (options.label === false) return true;
  if (AMBIENT_HUMAN_DIALOGUES.has(dialogue)) return true;
  return state.map === "plaza" && (variant === "faithful" || variant === "student" || variant === "slum");
}
function chooseHumanModelKey(variant, options = {}) {
  if (options.modelKey) return options.modelKey;
  const keys = HUMAN_MODEL_KEYS[variant];
  return keys ? pick(keys) : null;
}
function addPrimitiveNpc(variant, x, z, color, name, dialogue, options = {}) {
  const n = createPerson(variant, color);
  n.position.set(x, 0, z);
  n.userData = { kind: "npc", id: dialogue, name, dialogue, r: .8, modelKey: options.modelKey || null, modelStatus: "primitive" };
  if (options.label !== false) {
    const lab = label(name);
    lab.position.set(0, 2.55, 0);
    lab.scale.set(1.6, .4, 1);
    n.add(lab);
  }
  scene.add(n);
  npcs.push(n);
  modelStats.primitive++;
  updateModelStatsDataset();
  if (modelDebug && options.modelKey) addModelDebugTag(n, "primitive" + (options.reason ? ":" + options.reason : ""));
  return n;
}
function addHumanNpc(variant, x, z, color, name, dialogue, options = {}) {
  const modelKey = chooseHumanModelKey(variant, options);
  if (!modelKey || options.model === false) return addPrimitiveNpc(variant, x, z, color, name, dialogue, { ...options, modelKey, reason: "disabled" });
  const ambient = isAmbientHumanNpc(variant, dialogue, options);
  if (!reserveModelNpcSlot(ambient)) return addPrimitiveNpc(variant, x, z, color, name, dialogue, { ...options, modelKey, reason: ambient ? "ambient-budget" : "budget" });
  return placeModelNpc(modelKey, variant, x, z, color, name, dialogue, { ...options, reservedModelSlot: true });
}
// 表示検証: meshが存在し、Box3の高さが妥当な範囲にあるか（崩壊/極小/巨大なら不合格）
function verifyModelVisible(model) {
  let meshes = 0; model.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) meshes++; });
  if (meshes < 1) return { ok: false, reason: "no-mesh" };
  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) return { ok: false, reason: "empty-box" };
  const size = new THREE.Vector3(); box.getSize(size);
  if (![size.x, size.y, size.z].every(Number.isFinite)) return { ok: false, reason: "non-finite" };
  if (size.y < 1.0 || size.y > 3.5) return { ok: false, reason: "h" + size.y.toFixed(2) };
  return { ok: true, height: size.y };
}
function setModelStatus(n, modelKey, status, reason) {
  const prev = modelStatusBucket(n.userData.modelStatus);
  if (prev && modelStats[prev] > 0) modelStats[prev]--;
  n.userData.modelStatus = status;
  const next = modelStatusBucket(status);
  if (next) modelStats[next]++;
  updateModelStatsDataset();
  try { document.body.dataset[modelKey + "Model"] = status; } catch {}
  if (modelDebug) addModelDebugTag(n, status + (reason ? ":" + reason : ""));
}
function addModelDebugTag(n, text) {
  const old = n.getObjectByName("__dbgTag"); if (old) { n.remove(old); old.material?.map?.dispose?.(); }
  const tag = label("GLTF " + text); tag.name = "__dbgTag"; tag.position.set(0, 3.05, 0); tag.scale.set(2.0, .5, 1);
  n.add(tag);
}
function placeModelNpc(modelKey, fallbackVariant, x, z, color, name, dialogue, options = {}) {
  const def = CHARACTER_MODELS[modelKey];
  const n = new THREE.Group();
  n.position.set(x, 0, z);
  n.rotation.y = options.rotationY ?? def?.npcRotationY ?? 0;
  n.userData = { kind: "npc", id: dialogue, name, dialogue, r: .8, modelKey, modelStatus: "pending" };
  const fallback = createPerson(fallbackVariant, color);
  fallback.userData.isModelFallback = true;
  n.add(fallback);
  if (options.label !== false) {
    const lab = label(name);
    lab.position.set(0, 2.55, 0);
    lab.scale.set(1.6, .4, 1);
    n.add(lab);
  }
  scene.add(n);
  npcs.push(n);
  if (!def) { setModelStatus(n, modelKey, "fallback", "no-def"); return n; }
  if (!options.reservedModelSlot && !reserveModelNpcSlot()) { setModelStatus(n, modelKey, "primitive", "budget"); return n; }
  setModelStatus(n, modelKey, "loading");
  const targetMap = options.map || state.map;
  loadCharacterModel(modelKey, def.parts).then((model) => {
    if (!n.parent || state.map !== targetMap) return; // マップが変わっていたら破棄
    model.rotation.y = def.rotationY || 0;
    const castShadow = Boolean((options.important || def.shadow) && quality.shadow && qualityMode !== "low");
    const fitted = fitExternalNpcModel(model, def.scale || 1, def.tint, castShadow);
    const v = verifyModelVisible(fitted);
    if (!v.ok) { setModelStatus(n, modelKey, "invalid-box", v.reason); return; } // 表示検証NG → fallback維持
    if (def.offset) fitted.position.set((def.offset.x || 0), fitted.position.y + (def.offset.y || 0), (def.offset.z || 0));
    n.remove(fallback);
    n.add(fitted);
    setModelStatus(n, modelKey, "loaded");
    // 重要な固定NPCのみ: アニメclipがあれば idle を再生(現状の素体は0個なのでT字のまま=既知の制限)。
    const clips = fitted.userData.clips;
    if (clips && clips.length && !options.reservedModelSlot) {
      const mixer = new THREE.AnimationMixer(fitted);
      const idle = clips.find((c) => /idle|stand|breath/i.test(c.name)) || clips[0];
      mixer.clipAction(idle).play();
      mixers.push(mixer);
    }
  }).catch(() => setModelStatus(n, modelKey, "fallback", "load-error"));
  return n;
}
function buildForestRoad() { setEnv(0x6f91a1, 40, quality.fog); bounds = { minX: -95, maxX: 95, minZ: -135, maxZ: 135 }; ground(210, 290, 0x35513d); road(0, 0, 9, 260, 0x746756, "dirt"); for (let z = -120; z <= 120; z += 18) { road(-15, z, 20, 3, 0x665b4f, "dirt"); road(16, z + 8, 18, 2.8, 0x665b4f, "dirt"); } for (let i = 0; i < Math.floor(180 * quality.houses); i++) addTree((Math.random() < .5 ? -1 : 1) * rand(12, 86), rand(-128, 128), rand(.8, 1.4), true); for (let i = 0; i < Math.floor(60 * quality.props); i++) addRock(rand(-85, 85), rand(-125, 125), rand(.3, .8)); addGate(0, -112); addCaravan(6, 15); addSign(7, -90, "ROYAL CAPITAL"); locations.push({ id: "gate", name: "北門の検問を受ける", x: 0, z: -108, r: 6, dialogue: "north_gate" }, { id: "caravan", name: done("merchant") ? "救助済みの荷車を見る" : "荷車襲撃現場を見る", x: 6, z: 15, r: 6, dialogue: "caravan_attack" }); placeModelNpc("guard", "guard", 4, -98, 0xb77954, "北門衛兵", "north_gate", { map: "forestRoad" }); for (let i = 0; i < 4; i++) addNpc("guard", rand(-8, 8), rand(-70, 45), 0xb77954, "北門衛兵", "north_gate"); }
function buildCity() { setEnv(0xbcd6e6, 130, 1500); bounds = { minX: -680, maxX: 680, minZ: -680, maxZ: 680 }; ground(1420, 1420, 0x6f8a52, "grass"); const floor = add(new THREE.PlaneGeometry(1330, 1330), surfaceMat("dirt", 90, 90), world, false, true); floor.rotation.x = -Math.PI / 2; floor.position.y = .012; cityWall(); road(0, 0, 24, 1240, 0x817767); road(0, 0, 1240, 24, 0x817767); for (const z of [-330, -130, 130, 330, 430]) road(0, z, 980, 9, 0x6f6657); for (const x of [-430, -330, -130, 130, 330, 430]) road(x, 0, 9, 980, 0x6f6657); minorAlleys(); castleHill(); centralPlaza(); guildDistrict(135, -70); churchDistrict(-185, -85); academyDistrict(-300, -60); marketDistrict(285, 85); craftDistrict(350, -125); nobleDistrict(-250, -350); slumDistrict(-410, 245); trainingDistrict(380, 330); gateDistrict(0, 610); shoppingStreet(); cityFill(); buildHouseBatch(facadeSpecs, true); buildHouseBatch(plainSpecs, false); traffic(); pedestrians(); props(); streetDressing(); addSign(0, 610, "NORTH GATE"); addSign(135, -38, "GUILD"); addSign(-185, -48, "CHURCH"); addSign(-300, -42, "ACADEMY"); addSign(285, 125, "MARKET"); addSign(-390, 235, "ALLEY"); addSign(15, 72, "北 ─ 北門・森の街道"); addSign(15, -72, "南 ─ 王城・貴族区(丘)"); addSign(72, 15, "東 ─ 市場・職人区"); addSign(-72, 15, "西 ─ 学院・教会区"); locations.push({ id: "plaza", name: "中央広場を見渡す", x: 0, z: 40, r: 12, dialogue: "plaza" }, { id: "guild", name: "冒険者ギルドに入る", x: 135, z: -60, r: 10, dialogue: "guild" }, { id: "market", name: "市場の盗難騒ぎを見る", x: 260, z: 95, r: 13, dialogue: "market" }, { id: "church", name: "大聖堂の敷地に入る", x: -185, z: -70, r: 12, targetMap: "churchGrounds", spawn: { x: 0, z: 44 } }, { id: "training", name: "外門練習場へ行く", x: 360, z: 330, r: 13, dialogue: "training_gate" }, { id: "alley", name: "怪しい路地裏に入る", x: -390, z: 235, r: 12, dialogue: "alley" }, { id: "blacksmith", name: "鍛冶屋に近づく", x: 330, z: -110, r: 9, dialogue: "blacksmith" }); }
// #47 ギルド会館: 受付/依頼掲示板/待合/魔力測定室/ギルドマスター室前/訓練場案内 を持つ中規模施設。
// 進行(guild_reception/mana_measure/guildmaster の座標・dialogue)は不変。guild_anomaly.js と整合。
function buildGuildHall() {
  setEnv(0x1f1711, 12, 42); bounds = { minX: -13, maxX: 13, minZ: -10, maxZ: 9 };
  ground(28, 22, 0x4c3727, "plank");
  world.add(new THREE.HemisphereLight(0xffd6a0, 0x241a12, 1.95));
  for (const [lx, lz] of [[0, -4], [-8, 2], [8, 2]]) { const torch = new THREE.PointLight(0xffb86a, 6, 20, 2); torch.position.set(lx, 3.7, lz); world.add(torch); }
  room(28, 22, 3.5, 0x3a281c);
  // 受付カウンター(既存導線)
  box(0, .55, -4.5, 7.2, 1.1, .9, 0x6b4a2f, "counter", world, true);
  box(0, 1.35, -6.6, 7.8, 2.7, .5, 0x5a3d27, "shelf", world, true);
  addSign(0, -6.2, "受付 / RECEPTION");
  // 依頼掲示板コーナー(左)
  addQuestBoard(-10, -4.2); addQuestBoard(-10, -1.4); addSign(-10, -6.4, "依頼掲示板");
  // 魔力測定室(右・低い間仕切りで区切る。水晶は既存座標)
  for (const pz of [-6.5, -1]) box(7.6, .95, pz, .3, 1.9, 3.2, 0x4a3526, "partition", world, true);
  box(6, .95, -7.6, 3.6, 1.9, .3, 0x4a3526, "partition", world, true);
  const crystal = add(new THREE.SphereGeometry(.45, 16, 10), mat(0x80d8ff, .2, 0x65cfff, .9), world, false, false); crystal.position.set(3.6, 1.15, -3.4); cull(crystal, 3.6, -3.4, 60);
  cyl(3.6, .55, -3.4, .32, .8, 0x62513a, "crystalBase", world, true);
  addSign(5.6, -7.2, "魔力測定室");
  // ギルドマスター室前(左奥・扉と表札)
  box(-3.8, 1.4, -6.8, 3.4, 2.8, .4, 0x4a3526, "gmDoor", world, true); addSign(-3.8, -6.4, "ギルドマスター室");
  // 待合スペース(手前)
  for (const [bx, bz] of [[-8, 3.6], [8, 3.6], [-8, 6.2], [8, 6.2]]) bench(bx, bz, 0);
  box(-10, .5, 5, 2, 1, 1.2, 0x5a4632, "table", world, true); box(10, .5, 5, 2, 1, 1.2, 0x5a4632, "table", world, true);
  addSign(0, 4.6, "待合 / WAITING");
  addSign(10, 7.6, "→ 外門練習場(王都南東)");
  // NPC(固定導線は維持。待合に数人)
  placeModelNpc("guildReceptionist", "receptionist", 0, -3.3, 0xd8b36b, "受付", "guild_reception", { map: "guildHall" });
  placeModelNpc("guildmaster", "noble", -3.8, -3.4, 0x4f5d6f, "ギルドマスター", "guildmaster", { map: "guildHall" });
  addNpc("receptionist", 2.2, -3.3, 0xcab9a0, "ギルド職員", "guild_clerk");
  addNpc("adventurer", -8, 4.7, 0x8c6f4f, "待機中の冒険者", "guild_lobby");
  addNpc("adventurer", 8, 4.7, 0x5f7b55, "依頼を選ぶ冒険者", "guild_board");
  addNpc("merchant", -10, 6, 0x9a6f54, "依頼人", "guild_lobby");
  locations.push(
    { id: "reception", name: "受付で登録申請をする", x: 0, z: -3.3, r: 3, dialogue: "guild_reception" },
    { id: "crystal", name: "魔力測定水晶に触れる", x: 3.6, z: -3.4, r: 2.6, dialogue: "mana_measure" },
    { id: "guildmaster", name: "ギルドマスターと話す", x: -3.8, z: -3.4, r: 2.8, dialogue: "guildmaster" },
    { id: "guild_board", name: "依頼掲示板を確認する", x: -10, z: -3, r: 2.6, dialogue: "guild_board" },
    { id: "guild_exit", name: "王都へ戻る", x: 0, z: 8.7, r: 2, targetMap: "plaza", spawn: { x: 135, z: -42 } }
  );
}
function buildChurch() { setEnv(0x151823, 12, 36); bounds = { minX: -7, maxX: 7, minZ: -7, maxZ: 7 }; ground(14, 14, 0x5b5a55, "stone"); world.add(new THREE.HemisphereLight(0xcfe0ff, 0x1a1d28, 1.7)); const glow = new THREE.PointLight(0xbfd4ff, 6, 20, 2); glow.position.set(0, 3.4, -3); world.add(glow); room(14, 14, 4, 0x44434a); box(0, .55, -4.4, 3.8, 1.05, 1.25, 0xddd1ae, "altar", world, true); for (let i = 0; i < 4; i++) { box(-2.6, .28, -1.2 + i * 1.45, 2.4, .35, .55, 0x5d4129, "bench"); box(2.6, .28, -1.2 + i * 1.45, 2.4, .35, .55, 0x5d4129, "bench"); } placeModelNpc("priest", "priest", 0, -2.5, 0xc9c4ad, "司祭", "church", { map: "church" }); locations.push({ id: "church_record_seat", name: "司祭に身分記録を相談する", x: 0, z: -2.5, r: 3, dialogue: "church" }, { id: "church_exit", name: "前庭へ戻る", x: 0, z: 6.4, r: 2.4, targetMap: "churchGrounds", spawn: { x: 0, z: -46 } }); }
// 大聖堂前庭(別マップ): 大聖堂ファサード・双塔/尖塔・ステンドグラス調の窓・庭園・噴水・記録所(内部へ接続)・司祭/記録官/信徒。軽量。
function buildChurchGrounds() {
  setEnv(0xb6c4d2, 70, 1000); bounds = { minX: -60, maxX: 60, minZ: -90, maxZ: 66 };
  ground(130, 170, 0x6f8a52, "grass"); road(0, -10, 12, 150, 0x8a8068);
  house(0, -66, 44, 30, 26, 0x9a96a2, "CATHEDRAL", true, faceToward(0, 1));
  for (const sx of [-26, 26]) { box(sx, 16, -64, 10, 34, 10, 0x8e8a98, "tower", world, true); const sp = add(coneGeo(7, 18, 4), mat(0x2f3541), world, true); sp.position.set(sx, 42, -64); sp.rotation.y = Math.PI / 4; cull(sp, sx, -64, 1200); }
  { const cs = add(coneGeo(9, 26, 4), mat(0x33506a), world, true); cs.position.set(0, 43, -66); cs.rotation.y = Math.PI / 4; cull(cs, 0, -66, 1300); }
  for (const [sx, col] of [[-12, 0xc0476a], [0, 0x4a86c0], [12, 0x5fae6a]]) { const w = add(boxGeo(3.4, 6, .3), mat(col, .3, col, .85), world); w.position.set(sx, 8, -50.6); cull(w, sx, -50, 900); }
  fountain(0, -6, 3.4); for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) bench(Math.cos(a) * 11, -6 + Math.sin(a) * 11, a + Math.PI / 2);
  for (let i = 0; i < 10; i++) addTree(rand(-50, 50), rand(2, 40), rand(1, 1.5), true);
  for (let i = 0; i < 10; i++) flowerBox(rand(-42, 42), rand(-2, 38));
  for (let z = -48; z <= 42; z += 18) { lamp(-8, z); lamp(8, z); } addSign(0, 54, "GRAND CATHEDRAL");
  placeModelNpc("priest", "priest", -6, -40, 0xddd6c2, "司祭", "church", { map: "churchGrounds" });
  addNpc("noble", 8, -38, 0xd8c89a, "記録官", "shop_records");
  for (let i = 0; i < 6; i++) addNpc("faithful", rand(-30, 30), rand(-8, 30), 0xc9c4ad, "信徒", "church");
  locations.push(
    { id: "church_grounds_exit", name: "王都へ戻る", x: 0, z: 60, r: 5, targetMap: "plaza", spawn: { x: -185, z: -48 } },
    { id: "church_office", name: "記録所に入る", x: 0, z: -52, r: 5, targetMap: "church", spawn: { x: 0, z: 5 } },
    { id: "church_grounds_priest", name: "司祭に身分記録を相談する", x: -6, z: -38, r: 3, dialogue: "church" }
  );
}
function buildTrainingGround() { setEnv(0x88a6b4, 25, 180); bounds = { minX: -60, maxX: 60, minZ: -70, maxZ: 70 }; ground(130, 150, 0x556c4c); road(0, 0, 18, 130, 0x776b5a); for (let i = 0; i < 16; i++) cyl(rand(-35, 35), .85, rand(-40, 40), .25, 1.7, 0x7a5635, "target"); addSign(0, 48, "TO CAPITAL"); placeModelNpc("guard", "guard", -8, 12, 0xb77954, "訓練教官", "training", { map: "trainingGround" }); addNpc("adventurer", 10, -8, 0x6f8aa6, "模擬戦相手", "mock_battle"); locations.push({ id: "practice", name: "火球制御を練習する", x: -8, z: 12, r: 4, dialogue: "training" }, { id: "mock", name: "翌日の模擬戦を受ける", x: 10, z: -8, r: 4, dialogue: "mock_battle" }, { id: "training_exit", name: "王都へ戻る", x: 0, z: 52, r: 4, targetMap: "plaza", spawn: { x: 360, z: 305 } }); }
function buildAcademy() { setEnv(0x1a1c28, 12, 42); bounds = { minX: -9, maxX: 9, minZ: -8, maxZ: 8 }; ground(18, 16, 0x4a4640, "stone"); world.add(new THREE.HemisphereLight(0xcfd8f0, 0x20222e, 1.85)); const glow = new THREE.PointLight(0xbfd0ff, 7, 26, 2); glow.position.set(0, 4, -2); world.add(glow); room(18, 16, 3.8, 0x383a48); box(0, .6, -5.2, 6, 1.2, 1, 0x5a4a36, "lectern", world, true); for (let i = 0; i < 3; i++) { box(-7.6, 1.4, -3 + i * 2.6, .6, 2.8, 2.2, 0x4a3320, "shelf", world, true); box(7.6, 1.4, -3 + i * 2.6, .6, 2.8, 2.2, 0x4a3320, "shelf", world, true); } const orb = add(sphGeo(.5, 16, 12), mat(0x8fd2ff, .2, 0x6fb8ff, 1.0), world, false, false); orb.position.set(0, 2.3, -3.6); cull(orb, 0, -3.6, 70); cyl(0, .55, -3.6, .34, .8, 0x55607a, "orbBase", world, true); cyl(4.6, .9, 2.6, .3, 1.8, 0x7a5635, "target", world, true); for (let i = 0; i < 4; i++) box(-3 + i * 2, .35, 4.5, 1.6, .6, 1, 0x4a3a2a, "bench", world, true); placeModelNpc("academyTeacher", "teacher", 0, -3.7, 0x3a2e5a, "魔法学院 教師", "academy_teacher", { map: "academy" }); addNpc("student", -3.2, 1.4, 0x2e3a5c, "学院生", "academy_student"); addNpc("student", 3.4, .8, 0x2e3a5c, "学院生", "academy_student"); locations.push({ id: "academy_teacher", name: "教師と話す", x: 0, z: -3.7, r: 3, dialogue: "academy_teacher" }, { id: "academy_orb", name: "魔導具を調べる", x: 0, z: -3.6, r: 2.6, dialogue: "academy_orb" }, { id: "academy_exit", name: "キャンパスへ戻る", x: 0, z: 7.2, r: 2.4, targetMap: "academyCampus", spawn: { x: 0, z: -46 } }); }
// 魔法学院キャンパス(別マップ): 正門・中庭・講義棟(内部へ接続)・魔法塔・庭園・練習場・学生群。軽量プリミティブ。
function buildAcademyCampus() {
  setEnv(0xaecbe0, 70, 1000); bounds = { minX: -68, maxX: 68, minZ: -92, maxZ: 66 };
  ground(150, 178, 0x6f8a52, "grass"); road(0, -14, 13, 150, 0x8a8068); road(0, 12, 92, 12, 0x8a8068);
  for (const [bx, bz, bw, bd] of [[0, -90, 150, 4], [-68, -14, 4, 156], [68, -14, 4, 156]]) box(bx, 4.5, bz, bw, 9, bd, 0x8f93b4, "wall", world, true);
  addGate(0, 60);
  house(0, -66, 50, 26, 19, 0x8a8fb0, "LECTURE HALL", true, faceToward(0, 1));
  box(42, 14, -52, 12, 28, 12, 0x9296b6, "tower", world, true); { const tr = add(coneGeo(9, 16, 6), mat(0x3a4a78), world, true); tr.position.set(42, 36, -52); cull(tr, 42, -52, 1200); }
  house(-44, -44, 24, 18, 13, 0x847fae, "ANNEX", true, faceToward(1, 0));
  fountain(0, 12, 3.2); for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) bench(Math.cos(a) * 9, 12 + Math.sin(a) * 9, a + Math.PI / 2);
  for (let i = 0; i < 9; i++) addTree(rand(-62, -34), rand(-24, 36), rand(1, 1.6), true);
  for (let i = 0; i < 8; i++) flowerBox(rand(-58, -36), rand(-18, 34));
  box(46, .07, 24, 30, .14, 44, 0x746b56, "yard", world, true); for (let i = 0; i < 6; i++) cyl(40 + rand(-9, 9), 1, 22 + rand(-16, 16), .28, 2, 0x8a5d38, "target");
  for (let z = -78; z <= 48; z += 22) { lamp(-9, z); lamp(9, z); } addSign(0, 54, "ROYAL ACADEMY");
  for (let i = 0; i < 6; i++) addNpc("student", rand(-22, 24), rand(-28, 24), 0x2e3a5c, "学院生", "academy_student");
  addNpc("teacher", -10, -44, 0x3a2e5a, "学院教師", "academy_teacher");
  placeModelNpc("guard", "guard", 9, 40, 0xb77954, "学院門衛", "academy_campus", { map: "academyCampus" });
  locations.push(
    { id: "academy_campus_exit", name: "王都へ戻る", x: 0, z: 62, r: 5, targetMap: "plaza", spawn: { x: -300, z: -42 } },
    { id: "academy_enter", name: "講義棟に入る", x: 0, z: -52, r: 5, targetMap: "academy", spawn: { x: 0, z: 7 } },
    { id: "academy_campus_teacher", name: "学院教師と話す", x: -10, z: -42, r: 3, dialogue: "academy_teacher" }
  );
}
function academyDistrict(x, z) { house(x, z, 40, 28, 20, 0x8a8fb0, "ACADEMY", true, faceToward(0, 1)); box(x + 23, 14, z - 2, 12, 28, 12, 0x9296b6, "academy", world, true); const tr = add(coneGeo(9, 17, 6), mat(0x3a4a78), world, true); tr.position.set(x + 23, 30.5, z - 2); cull(tr, x + 23, z, 1300); for (const s of [-1, 1]) { cyl(x + s * 11, 4, z + 16, .2, 8, 0x4a4632, "", world); box(x + s * 11, 5.4, z + 16, .3, 5, 2.4, 0x3a4a8c, "", world); } for (let i = 0; i < 5; i++) addNpc("student", x + rand(-17, 17), z + rand(19, 32), 0x2e3a5c, "学院生", "academy_student"); addNpc("teacher", x + 7, z + 16, 0x3a2e5a, "学院門衛", "academy_gate"); locations.push({ id: "academy", name: "魔法学院に入る", x: x, z: z + 16, r: 11, dialogue: "academy_gate" }); }
const SHOP_T = { weapon: { name: "武器屋", wall: 0x6a5a4a, accent: 0x8a9098, keeper: "blacksmith", kname: "武器屋の主", dlg: "shop_weapon" }, armor: { name: "防具屋", wall: 0x5a6068, accent: 0xb6bcc6, keeper: "merchant", kname: "防具屋の主", dlg: "shop_armor" }, potion: { name: "薬屋", wall: 0x4a6a5a, accent: 0x6fcf8f, keeper: "merchant", kname: "薬師", dlg: "shop_potion" }, magicshop: { name: "魔法具店", wall: 0x4a4a6a, accent: 0x8fbfff, keeper: "teacher", kname: "魔法具商", dlg: "shop_magic" }, bakery: { name: "パン屋", wall: 0x8a6a44, accent: 0xe0b870, keeper: "merchant", kname: "パン屋", dlg: "shop_bakery" }, inn: { name: "宿屋 曲がった匙亭", wall: 0x7a5a3a, accent: 0xd8b36b, keeper: "merchant", kname: "女将マルタ", dlg: "inn_gate", enter: 1 }, tavern: { name: "酒場", wall: 0x6a4438, accent: 0xc8763a, keeper: "merchant", kname: "酒場の主", dlg: "shop_tavern" }, records: { name: "記録所", wall: 0x6a6458, accent: 0xd8c89a, keeper: "noble", kname: "記録官", dlg: "shop_records" } };
function shopfront(x, z, angle, type) { const T = SHOP_T[type]; house(x, z, 16, 13, rand(8, 11), T.wall, T.name, true, angle); const fx = Math.sin(angle), fz = Math.cos(angle); const aw = box(x + fx * 6.6, 2.6, z + fz * 6.6, 4.4, .16, 1.6, T.accent, "", world); aw.rotation.y = angle; addNpc(T.keeper, x + fx * 7.4, z + fz * 7.4, T.wall, T.kname, T.dlg); shopAnchors.push([x, z, 13]); if (T.enter) locations.push({ id: T.dlg, name: T.name + "に入る", x: x + fx * 6.8, z: z + fz * 6.8, r: 5, dialogue: T.dlg }); }
function shoppingStreet() { for (const [t, x] of [["weapon", 70], ["armor", 110], ["potion", 150], ["magicshop", 190]]) shopfront(x, -22, faceToward(0, 1), t); for (const [t, x] of [["inn", 70], ["tavern", 110], ["records", 150], ["bakery", 190]]) shopfront(x, 22, faceToward(0, -1), t); for (let i = 0; i < 6; i++) { lamp(52 + i * 28, -11); lamp(52 + i * 28, 11); } for (let i = 0; i < 5; i++) addNpc(pick(["merchant", "traveler", "adventurer"]), rand(55, 200), rand(-10, 10), pick([0x8c6f4f, 0x7f9fbd, 0x6f8aa6]), "通行人", "townsfolk"); }
function buildInn() { setEnv(0x241a16, 12, 38); bounds = { minX: -7, maxX: 7, minZ: -7, maxZ: 7 }; ground(14, 14, 0x4a3a2a, "plank"); world.add(new THREE.HemisphereLight(0xffd6a0, 0x241a12, 1.85)); const t = new THREE.PointLight(0xffb86a, 8, 22, 2); t.position.set(0, 3.4, -1); world.add(t); room(14, 14, 3.6, 0x3a2a22); box(0, .6, -4.6, 5.4, 1.2, 1.1, 0x6a4a2c, "counter", world, true); for (let i = 0; i < 3; i++) box(-4.5 + i * 4.5, .4, 3.8, 2.4, .7, 1.4, 0x5a4632, "table", world, true); for (const [bx, bz] of [[-2, -2.6], [2, -2.6]]) box(bx, .35, bz, 2, .6, 1.6, 0x4a3320, "bench", world, true); placeModelNpc("innMarta", "merchant", 0, -3.4, 0xd8b36b, "女将マルタ", "inn_marta", { map: "inn" }); addNpc("adventurer", -3.6, 2, pick([0x8c6f4f, 0x58718d]), "酒場の客", "townsfolk"); addNpc("slum", 3.6, 2.4, 0x6a5a4a, "酔っ払い", "townsfolk"); locations.push({ id: "inn_marta", name: "女将マルタと話す", x: 0, z: -3.4, r: 3, dialogue: "inn_marta" }, { id: "inn_exit", name: "外へ出る", x: 0, z: 6.4, r: 2.4, targetMap: "plaza", spawn: { x: 70, z: 30 } }); }

function cityWall() { for (const [x, z, w, d] of [[0, -675, 1320, 10], [0, 675, 1320, 10], [-675, 0, 10, 1320], [675, 0, 10, 1320]]) box(x, 5, z, w, 10, d, 0x6d6c64, "wall", world, true); for (let i = -620; i <= 620; i += 75) { box(i, 10, -675, 10, 18, 10, 0x74736b, "tower", world, true); box(i, 10, 675, 10, 18, 10, 0x74736b, "tower", world, true); box(-675, 10, i, 10, 18, 10, 0x74736b, "tower", world, true); box(675, 10, i, 10, 18, 10, 0x74736b, "tower", world, true); } }
function addGate(x, z) { box(x, 4, z, 38, 8, 7, 0x6d6c64, "gate", world, true); box(x - 15, 11, z, 7, 18, 10, 0x74736b, "tower", world, true); box(x + 15, 11, z, 7, 18, 10, 0x74736b, "tower", world, true); }
function gateDistrict(x, z) { addGate(x, z + 55); for (let i = -2; i <= 2; i++) addNpc("guard", x + i * 6, z - 8, 0xb77954, "衛兵", "north_gate"); box(x - 22, 2, z - 25, 20, 4, 14, 0x6a5e52, "checkpoint", world, true); box(x + 22, 2, z - 25, 20, 4, 14, 0x6a5e52, "checkpoint", world, true); }
const WALL_P = [0xd8c59f, 0xcbb58b, 0xbfa884, 0xd4c2aa, 0xb69b74, 0xc9b189, 0xa98f6b, 0xd0b79a];
const ROOF_P = [0x8a3f2a, 0x7a3527, 0x6d3d31, 0x4f4654, 0x34506a, 0x5f3d2d, 0x9c5a38];
function nearRoadLine(x, z, m) { for (const r of ROAD_LINES.vertical) if (Math.abs(x - r) < (r === 0 ? 15 : m)) return true; for (const r of ROAD_LINES.horizontal) if (Math.abs(z - r) < (r === 0 ? 15 : m)) return true; return false; }
// 王城を頂く丘陵: 階段状のテラスに住宅が密集し、斜面を上るほど王城へ近づく遠景（-z側、当たり判定は基部の壁のみ）。
function castleHill() { const terraces = 8, dz = 36, dy = 8, baseZ = -356; box(0, 5, baseZ + 2, 680, 10, 5, 0x9a9082, "wall", world, true); for (let k = 1; k <= terraces; k++) { const y = k * dy, zc = baseZ - k * dz, halfW = 330 - k * 30; box(0, y / 2, zc - dz * .5, halfW * 2 + 24, y + 2, dz + 10, 0x9a9082, "", world, false); box(0, y + 1.4, zc + 1.5, halfW * 2 + 24, 2.8, 1.6, 0x837a6b, "", world, false); for (let x = -halfW; x <= halfW; x += 15) { if (Math.abs(x) < 26) continue; if (Math.random() > .92) continue; const w = rand(7, 11), d = rand(7, 10), h = rand(6, 11); plainSpecs.push({ x: x + rand(-2, 2), z: zc - rand(4, dz - 8), y, w, d, h, rh: w * .36, angle: 0, body: pick(WALL_P), roof: pick(ROOF_P) }); } } const steps = Math.floor(terraces * dz / 5); for (let s = 0; s <= steps; s++) box(0, s * 5 * dy / dz, baseZ - s * 5, 22, 1.4, 6, 0xa89c88, "", world, false); castleOnHill(0, baseZ - terraces * dz + 14, terraces * dy); }
function castleOnHill(x, z, y) { box(x, y + 12, z, 80, 24, 46, 0xd8cfbb, "", world, true); box(x, y + 27, z - 12, 44, 26, 26, 0xe0d8c4, "", world, true); for (const [sx, sz] of [[-42, -22], [42, -22], [-42, 22], [42, 22]]) { box(x + sx, y + 20, z + sz, 14, 44, 14, 0xcfc6b2, "", world, true); const r = add(new THREE.ConeGeometry(10, 17, 6), mat(0x3f5d78), world, true); r.position.set(x + sx, y + 50, z + sz); cull(r, x + sx, z + sz, 1500); } box(x, y + 42, z - 12, 16, 32, 16, 0xd8cfbb, "", world, true); const sr = add(new THREE.ConeGeometry(13, 27, 6), mat(0x3f5d78), world, true); sr.position.set(x, y + 70, z - 12); cull(sr, x, z, 1500); for (const sx of [-42, 42]) { const fl = box(x + sx, y + 58, z, .3, 6, .1, 0xb33a44, "", world); fl.scale.z = 30; } }
// 平地の市街を道沿いに連続して埋める（インスタンス化。道路・広場・主要施設は避ける）。
function cityFill() { const anchors = [[0, 0, 58], [135, -70, 30], [-185, -85, 32], [-300, -60, 44], [350, -125, 26], [285, 85, 86], [380, 330, 56], [0, 610, 44], [-250, -350, 50]]; const near = (x, z) => anchors.some((a) => Math.hypot(x - a[0], z - a[1]) < a[2]) || shopAnchors.some((a) => Math.hypot(x - a[0], z - a[1]) < a[2]); const slumRoof = [0x4d3a2a, 0x3b2d20, 0x5a4630, 0x46352a]; const slumWall = [0x8a7a5f, 0x6d5d44, 0x7d6a4e, 0x5d4b39]; const step = 14, prob = Math.min(1, quality.houses * .95); for (let x = -585; x <= 600; x += step) for (let z = -350; z <= 600; z += step) { if (nearRoadLine(x, z, 7)) continue; if (near(x, z)) continue; if (Math.random() > prob) continue; const slum = x < -300 && z > 165; const w = slum ? rand(5, 8) : rand(8, 12.5), d = slum ? rand(5, 8) : rand(8, 11.5), h = slum ? rand(3.5, 6) : rand(6, x > 110 && Math.abs(z) < 130 ? 14 : 11); const ang = roadFacingAngle(x, z) + (slum ? rand(-.22, .22) : rand(-.05, .05)); const jx = rand(-1.6, 1.6), jz = rand(-1.6, 1.6); (slum ? plainSpecs : facadeSpecs).push({ x: x + jx, z: z + jz, w, d, h, rh: w * rand(.3, .42), angle: ang, body: slum ? pick(slumWall) : pick(WALL_P), roof: slum ? pick(slumRoof) : pick(ROOF_P) }); const ab = rotatedAabb(w, d, ang); addCollider(x + jx, z + jz, ab.w * .92, ab.d * .92, "house"); } }
function minorAlleys() {
  for (const [x, z, w, d] of [[78, -42, 76, 4.4], [188, -42, 76, 4.4], [118, -12, 4.4, 62], [285, 35, 148, 4.2], [235, 88, 4.2, 92], [335, 88, 4.2, 92], [-245, -118, 86, 4.2], [-342, 214, 108, 4.2]]) road(x, z, w, d, 0x6b6255, "dirt");
}
function centralPlaza() { road(0, 0, 96, 96, 0x8e8370); fountain(0, 0, 4.2); box(0, 4, -30, 5, 8, 5, 0x9a9384, "statue", world, true); const N = 16, R = 62; for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, px = Math.cos(a) * R, pz = Math.sin(a) * R; if (Math.abs(px) < 16 || Math.abs(pz) < 16) continue; const ang = faceToward(-px, -pz), w = rand(11, 15), d = rand(10, 13), h = rand(11, 17); facadeSpecs.push({ x: px, z: pz, w, d, h, rh: w * .34, angle: ang, body: pick(WALL_P), roof: pick(ROOF_P) }); const ab = rotatedAabb(w, d, ang); addCollider(px, pz, ab.w, ab.d, "house"); } for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) lamp(Math.cos(a) * 43, Math.sin(a) * 43); }
function guildDistrict(x, z) { house(x, z, 36, 24, 15, 0x6a5036, "GUILD", true, faceToward(0, 1)); box(x, 3, z + 13, 9, 6, .7, 0x201610, "guild", world, true); addQuestBoard(x - 22, z + 4); for (let i = 0; i < 8; i++) addNpc("adventurer", x + rand(-28, 28), z + rand(18, 36), pick([0x8c6f4f, 0x58718d, 0x5f7b55]), "冒険者", "generic"); }
function churchDistrict(x, z) { house(x, z, 34, 26, 18, 0x7c7a76, "CHURCH", true, faceToward(0, 1)); const sp = add(new THREE.ConeGeometry(7, 24, 4), mat(0x2f3541), world, true); sp.position.set(x, 32, z); sp.rotation.y = Math.PI / 4; cull(sp, x, z, 900); for (let i = 0; i < 8; i++) addNpc("faithful", x + rand(-35, 35), z + rand(18, 45), 0xc9c4ad, "信徒", "church"); }
function marketDistrict(x, z) { for (let i = 0; i < 60 * quality.props; i++) { const px = x + rand(-82, 82), pz = z + rand(-60, 60); stall(px, pz, pick([0xb43d46, 0x2f6f9f, 0xd8b36b, 0x3f815a, 0xc8763a])); if (i % 4 === 0) addNpc("merchant", px, pz + 4, 0x9a6f54, "商人", "market"); if (i % 6 === 0) crates(px + rand(-3, 3), pz + rand(-3, 3), Math.floor(rand(2, 4))); } }
function craftDistrict(x, z) { house(x, z, 24, 18, 9, 0x9c7a4c, "SMITH", true, faceToward(0, 1)); box(x + 18, 1.1, z + 5, 8, 2.2, 5, 0x3a2a21, "forge", world, true); box(x + 10, .8, z - 5, 4, 1.6, 2.2, 0x3d3d40, "anvil"); addNpc("blacksmith", x + 22, z + 8, 0x6f4b32, "鍛冶職人", "blacksmith"); }
function nobleDistrict(x, z) { for (let i = 0; i < 4; i++) addNpc("guard", x + rand(-45, 45), z + rand(22, 62), 0xb77954, "衛兵", "generic"); }
function slumDistrict(x, z) { for (let i = 0; i < 8; i++) addNpc("slum", x + rand(-95, 95), z + rand(-75, 75), 0x4f4238, "路地の住人", "alley"); alleyDetails(x + 20, z - 10); }
function trainingDistrict(x, z) { box(x, .06, z, 90, .12, 55, 0x746b56, "yard", world, true); for (let i = 0; i < 18; i++) cyl(x + rand(-38, 38), 1, z + rand(-22, 22), .28, 2, 0x8a5d38, "target"); addNpc("guard", x - 36, z + 20, 0xb77954, "訓練教官", "training_gate"); }
function streetFronts() { for (const z of [-430, -330, -130, 130, 330, 430]) for (let x = -560; x <= 560; x += 30) { if (Math.abs(x) < 60 && Math.abs(z) < 60) continue; const side = Math.random() < .5 ? -1 : 1; placeStreetHouse(x + rand(-3, 3), z + side * rand(22, 31), Math.random() < .18 ? pick(["INN", "HERB", "FOOD", "TOOLS", null]) : null); } for (const x of [-430, -330, -130, 130, 330, 430]) for (let z = -560; z <= 560; z += 30) { if (Math.abs(x) < 60 && Math.abs(z) < 60) continue; const side = Math.random() < .5 ? -1 : 1; placeStreetHouse(x + side * rand(22, 31), z + rand(-3, 3), Math.random() < .18 ? pick(["BAKER", "INN", "HERB", null]) : null); } }
function denseBlocks() { const zones = [[-360, 80, -80, 570, "slum"], [-520, -120, -520, -150, "noble"], [-60, 520, -500, -180, "res"], [-560, 560, 150, 560, "res"], [-560, -260, -120, 120, "res"], [160, 560, -60, 280, "market"], [160, 560, -300, -130, "craft"]]; for (const [x1, x2, z1, z2, type] of zones) for (let x = x1; x <= x2; x += 42) for (let z = z1; z <= z2; z += 38) { if (Math.abs(x) < 55 && Math.abs(z) < 55) continue; if (Math.random() > quality.houses * .58) continue; type === "slum" ? slumHouse(x + rand(-5, 5), z + rand(-4, 4), roadFacingAngle(x, z)) : placeStreetHouse(x + rand(-4, 4), z + rand(-4, 4), Math.random() < .12 ? pick(["INN", "FOOD", "HERB", "BAKER", null]) : null); } }
function placeStreetHouse(x, z, sign = null, important = false) { house(x, z, rand(8, 15), rand(8, 13), rand(5, 10), pick([0x7b5a3d, 0x83684d, 0x6d5d4a, 0x8d6542]), sign, important, roadFacingAngle(x, z)); }
function props() { for (let i = 0; i < 110 * quality.props; i++) Math.random() < .6 ? crates(rand(-590, 590), rand(-590, 590), Math.floor(rand(2, 5))) : addRock(rand(-590, 590), rand(-590, 590), rand(.25, .6)); }
function traffic() { const routes = [[[-610, 15], [-220, 15], [80, 15], [610, 15]], [[15, 620], [15, 260], [15, -40], [15, -610]], [[-15, -610], [-15, -300], [-15, 40], [-15, 620]], [[240, 260], [350, 90], [420, -120], [260, -260]]]; for (let i = 0; i < quality.carts; i++) { const obj = cart(); const path = routes[i % routes.length]; obj.position.set(path[0][0], 0, path[0][1] + i * 4); world.add(obj); movers.push({ type: "cart", obj, path, index: 1, speed: rand(2.4, 4.2), wait: 0, r: 2.4 }); } }
function pedestrians() {
  const routes = [[[-580, 8], [-280, 8], [0, 8], [280, 8], [580, 8]], [[8, 600], [8, 260], [8, -80], [8, -580]], [[-390, 260], [-420, 230], [-360, 180], [-300, 210]], [[230, 100], [300, 110], [350, 80], [280, 40]], [[130, -55], [0, 0], [-185, -75]]];
  for (let i = 0; i < 45 * quality.npcs; i++) {
    const path = JSON.parse(JSON.stringify(pick(routes)));
    const variant = pick(["traveler", "merchant", "adventurer", "faithful", "slum"]);
    const obj = addNpc(variant, path[0][0] + rand(-4, 4), path[0][1] + rand(-4, 4), pick([0x7f9fbd, 0x8c6f4f, 0x6f8aa6, 0x8c7b5b, 0x9a6f54]), "通行人", "townsfolk", { label: false });
    movers.push({ type: "ped", obj, path, index: 1, speed: rand(1.1, 2.2), wait: rand(0, 1), r: .7 });
  }
}

function house(x, z, w, d, h, color, sign = null, important = false, angle = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = angle; world.add(g); const sH = Math.min(1.1, h * .3), fz = d * .48; box(0, sH / 2, 0, w, sH, d, 0x6f6253, "", g); box(0, sH + (h - sH) / 2, 0, w * .96, h - sH, d * .96, color, "", g); box(0, sH + .95, fz + .07, 1.3, Math.min(1.9, h - sH - .3), .14, 0x2a1c12, "", g); for (const wx of [-w * .29, w * .29]) { box(wx, h - .78, fz + .02, .76, .78, .05, 0x2a1c12, "", g); const gl = add(boxGeo(.58, .6, .05), mat(0xffd486, .4, 0xffb74d, .82), g); gl.position.set(wx, h - .78, fz + .05); } const rh = Math.max(1.3, w * .36), a = Math.atan2(rh, w / 2), L = Math.hypot(w / 2, rh) * 1.05, rc = pick([0x6e2f28, 0x46342a, 0x32506c, 0x2e463a]); for (const s of [-1, 1]) { const pl = add(boxGeo(L, .22, d * 1.12), mat(rc), g, important); pl.position.set(s * w / 4, h + rh / 2, 0); pl.rotation.z = -s * a; } box(0, h + rh, 0, .2, .2, d * 1.14, 0x241a12, "", g); for (const s of [-1, 1]) { const gb = add(unitGable(), mat(color), g); gb.scale.set(w / 2, rh, 1); gb.position.set(0, h, s * fz); if (s < 0) gb.rotation.y = Math.PI; } if (important) { box(w * .32, h + rh * .55, -d * .22, .5, rh * 1.2, .5, 0x4a3a2c, "", g); for (const bx of [-w * .42, 0, w * .42]) box(bx, sH + (h - sH) / 2, fz + .02, .1, h - sH, .05, 0x3b2a1d, "", g); box(0, h - .12, fz + .02, w * .92, .14, .06, 0x3b2a1d, "", g); } if (sign) { box(0, h - .25, fz + .5, .5, .08, .5, 0x241a12, "", g); const lab = label(sign); lab.position.set(0, h - .8, fz + .6); lab.scale.set(1.7, .42, 1); g.add(lab); } const aabb = rotatedAabb(w, d, angle); addCollider(x, z, aabb.w, aabb.d, important ? "major" : "house"); cull(g, x, z, important ? 900 : 360); }
function slumHouse(x, z, angle = 0) { const w = rand(5, 10), d = rand(5, 9), h = rand(3, 6); const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = angle + rand(-.08, .08); world.add(g); box(0, h / 2, 0, w, h, d, pick([0x4f4238, 0x5d4b39, 0x6d5237]), "", g); const roof = box(0, h + .45, 0, w * 1.1, .8, d * 1.05, pick([0x2d2520, 0x3b2a1e, 0x4d2f28]), "", g); roof.rotation.z = rand(-.08, .08); const aabb = rotatedAabb(w, d, angle); addCollider(x, z, aabb.w, aabb.d, "slumHouse"); cull(g, x, z, 340); }
function stall(x, z, color) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = roadFacingAngle(x, z); world.add(g); box(0, .35, 0, 3, .7, 1.7, 0x6a4d35, "", g); box(0, 1.35, 0, 3.5, .14, 2.3, color, "", g); for (let i = 0; i < 4; i++) { const item = add(new THREE.DodecahedronGeometry(.16, 0), mat(pick([0xbf5545, 0xd8b36b, 0x5f9056, 0x8f6b3f])), g); item.position.set(rand(-1.1, 1.1), .85, rand(-.5, .5)); } const aabb = rotatedAabb(3.5, 2.3, g.rotation.y); addCollider(x, z, aabb.w, aabb.d, "stall"); cull(g, x, z, 340); }
function addCaravan(x, z) { const g = cart(); g.position.set(x, 0, z); g.rotation.y = -.22; world.add(g); addNpc("merchant", x + .8, z + 1.4, 0x6f8aa6, "商人", done("merchant") ? "caravan_after" : "caravan_attack"); if (!done("merchant")) { const beast = createBeast(); const bx = x + 4.35, bz = z - .9; beast.position.set(bx, 0, bz); beast.rotation.y = -Math.PI / 2; world.add(beast); const marker = makeThreatMarker(); marker.position.set(bx, 0, bz); world.add(marker); caravanThreat = { obj: beast, marker, x: bx, z: bz, r: 1.4, active: true }; cull(beast, bx, bz, 420); cull(marker, bx, bz, 620); } addCollider(x, z, 4.2, 3.4, "caravan"); cull(g, x, z, 500); }
function makeThreatMarker() { const g = new THREE.Group(); const ring = add(new THREE.TorusGeometry(1.35, .085, 8, 28), mat(0xff5a3a, .4, 0xff4a28, 1.5), g); ring.rotation.x = Math.PI / 2; ring.position.y = .12; g.userData.ring = ring; const beam = add(coneGeo(.46, 1, 5), mat(0xff7a4a, .35, 0xff5a2a, 1.8), g); beam.position.y = 2.05; beam.rotation.x = Math.PI; g.userData.beam = beam; const lab = label("⚠ TARGET"); lab.position.set(0, 2.95, 0); lab.scale.set(1.8, .48, 1); g.add(lab); return g; }
function cart() { const g = new THREE.Group(); box(0, .55, 0, 2.8, .8, 1.6, 0x70482c, "", g); const h = createHorse(); h.position.set(0, 0, -1.55); g.add(h); for (const sx of [-1.3, 1.3]) for (const sz of [-.7, .7]) { const w = add(new THREE.TorusGeometry(.36, .07, 8, 18), mat(0x2c2018), g); w.position.set(sx, .35, sz); w.rotation.y = Math.PI / 2; } return g; }
function createHorse() { const g = new THREE.Group(); box(0, .78, 0, 1.15, .55, .38, 0x5b3a28, "", g); const neck = box(.5, 1.05, 0, .25, .55, .22, 0x5b3a28, "", g); neck.rotation.z = -.35; box(.75, 1.25, 0, .35, .25, .25, 0x5b3a28, "", g); for (const x of [-.38, .38]) for (const z of [-.14, .14]) box(x, .34, z, .12, .65, .12, 0x3b281d, "", g); return g; }
function createBeast() { const g = new THREE.Group(); box(0, .62, 0, .95, .42, .36, 0x111015, "", g); box(-.58, .72, 0, .36, .28, .32, 0x09090d, "", g); box(-.76, .61, 0, .22, .1, .28, 0x3a0c0c, "", g); return g; }
function addNpc(variant, x, z, color, name, dialogue, options = {}) { return addHumanNpc(variant, x, z, color, name, dialogue, options); }
function pCfg(v) { const C = {
  player: { legs: 0x2c3550, boot: 0x39281c, hairStyle: "short", hair: 0x2b2118, eye: 0x3a5a8c, scale: 1, collar: 0x394a63 },
  receptionist: { legs: 0x3a3f4a, boot: 0x2a2a2e, hairStyle: "bun", over: "vest", overCol: 0x4a5260, collar: 0xeae2d2, eye: 0x5a6b3e },
  adventurer: { legs: 0x4a3526, boot: 0x2c1d12, sleeve: 0x5a4632, hairStyle: "short", over: "cloak", overCol: 0x6a3a2a, hold: "sword", eye: 0x7a4a2a },
  guard: { legs: 0x4a4e57, boot: 0x2a2c30, sleeve: 0x9aa0aa, hairStyle: "short", over: "breastplate", overCol: 0xb6bcc6, hold: "spear", helmet: 1, eye: 0x4a4f57 },
  merchant: { legs: 0x4a3a2a, boot: 0x33271a, hairStyle: "short", over: "apron", overCol: 0x8a6a44, hold: "pack", hat: 1, eye: 0x4a3a2a },
  faithful: { legs: 0x6a6458, boot: 0x4a463c, hairStyle: "hood", over: "robe", overCol: 0xe6e0d0, eye: 0x6a6b5a },
  priest: { legs: 0x6a6458, boot: 0x4a463c, hairStyle: "hood", over: "robe", overCol: 0xe2dcc8, eye: 0x6a6b5a },
  slum: { legs: 0x4a4038, boot: 0x2c2620, hairStyle: "messy", scale: .93, eye: 0x5a4a3a },
  noble: { legs: 0x2a2e3a, boot: 0x1f2128, hairStyle: "neat", over: "vest", overCol: 0x3a3050, collar: 0xd8c89a, eye: 0x4a5a6a },
  blacksmith: { legs: 0x3a2e22, boot: 0x281e14, sleeve: 0x7a5a3a, hairStyle: "short", over: "apron", overCol: 0x5a4632, hold: "hammer", scale: 1.05, eye: 0x5a3a2a },
  student: { legs: 0x2a2e44, boot: 0x23252e, hairStyle: "long", over: "robe", overCol: 0x2e3a5c, hold: "staff", crest: 1, eye: 0x4a6a8c },
  teacher: { legs: 0x2a2640, boot: 0x201e2a, hairStyle: "neat", over: "robe", overCol: 0x3a2e5a, hold: "staff", eye: 0x5a4a7a },
  traveler: { legs: 0x4a4236, boot: 0x2e261c, hairStyle: "short", eye: 0x4a5a6a } }; return C[v] || C.traveler; }
function createPerson(variant = "traveler", color = 0x6f8aa6) { const g = new THREE.Group(); const cfg = pCfg(variant); const SK = [0xf4d2ab, 0xeec299, 0xddae80, 0xc9976b], HR = [0x2b2118, 0x4a2f1c, 0x6e4a2a, 0x18181f, 0x8a5a32, 0x35304a, 0xb9892f, 0x6a6f7a]; const skin = SK[(Math.random() * SK.length) | 0]; const hcol = cfg.hair !== undefined ? cfg.hair : HR[(Math.random() * HR.length) | 0]; pLegs(g, cfg); pTorso(g, color, cfg); pArms(g, cfg.sleeve !== undefined ? cfg.sleeve : color, skin, cfg); pHead(g, skin, hcol, cfg.hairStyle, cfg.eye || 0x3a5a7a); if (cfg.helmet) { const h = part(sphGeo(.36, 12, 9), cfg.overCol || 0xb6bcc6, g, 0, 1.88, -.01); h.scale.set(1.05, .72, 1.08); box(0, 1.72, .29, .12, .34, .06, cfg.overCol || 0xb6bcc6, "", g); } if (cfg.hat) { part(cylGeo(.34, .06), 0x4a3320, g, 0, 2.06, 0); box(0, 2.14, 0, .36, .16, .36, 0x4a3320, "", g); } const s = cfg.scale || (variant === "player" ? 1 : rand(.93, 1.07)); if (s !== 1) g.scale.setScalar(s); return g; }
function pLegs(g, cfg) { for (const s of [-1, 1]) { box(s * .15, .38, 0, .2, .64, .2, cfg.legs, "", g); box(s * .15, .07, .07, .23, .16, .36, cfg.boot, "", g); } }
function pTorso(g, color, cfg) { box(0, 1.04, 0, .72, .92, .36, color, "", g); box(0, .74, 0, .8, .12, .42, 0x4a3320, "", g); if (cfg.collar) box(0, 1.44, .05, .5, .14, .3, cfg.collar, "", g); const oc = cfg.overCol || color; if (cfg.over === "apron") box(0, .96, .2, .5, .92, .06, oc, "", g); else if (cfg.over === "vest") box(0, 1.1, .18, .56, .74, .06, oc, "", g); else if (cfg.over === "breastplate") { box(0, 1.14, .03, .78, .72, .42, oc, "", g); for (const s of [-1, 1]) box(s * .36, 1.46, 0, .26, .14, .3, oc, "", g); } else if (cfg.over === "cloak") { const c = box(0, 1.06, -.23, .82, 1.06, .08, oc, "", g); c.rotation.x = -.05; } else if (cfg.over === "robe") part(coneGeo(.56, 1.5, 8), oc, g, 0, .76, 0); if (cfg.crest) box(.2, 1.22, .2, .14, .16, .05, 0xc9a24b, "", g); }
function pArms(g, sleeve, skin, cfg) { for (const s of [-1, 1]) { const a = box(s * .46, 1.06, 0, .18, .54, .18, sleeve, "", g); a.rotation.z = s * .14; part(sphGeo(.09, 8, 6), skin, g, s * .53, .74, .03); } if (cfg.hold) pHold(g, cfg.hold); }
function pHold(g, hold) { if (hold === "spear") { const sp = cyl(-.52, 1.1, .05, .035, 2.3, 0x6e5134, "", g); sp.rotation.z = .08; part(coneGeo(.07, .26, 6), 0xbfc4cc, g, -.55, 2.32, .05); } else if (hold === "sword") { const bl = box(.5, .95, -.26, .09, .9, .09, 0xc8cbd0, "", g); bl.rotation.z = .35; box(.46, .5, -.2, .22, .1, .1, 0x4a3320, "", g); } else if (hold === "staff") { cyl(.5, 1.15, .08, .035, 2.2, 0x6a4a2c, "", g); part(sphGeo(.1, 8, 6), 0x8fd2e0, g, .5, 2.28, .08); } else if (hold === "pack") box(0, 1.16, -.3, .5, .56, .26, 0x6a4a2c, "", g); else if (hold === "hammer") { cyl(.52, .9, -.05, .04, .9, 0x4a3320, "", g); box(.52, 1.36, -.05, .2, .22, .26, 0x55585e, "", g); } }
function pHead(g, skin, hcol, style, eye) { cyl(0, 1.46, 0, .075, .17, skin, "", g); const head = part(sphGeo(.32, 14, 11), skin, g, 0, 1.82, 0); head.scale.set(1, 1.08, .95); const chin = part(coneGeo(.1, .16, 7), skin, g, 0, 1.62, .04); chin.rotation.x = Math.PI; chin.scale.set(1, 1, .7); for (const s of [-1, 1]) { box(s * .12, 1.84, .28, .17, .2, .05, 0xf7f3ea, "", g); part(boxGeo(.11, .15, .05), eye, g, s * .125, 1.83, .3); part(boxGeo(.05, .06, .02), 0xffffff, g, s * .15, 1.88, .32); const br = box(s * .12, 1.96, .28, .16, .03, .05, 0x2c2018, "", g); br.rotation.z = -s * .14; } box(0, 1.71, .3, .1, .03, .03, 0x9a5a4a, "", g); pHair(g, hcol, style); }
function pHair(g, c, style) { if (style === "hood") { part(coneGeo(.44, .66, 8), 0xd8d0bc, g, 0, 1.98, -.03); return; } const crown = part(sphGeo(.35, 12, 9), c, g, 0, 1.9, -.02); crown.scale.set(1.04, .92, 1.06); for (const x of [-.23, -.08, .08, .23]) { const b = box(x, 2.02, .25, .13, .24, .12, c, "", g); b.rotation.z = x * .5; } if (style === "long" || style === "bun" || style === "neat") for (const s of [-1, 1]) box(s * .31, 1.74, .05, .12, .48, .17, c, "", g); if (style === "long") box(0, 1.56, -.17, .38, .56, .17, c, "", g); if (style === "bun") part(sphGeo(.16, 10, 8), c, g, 0, 2.2, -.05); if (style === "messy") for (const x of [-.18, .1, .26]) { const t = box(x, 2.14, -.02, .09, .18, .09, c, "", g); t.rotation.z = x * 1.6; } }
function room(w, d, h, color) { for (const [x, z, ww, dd] of [[0, -d / 2, w, .35], [-w / 2, 0, .35, d], [w / 2, 0, .35, d], [-w * .3, d / 2, w * .4, .35], [w * .3, d / 2, w * .4, .35]]) box(x, h / 2, z, ww, h, dd, color, "wall"); }
function addQuestBoard(x, z) { box(x, 1.25, z, .18, 2.2, 2.2, 0x4a301c, "questBoard", world, true); }
function crates(x, z, n) { for (let i = 0; i < n; i++) box(x + (i % 2) * .75, .35 + Math.floor(i / 2) * .38, z + Math.floor(i / 2) * .75, .7, .7, .7, 0x735334, "crate"); }
function addRock(x, z, s) { const r = add(new THREE.DodecahedronGeometry(s, 0), mat(0x6b6b62), world); r.position.set(x, .2, z); r.scale.y = .55; addCollider(x, z, s * 1.2, s * 1.2, "rock"); cull(r, x, z, 300); }
function addTree(x, z, s, solid) { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); cyl(0, .75 * s, 0, .18 * s, 1.5 * s, 0x5b3a24, "", g); const l1 = add(new THREE.DodecahedronGeometry(s, 0), mat(0x2f6f45), g); l1.position.y = 1.8 * s; const l2 = add(new THREE.DodecahedronGeometry(.65 * s, 0), mat(0x3d8a59), g); l2.position.set(.35 * s, 2.35 * s, -.12 * s); if (solid) addCollider(x, z, .9 * s, .9 * s, "tree"); cull(g, x, z, 360); }
function lamp(x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); cyl(0, 1.5, 0, .09, 3, 0x2f2a25, "", g); box(0, 3.06, 0, .34, .44, .34, 0x35302a, "", g); const fl = add(boxGeo(.2, .3, .2), mat(0xffd27a, .35, 0xffb637, 1.3), g); fl.position.set(0, 3.04, 0); cull(g, x, z, 330); }
function barrel(x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); cyl(0, .46, 0, .34, .92, 0x6e4c2d, "", g); for (const yy of [.18, .74]) { const r = add(new THREE.TorusGeometry(.35, .035, 6, 14), mat(0x32261a), g); r.position.y = yy; r.rotation.x = Math.PI / 2; } addCollider(x, z, .76, .76, "barrel"); cull(g, x, z, 300); }
function well(x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); cyl(0, .55, 0, 1.2, 1.1, 0x7b756a, "", g); cyl(0, 1, 0, 1, .12, 0x3c4750, "", g); for (const s of [-1, 1]) box(s * 1.05, 1.7, 0, .18, 2.3, .18, 0x4a3320, "", g); box(0, 2.9, 0, 2.7, .22, 1.8, 0x4d2f28, "", g); cyl(0, 2.1, 0, .07, .8, 0x2a2018, "", g); addCollider(x, z, 2.5, 2.5, "well"); cull(g, x, z, 520); }
function bench(x, z, angle = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = angle; world.add(g); box(0, .45, 0, 1.9, .12, .52, 0x6a4a30, "", g); box(0, .76, -.22, 1.9, .5, .1, 0x5d4029, "", g); for (const sx of [-.78, .78]) box(sx, .22, 0, .12, .44, .46, 0x4a3320, "", g); addCollider(x, z, 1.9, .6, "bench"); cull(g, x, z, 260); }
function flowerBox(x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); box(0, .3, 0, 1.4, .5, .52, 0x6e4a2c, "", g); for (let i = 0; i < 5; i++) { const f = add(new THREE.SphereGeometry(.13, 6, 5), mat(pick([0xd44a5a, 0xe3b34a, 0xc56fce, 0xe8e0c8])), g); f.position.set(rand(-.55, .55), .68, rand(-.14, .14)); } cull(g, x, z, 220); }
function brazier(x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); cyl(0, .5, 0, .18, 1, 0x2a2620, "", g); cyl(0, 1.05, 0, .42, .35, 0x3a342c, "", g); const fire = add(new THREE.ConeGeometry(.32, .72, 7), mat(0xff8a2a, .3, 0xff6a12, 2.4), g); fire.position.y = 1.45; addCollider(x, z, .9, .9, "brazier"); cull(g, x, z, 380); }
function streetDressing() { for (let t = -620; t <= 620; t += 38) { for (const s of [-1, 1]) { lamp(s * 14, t); lamp(t, s * 14); if (Math.abs(t) > 72) { const r = Math.random(); if (r < .34) crates(s * 17, t + 3, Math.floor(rand(2, 5))); else if (r < .56) barrel(s * 17, t - 2); else if (r < .68) bench(s * 17, t, Math.PI / 2); const r2 = Math.random(); if (r2 < .32) crates(t + 3, s * 17, Math.floor(rand(2, 5))); else if (r2 < .54) barrel(t - 2, s * 17); } } } for (const [wx, wz] of [[150, -40], [110, 44], [-150, -40], [255, 44], [-360, 205]]) well(wx, wz); for (const [bx, bz] of [[18, 575], [-18, 575], [44, 34], [-44, 34], [34, -120], [-34, -120]]) brazier(bx, bz); for (let a = 0; a < Math.PI * 2; a += Math.PI / 7) flowerBox(Math.cos(a) * 30, Math.sin(a) * 30); for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) bench(Math.cos(a) * 35, Math.sin(a) * 35, a + Math.PI / 2); for (let i = 0; i < 12 * quality.props; i++) addTree(-250 + rand(-95, 95), -350 + rand(-70, 70), rand(1, 1.7), true); }
function fountain(x, z, s) { cyl(x, .4 * s, z, 1.8 * s, .8 * s, 0x6f7a80, "fountain", world, true); const w = add(new THREE.CylinderGeometry(1.35 * s, 1.35 * s, .08, 24), mat(0x69a7d2, .25, 0x69a7d2, .12), world); w.position.set(x, .85 * s, z); cull(w, x, z, 700); }
function addSign(x, z, text) { cyl(x, .75, z, .08, 1.5, 0x332315); const s = label(text); s.scale.set(1.55, .42, 1); s.position.set(x, 1.75, z); world.add(s); cull(s, x, z, 700); }
function alleyDetails(x, z) { for (let i = 0; i < 12; i++) { crates(x + rand(-25, 25), z + rand(-20, 20), 2); lamp(x + rand(-35, 35), z + rand(-35, 35)); } const circle = add(new THREE.TorusGeometry(3, .08, 8, 30), mat(0x7446aa, .45, 0x5c28ff, .6), world); circle.position.set(x, .08, z); circle.rotation.x = Math.PI / 2; cull(circle, x, z, 700); }
function addMarker(l) { const ring = add(new THREE.TorusGeometry(.9, .035, 8, 32), mat(l.targetMap ? 0xd8b36b : 0x87c7ff, .42, l.targetMap ? 0xd8b36b : 0x87c7ff, .7), world); ring.position.set(l.x, .08, l.z); ring.rotation.x = Math.PI / 2; cull(ring, l.x, l.z, 800); }
function label(text) { const c = document.createElement("canvas"), x = c.getContext("2d"); c.width = 512; c.height = 128; x.fillStyle = "rgba(10,12,18,.72)"; round(x, 12, 20, 488, 88, 18); x.fill(); x.strokeStyle = "rgba(216,179,107,.75)"; x.lineWidth = 4; round(x, 12, 20, 488, 88, 18); x.stroke(); x.fillStyle = "#f6efe1"; x.font = "bold 38px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 256, 64); return new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true })); }
function round(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function updateMovers(dt) {
  const px = player.position.x, pz = player.position.z;
  for (const m of movers) {
    const updateRange = m.type === "cart" ? quality.cull * 1.25 : quality.cull;
    if (!state.debug && Math.hypot(px - m.obj.position.x, pz - m.obj.position.z) > updateRange) continue;
    if (m.obj.visible === false) continue;
    if (m.wait > 0) { m.wait -= dt; continue; }
    const t = m.path[m.index], dx = t[0] - m.obj.position.x, dz = t[1] - m.obj.position.z, dist = Math.hypot(dx, dz);
    if (dist < 1.5) { m.index = (m.index + 1) % m.path.length; if (m.type === "ped") m.wait = rand(.2, 1.3); continue; }
    const vx = dx / dist, vz = dz / dist, step = m.speed * dt, r = (m.r || .7) * .74;
    const nx = m.obj.position.x + vx * step, nz = m.obj.position.z + vz * step;
    if (!state.debug && blockedStatic(nx, nz, r)) {
      m.stuck = (m.stuck || 0) + 1;
      const side = m.avoidTurn || (Math.random() < .5 ? -1 : 1);
      m.avoidTurn = side;
      const sx = -vz * side, sz = vx * side, ax = m.obj.position.x + sx * step * .65, az = m.obj.position.z + sz * step * .65;
      // 横回避が通れば滑らせる。ただし長く詰まり続けたら(grind防止)経路を進めて再ルート。
      if (m.stuck < 14 && !blockedStatic(ax, az, r)) {
        m.obj.position.x = ax;
        m.obj.position.z = az;
        m.obj.rotation.y = Math.atan2(sx, sz);
      } else {
        m.index = (m.index + 1) % m.path.length;
        m.wait = m.type === "cart" ? rand(.35, .9) : rand(.2, .8);
        m.avoidTurn = 0;
        m.stuck = 0;
      }
      continue;
    }
    m.avoidTurn = 0;
    m.stuck = 0;
    m.obj.position.x = nx;
    m.obj.position.z = nz;
    m.obj.rotation.y = Math.atan2(vx, vz);
    if (m.type === "ped") m.obj.position.y = Math.abs(Math.sin(clock.elapsedTime * 5)) * .025;
  }
}
function updateCulling() { const px = player.position.x, pz = player.position.z; for (const c of cullables) c.obj.visible = state.debug || Math.hypot(px - c.x, pz - c.z) < c.range; for (const n of npcs) n.visible = state.debug || Math.hypot(px - n.position.x, pz - n.position.z) < quality.cull; }
function castFireball(mode = "fire", free = false) { if (!state.started || !state.loaded) return; const burst = mode === "burst"; if (!free && (burst ? state.burstCooldown : state.fireCooldown) > 0) return; const cost = burst ? 8 : 3; if (!free && state.player.mp < cost) return; if (!free) { state.player.mp -= cost; burst ? state.burstCooldown = .95 : state.fireCooldown = .32; } audio.play("fireball_cast"); const dir = new THREE.Vector3(); camera.getWorldDirection(dir); const start = new THREE.Vector3(); if (state.cameraMode === "first") { camera.getWorldPosition(start); const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize(); start.addScaledVector(dir, 1.05).addScaledVector(right, .26).add(new THREE.Vector3(0, -.2, 0)); } else { start.copy(player.position).add(new THREE.Vector3(0, 1.35, 0)).addScaledVector(dir, 1.0); } const ball = add(new THREE.SphereGeometry(burst ? .34 : .22, 16, 10), mat(0xff7a1c, .2, 0xff5a00, 2.4), world); ball.position.copy(start); const light = new THREE.PointLight(0xff7a2a, burst ? 6 : 3.6, burst ? 16 : 11, 2); ball.add(light); burstAt(start.clone(), burst ? 0xffd27a : 0xffa64a); state.shake = Math.max(state.shake, .12); projectiles.push({ ball, dir, life: 1.0, speed: burst ? 42 : 32, burst }); updateHud(); }
function crystalEffect() { audio.play("crystal_crack"); const pos = player.position.clone().add(new THREE.Vector3(0, 1.4, -1)); burstAt(pos, 0x80d8ff); state.shake = .25; }
function showSystemToast(title, message) {
  let box = document.getElementById("aurelia-system-toast");
  if (!box) {
    box = document.createElement("div");
    box.id = "aurelia-system-toast";
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.style.cssText = "position:fixed;right:18px;bottom:92px;z-index:80;max-width:320px;padding:12px 14px;border:1px solid rgba(216,179,107,.55);border-radius:8px;background:rgba(19,14,10,.9);color:#f6efe1;box-shadow:0 12px 32px rgba(0,0,0,.38);font:13px/1.45 system-ui,sans-serif;opacity:0;transform:translateY(8px);transition:opacity .18s ease,transform .18s ease;pointer-events:none";
    box.innerHTML = "<strong style=\"display:block;margin-bottom:3px;color:#d8b36b\"></strong><span></span>";
    document.body.appendChild(box);
  }
  box.querySelector("strong").textContent = title;
  box.querySelector("span").textContent = message;
  box.style.opacity = "1";
  box.style.transform = "translateY(0)";
  clearTimeout(systemToastTimer);
  systemToastTimer = setTimeout(() => { box.style.opacity = "0"; box.style.transform = "translateY(8px)"; }, 3000);
}
function hitCaravanThreat(pos, radius = .35) { return !!(caravanThreat?.active && pos.y < 2.8 && Math.hypot(pos.x - caravanThreat.x, pos.z - caravanThreat.z) <= caravanThreat.r + radius); }
function resolveCaravanRescue() {
  if (done("merchant")) return;
  markDone(["caravan", "merchant"]);
  setDeep("player.contract", "商会の紹介状");
  addTrust({ Merchant: 5 });
  data.objective = "商人エドリックの紹介状を持って北門へ向かう";
  if (caravanThreat?.obj) {
    caravanThreat.obj.visible = false;
    world.remove(caravanThreat.obj);
  }
  if (caravanThreat?.marker) {
    caravanThreat.marker.visible = false;
    world.remove(caravanThreat.marker);
  }
  caravanThreat = null;
  const spot = locations.find((l) => l.id === "caravan");
  if (spot) spot.name = "救助済みの荷車を見る";
  showSystemToast("RESCUE COMPLETE", "商人を救助し、商会の紹介状を受け取った。北門へ向かおう。");
  updateHud();
}
function updateEffects(dt) {
  state.fireCooldown = Math.max(0, state.fireCooldown - dt);
  state.burstCooldown = Math.max(0, state.burstCooldown - dt);
  state.shake = Math.max(0, state.shake - dt * 3);
  if (caravanThreat?.active && caravanThreat.marker) { const t = clock.elapsedTime, pulse = 1 + Math.sin(t * 4.2) * .15; const mk = caravanThreat.marker; if (mk.userData.ring) mk.userData.ring.scale.set(pulse, pulse, 1); if (mk.userData.beam) mk.userData.beam.position.y = 2.05 + Math.sin(t * 3) * .14; }
  if (ui.cooldowns.fire) ui.cooldowns.fire.value = state.fireCooldown ? 1 - state.fireCooldown / .32 : 1;
  if (ui.cooldowns.burst) ui.cooldowns.burst.value = state.burstCooldown ? 1 - state.burstCooldown / .95 : 1;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.life -= dt;
    p.ball.position.addScaledVector(p.dir, p.speed * dt);
    const hitThreat = !state.debug && p.life < .95 && hitCaravanThreat(p.ball.position, p.burst ? 1.1 : .65);
    const hit = hitThreat || (!state.debug && p.life < .95 && (p.ball.position.y <= .18 || blocked(p.ball.position.x, p.ball.position.z, .25)));
    if (p.life <= 0 || hit) {
      audio.play("fireball_hit");
      burstAt(p.ball.position, p.burst ? 0xffd27a : 0xff7a1c);
      if (hitThreat) resolveCaravanRescue();
      state.hitStop = Math.max(state.hitStop, .06);
      world.remove(p.ball);
      projectiles.splice(i, 1);
    }
  }
  for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.life -= dt; b.g.scale.setScalar(1 + (1 - b.life / b.max) * 2); if (b.life <= 0) { world.remove(b.g); bursts.splice(i, 1); } }
  for (const mx of mixers) mx.update(dt);
}
function burstAt(pos, color = 0xff7a1c) { const g = new THREE.Group(); g.position.copy(pos); world.add(g); for (let i = 0; i < 12; i++) add(new THREE.SphereGeometry(.07, 8, 6), mat(color, .32, color, 1.4), g); bursts.push({ g, life: .45, max: .45 }); state.shake = .18; }
function loop() { let dt = Math.min(clock.getDelta(), .05); if (state.hitStop > 0) { state.hitStop -= dt; dt *= .2; } if (state.started && state.loaded) { if (!params.has("time")) { state.dayClock += dt; if (state.dayClock >= 180) { state.dayClock = 0; setTimeOfDay(PHASE_ORDER[(PHASE_ORDER.indexOf(state.timeOfDay) + 1) % 4]); } } controls(dt); recoverMagic(dt); updateMovers(dt); updateEffects(dt); updateTimeTransition(dt); detect(); updateCulling(); cameraUpdate(); } renderer.render(scene, camera); requestAnimationFrame(loop); }
function controls(dt) { if (state.menuOpen) return; handlePad(); if (state.inDialogue) return; let x = (state.keys.has("KeyD") ? 1 : 0) - (state.keys.has("KeyA") ? 1 : 0); let y = (state.keys.has("KeyW") ? 1 : 0) - (state.keys.has("KeyS") ? 1 : 0); const p = gamepad(); if (p) { x += dead(p.axes[0] || 0); y += -dead(p.axes[1] || 0); state.yaw -= dead(p.axes[2] || 0) * 2.8 * dt; state.pitch = THREE.MathUtils.clamp(state.pitch - dead(p.axes[3] || 0) * 1.8 * dt, -.55, .75); } state.yaw += ((state.keys.has("ArrowLeft") ? 1 : 0) - (state.keys.has("ArrowRight") ? 1 : 0)) * 2.25 * dt; state.pitch = THREE.MathUtils.clamp(state.pitch + ((state.keys.has("ArrowUp") ? 1 : 0) - (state.keys.has("ArrowDown") ? 1 : 0)) * 1.35 * dt, -.55, .75); if (state.keys.has("KeyJ")) { castFireball("fire"); state.keys.delete("KeyJ"); } if (state.keys.has("KeyL")) { castFireball("burst"); state.keys.delete("KeyL"); } if (state.keys.has("KeyK")) { dodge(); state.keys.delete("KeyK"); } const up = (state.debug && state.keys.has("Space") ? 1 : 0) - (state.debug && (state.keys.has("ControlLeft") || state.keys.has("ControlRight")) ? 1 : 0); const len = Math.hypot(x, y, up); if (len < .01) { regen(dt, 22); return; } x /= Math.max(1, len); y /= Math.max(1, len); const dash = state.keys.has("ShiftLeft") || state.keys.has("ShiftRight") || (p && (p.buttons[7]?.value || 0) > .25); state.isDashing = dash && state.player.stamina > 2; const speed = state.debug ? (state.isDashing ? 120 : 55) : (state.isDashing ? 19.0 : 10.0); if (!state.debug) state.isDashing ? state.player.stamina = Math.max(0, state.player.stamina - 30 * dt) : regen(dt, 18); const rx = Math.cos(state.yaw), rz = -Math.sin(state.yaw), fx = -Math.sin(state.yaw), fz = -Math.cos(state.yaw); move((rx * x + fx * y) * speed * dt, (rz * x + fz * y) * speed * dt, up * speed * dt); }
function move(dx, dz, dy) { const nx = THREE.MathUtils.clamp(player.position.x + dx, bounds.minX, bounds.maxX); if (state.debug || !blocked(nx, player.position.z)) player.position.x = nx; const nz = THREE.MathUtils.clamp(player.position.z + dz, bounds.minZ, bounds.maxZ); if (state.debug || !blocked(player.position.x, nz)) player.position.z = nz; player.position.y = state.debug ? THREE.MathUtils.clamp(player.position.y + dy, 0, 160) : 0; if (Math.hypot(dx, dz) > .001) player.rotation.y = Math.atan2(dx, dz); staminaText(); }
function dodge() { const back = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw)); move(back.x * 2.8, back.z * 2.8, 0); burstAt(player.position.clone().add(new THREE.Vector3(0, .5, 0)), 0x87c7ff); }
function regen(dt, a) { state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + a * dt); staminaText(); }
function recoverMagic(dt) { const max = state.player.maxMp || 0; if (!max || state.player.mp >= max) return; const before = Math.floor(state.player.mp); state.player.mp = Math.min(max, state.player.mp + 1.15 * dt); if (Math.floor(state.player.mp) !== before || state.player.mp >= max) updateHud(); }
function gamepad() { const ps = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []; return ps.find((p) => /dualshock|wireless controller|dualsense|playstation/i.test(p.id)) || ps[0] || null; }
function dead(v) { return Math.abs(v) < .16 ? 0 : v; }
function handlePad() { const p = gamepad(); if (!p) return; const now = p.buttons.map((b) => b.pressed); const down = (i) => now[i] && !state.padButtons[i]; if (state.inDialogue) { const y = dead(p.axes[1] || 0); if (down(13) || y > .65) moveChoice(1); if (down(12) || y < -.65) moveChoice(-1); if (down(0)) advance(); if (down(1)) closeDialogue(true); state.padButtons = now; return; } if (down(0) && state.active) interact(); if (down(1)) dodge(); if (down(2)) castFireball("fire"); if (down(3)) castFireball("burst"); if (down(9) || down(11)) state.cameraMode = state.cameraMode === "third" ? "first" : "third"; state.padButtons = now; }
function detect() { let near = null, dist = Infinity; for (const n of npcs) { if (n.visible === false) continue; const d = player.position.distanceTo(n.position); if (d < dist) { dist = d; near = n.userData; } } for (const l of locations) { const d = Math.hypot(player.position.x - l.x, player.position.z - l.z); if (d < dist) { dist = d; near = l; } } if (near && dist < (near.r || 2.5) && !state.inDialogue) { state.active = near; ui.hintText.textContent = near.name || "調べる"; ui.hint.classList.remove("is-hidden"); } else { state.active = null; ui.hint.classList.add("is-hidden"); } }
function cameraUpdate() { const target = new THREE.Vector3(player.position.x, player.position.y + 1.08, player.position.z); if (state.cameraMode === "first") { const eye = new THREE.Vector3(player.position.x, player.position.y + 1.55, player.position.z); const look = new THREE.Vector3(-Math.sin(state.yaw) * Math.cos(state.pitch), Math.sin(state.pitch), -Math.cos(state.yaw) * Math.cos(state.pitch)); camera.position.lerp(eye, .45); if (state.shake > 0) camera.position.add(new THREE.Vector3(rand(-.035, .035), rand(-.025, .025), 0)); camera.lookAt(eye.clone().add(look)); player.visible = false; return; } player.visible = true; const big = state.map === "plaza", campus = state.map === "academyCampus" || state.map === "churchGrounds"; const radius = big ? 18 : campus ? 13 : 8.8, base = big ? 10 : campus ? 8 : 5.8; const off = new THREE.Vector3(Math.sin(state.yaw) * radius, base + Math.sin(state.pitch) * 7, Math.cos(state.yaw) * radius); camera.position.lerp(target.clone().add(off), .12); if (state.shake > 0) camera.position.add(new THREE.Vector3(rand(-.08, .08), rand(-.04, .04), rand(-.08, .08))); camera.lookAt(target); }
// 進行テーブル: 基準会話ID -> { q: 完了判定クエスト, after: 完了後の会話, mid?: 途中会話, midUntil?: midを抜ける条件クエスト }
// 同じイベントを二度発生させず、完了後は自動で「後日談」会話へ切り替える単一の真実源。
const PROGRESS = {
  caravan_attack: { q: "merchant", after: "caravan_after" },
  north_gate: { q: "gate", after: "north_gate_after" },
  plaza: { q: "plaza", after: "plaza_after" },
  guild_reception: { q: "guild_apply", after: "guild_reception_after", mid: "mana_measure", midUntil: "mana_test" },
  mana_measure: { q: "mana_test", after: "mana_after" },
  guildmaster: { q: "provisional", after: "guildmaster_after" },
  church: { q: "church_record", after: "church_after" },
  market: { q: "market", after: "market_after" },
  training: { q: "training", after: "training_after" },
  mock_battle: { q: "mock_battle", after: "mock_after" },
  alley: { q: "alley", after: "alley_after" },
  academy_teacher: { q: "academy", after: "academy_teacher_after" }
};
function resolveDialogueId(t) { const base = t.dialogue || t.id || "generic"; const rule = PROGRESS[base]; if (rule && done(rule.q)) { if (rule.mid && !done(rule.midUntil)) return rule.mid; return rule.after; } return base; }
function interact() { const t = state.active; if (!t) return; const targetMap = t.targetMap || t.map; if (targetMap) { playMapTransitionSound(targetMap); loadMap(targetMap, t.spawn || initialSpawn(targetMap)); return; } openDialogue(resolveDialogueId(t)); }
function openDialogue(id) { state.dialogueId = id; state.lineIndex = 0; state.selected = 0; state.inDialogue = true; document.body.classList.add("ui-dialogue"); ui.dialog.classList.remove("is-hidden"); renderDialogue(); }
function closeDialogue(playCancel = false) { if (playCancel) audio.play("ui_cancel"); state.inDialogue = false; document.body.classList.remove("ui-dialogue"); ui.dialog.classList.add("is-hidden"); }
function currentDialogue() { return DIALOGUES[state.dialogueId] || (data.dialogues && data.dialogues[state.dialogueId]) || DIALOGUES.generic; }
function renderDialogue() { const d = currentDialogue(); ui.speaker.textContent = d.speaker || ""; ui.line.textContent = d.lines[state.lineIndex] || ""; ui.choices.innerHTML = ""; if (state.lineIndex >= d.lines.length - 1 && d.choices) d.choices.forEach((c, i) => { const b = document.createElement("button"); b.textContent = c.text; b.classList.toggle("is-selected", i === state.selected); b.onclick = () => choose(c); ui.choices.appendChild(b); }); }
function advance() { const d = currentDialogue(); if (state.lineIndex < d.lines.length - 1) { state.lineIndex++; audio.play("dialogue_next"); renderDialogue(); } else if (d.choices?.length) choose(d.choices[state.selected] || d.choices[0]); else closeDialogue(); }
function moveChoice(delta) { const d = currentDialogue(); if (!d.choices?.length || state.lineIndex < d.lines.length - 1) return; state.selected = (state.selected + delta + d.choices.length) % d.choices.length; renderDialogue(); }
function choose(c) { audio.play("ui_decide"); if (c.done) markDone(c.done); if (c.set) Object.entries(c.set).forEach(([p, v]) => setDeep(p, v)); if (c.trust) addTrust(c.trust); if (c.objective) data.objective = c.objective; if (c.effect === "fire") castFireball("fire", true); if (c.effect === "crystal") crystalEffect(); if (c.to) { state.dialogueId = c.to; state.lineIndex = 0; state.selected = 0; updateHud(); renderDialogue(); return; } if (c.targetMap) { playMapTransitionSound(c.targetMap); closeDialogue(); loadMap(c.targetMap, c.spawn || initialSpawn(c.targetMap)); return; } closeDialogue(); updateHud(); }
function markDone(ids) { ids.forEach((id) => { const q = state.quest.find((x) => x.id === id); if (!q || q.done) return; q.done = true; try { dispatchEvent(new CustomEvent("aurelia:record", { detail: { id } })); } catch {} }); }
function addTrust(obj) { const t = state.player.trust || (state.player.trust = { Guild: 0, Church: 0, Crown: 0, Merchant: 0 }); let up = false; for (const k in obj) { if (obj[k] > 0) up = true; t[k] = (t[k] || 0) + obj[k]; } if (up) audio.play("trust_up"); }
function setDeep(path, val) { const ks = path.split("."); let t = state; while (ks.length > 1) { const k = ks.shift(); t[k] ??= {}; t = t[k]; } t[ks[0]] = val; }
// 進行許可/所持の単一の真実源。クエスト・契約・ランクから導出し、hotbar/debug/minimapが参照する。
function syncPermits() {
  const contract = String(state.player.contract || ""), rank = String(state.player.rank || "");
  return (state.player.items = {
    merchantLetter: done("merchant") || contract.includes("紹介状"),
    guildApplication: done("guild_apply"),
    manaTested: done("mana_test"),
    provisionalRank: done("provisional") || rank.includes("F級"),
    fRank: done("mock_battle") || rank.includes("F級冒険者"),
    churchRecord: done("church_record") || contract.includes("確認書"),
    academyRecommendation: done("academy") || contract.includes("学院")
  });
}
function updateHud() {
  const mpText = `${Math.floor(state.player.mp)}/${state.player.maxMp}`;
  ui.stat.name.textContent = state.player.name;
  ui.stat.hp.textContent = `${state.player.hp}/${state.player.maxHp}`;
  ui.stat.mp.textContent = mpText;
  if (ui.vital.mp) ui.vital.mp.textContent = mpText;
  renderHearts();
  staminaText();
  ui.stat.rank.textContent = state.player.rank;
  ui.stat.contract.textContent = state.player.contract;
  if (ui.stat.trust) { const tr = state.player.trust || {}; ui.stat.trust.textContent = `ギ${tr.Guild || 0} 教${tr.Church || 0} 王${tr.Crown || 0} 商${tr.Merchant || 0}`; }
  const objText = (state.debug ? "[DEBUG FLY] " : "") + (data.objective || "ギルドへ向かう");
  ui.objective.textContent = objText;
  if (ui.banner.objective) ui.banner.objective.textContent = objText;
  const areaNames = { plaza: "王都アウレリア城下町", guildHall: "冒険者ギルド内部", trainingGround: "外門練習場", academy: "王立魔法学院 講義棟", academyCampus: "王立魔法学院 キャンパス", church: "教会記録所", churchGrounds: "大聖堂 前庭", inn: "宿屋 曲がった匙亭", forestRoad: "王都へ続く森の街道" };
  const areaText = (areaNames[state.map] || data.maps?.[state.map]?.name || "王都へ続く森の街道") + (DAYPHASES[state.timeOfDay] ? "　・　" + DAYPHASES[state.timeOfDay].label : "");
  ui.area.textContent = areaText;
  if (ui.banner.area) ui.banner.area.textContent = areaText;
  const minimaps = { plaza: "[北門]\n  |\n[市場]-[中央広場]-[職人区]\n  |      |\n[スラム]-[ギルド]-[訓練場]\n  |\n[教会]-[学院]-[貴族街]-[王城]", guildHall: "[受付]-[水晶]\n   |\n[ギルドマスター]\n   |\n[出口]", trainingGround: "[入口]-[的]-[模擬戦]", academy: "[書架]-[魔導具]\n   |\n[教師]-[学院生]\n   |\n[出口→キャンパス]", academyCampus: "[講義棟]-[塔]\n   |\n[中庭/噴水]-[練習場]\n   |\n[正門→王都]", inn: "[客]-[女将]-[酔っ払い]\n   |\n[出口]", church: "[祭壇]\n  |\n[記録係]\n  |\n[出口→前庭]", churchGrounds: "[大聖堂]-[尖塔]\n   |\n[記録所]-[庭園/噴水]\n   |\n[正門→王都]", forestRoad: "[森の街道]--[荷車]--[王都門]" };
  ui.map.textContent = minimaps[state.map] || data.maps?.[state.map]?.minimap || "[森の街道] -- [王都門]";
  syncPermits();
  syncProgressHotbar();
  renderQuests();
}
function renderQuests() { ui.quests.innerHTML = ""; state.quest.forEach((q) => { const li = document.createElement("li"); li.textContent = q.text; if (q.done) li.classList.add("done"); ui.quests.appendChild(li); }); }
function syncProgressHotbar() {
  if (!ui.hotbar) return;
  const items = state.player.items || syncPermits();
  const guildStatus = items.guildApplication || items.provisionalRank;
  const slot = (n, text, title) => {
    const el = ui.hotbar.querySelector(`.slot[data-slot="${n}"]`);
    const name = el?.querySelector(".slot-name");
    if (!el || !name) return;
    name.textContent = text;
    el.title = title;
  };
  slot(5, items.merchantLetter ? "紹介状" : "紹介状?", items.merchantLetter ? "商会の紹介状を所持" : "荷車襲撃の黒毛の噛み犬を火球で止めると入手");
  slot(6, guildStatus ? (items.provisionalRank ? "F仮登録" : "申請済") : "ギルド証?", guildStatus ? `ギルド進行: ${state.player.rank || "登録申請済み"}` : "紹介状を持ってギルド受付へ");
  slot(7, items.academyRecommendation ? "学院推薦" : items.fRank ? "F級証" : "携帯食", items.academyRecommendation ? "魔法学院の観察対象/推薦を取得" : items.fRank ? "F級冒険者として登録済み" : "携帯食（常備）");
}
function staminaText() { ui.stat.stamina.textContent = `${Math.round(state.player.stamina)}/${state.player.maxStamina}`; if (ui.vital.stamina) ui.vital.stamina.textContent = `${Math.round(state.player.stamina / state.player.maxStamina * 100)}%`; }
function renderHearts() { if (!ui.hearts) return; const max = Math.max(1, Math.ceil((state.player.maxHp || 200) / 20)); const filled = Math.round((state.player.hp || 0) / 20); let html = ""; for (let i = 0; i < max; i++) html += `<span class="heart${i < filled ? "" : " empty"}">♥</span>`; ui.hearts.innerHTML = html; }
function selectSlot(n) { state.hotbarSlot = n; if (ui.hotbar) for (const s of ui.hotbar.querySelectorAll(".slot")) s.classList.toggle("is-selected", +s.dataset.slot === n); audio.play("ui_decide"); }
function openMenu() { if (state.menuOpen || state.inDialogue) return; state.menuOpen = true; state.keys.clear(); updateHud(); ui.menu?.classList.remove("is-hidden"); document.body.classList.add("ui-menu"); audio.play("ui_decide"); }
function closeMenu() { if (!state.menuOpen) return; state.menuOpen = false; ui.menu?.classList.add("is-hidden"); document.body.classList.remove("ui-menu"); audio.play("ui_cancel"); }
function toggleMenu() { state.menuOpen ? closeMenu() : openMenu(); }
function bindMenu() { ui.menuClose?.addEventListener("click", closeMenu); ui.menu?.addEventListener("click", (e) => { if (e.target === ui.menu) closeMenu(); }); }
function bindAudioToggle() { if (!ui.audioToggle) return; ui.audioToggle.addEventListener("change", () => { audio.enable(); audio.setMuted(!ui.audioToggle.checked); }); }
window.__AURELIA_DEBUG__ = { state, quests: () => state.quest.map((q) => `${q.done ? "✓" : "・"} ${q.id}: ${q.text}`), jump: (map, x = 0, z = 0) => loadMap(map, { x, z }), complete: (...ids) => { markDone(ids); updateHud(); }, items: () => syncPermits(), movers: () => ({ total: movers.length, byType: movers.reduce((a, m) => (a[m.type] = (a[m.type] || 0) + 1, a), {}), stuck: movers.filter((m) => (m.stuck || 0) > 6).length, sample: movers.slice(0, 8).map((m) => ({ type: m.type, x: +m.obj.position.x.toFixed(1), z: +m.obj.position.z.toFixed(1), idx: m.index, stuck: m.stuck || 0, wait: +(m.wait || 0).toFixed(2), visible: m.obj.visible !== false })) }), resolve: (dlg) => resolveDialogueId({ dialogue: dlg }), progress: PROGRESS, fx: () => ({ projectiles: projectiles.length, bursts: bursts.length, worldChildren: world.children.length }), cast: (m) => castFireball(m || "fire", true), nColliders: () => colliders.length, blocked: (x, z) => blocked(x, z), nearestCollider: (x, z) => { let best = null, bd = Infinity; for (const c of colliders) { const d = Math.hypot(x - c.x, z - c.z); if (d < bd) { bd = d; best = c; } } return best ? { x: +best.x.toFixed(1), z: +best.z.toFixed(1), w: +best.w.toFixed(1), d: +best.d.toFixed(1), label: best.label, dist: +bd.toFixed(1) } : null; },
peek: () => ({ cam: camera.position.toArray().map((n) => +n.toFixed(1)), dir: (() => { const d = new THREE.Vector3(); camera.getWorldDirection(d); return d.toArray().map((n) => +n.toFixed(2)); })(), balls: projectiles.map((p) => { const ndc = p.ball.position.clone().project(camera); return { pos: p.ball.position.toArray().map((n) => +n.toFixed(1)), visible: p.ball.visible, inScene: !!p.ball.parent, emis: p.ball.material.emissiveIntensity, ndc: [+ndc.x.toFixed(2), +ndc.y.toFixed(2), +ndc.z.toFixed(2)] }; }) }) };
// 公式ミニマップAPI(読み取り専用): next_destination.js はこれを優先利用し、cameraからの近似(approx)位置を使わない。
window.__AURELIA_MINIMAP__ = () => ({
  map: state.map,
  x: player.position.x,
  z: player.position.z,
  yaw: state.yaw,
  pitch: state.pitch,
  objective: data.objective || "",
  items: state.player.items || {},
  active: state.active ? { id: state.active.id || null, name: state.active.name || null, dialogue: state.active.dialogue || null, targetMap: state.active.targetMap || state.active.map || null } : null
});
addEventListener("keydown", (e) => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault(); if (state.inDialogue) { if (e.code === "ArrowDown") { moveChoice(1); return; } if (e.code === "ArrowUp") { moveChoice(-1); return; } if (e.code === "Escape") return closeDialogue(true); if (e.code === "Enter" || e.code === "Space") return advance(); return; } if (state.menuOpen) { if (e.code === "Escape") closeMenu(); return; } if (e.code === "Escape") { toggleMenu(); return; } if (e.code === "KeyF") state.cameraMode = state.cameraMode === "third" ? "first" : "third"; if (e.code === "Backquote" || e.code === "F3") { state.debug = !state.debug; updateHud(); } if (e.code === "KeyT") setTimeOfDay(PHASE_ORDER[(PHASE_ORDER.indexOf(state.timeOfDay) + 1) % 4]); if (e.code === "KeyE" && state.active) interact(); if (/^Digit[1-9]$/.test(e.code)) selectSlot(+e.code.slice(5)); state.keys.add(e.code); });
addEventListener("keyup", (e) => state.keys.delete(e.code));
ui.canvas.addEventListener("pointerdown", (e) => { state.drag = true; state.lastX = e.clientX; state.lastY = e.clientY; });
addEventListener("pointerup", () => state.drag = false);
addEventListener("pointermove", (e) => { if (!state.drag || state.inDialogue) return; state.yaw -= (e.clientX - state.lastX) * .006; state.pitch = THREE.MathUtils.clamp(state.pitch - (e.clientY - state.lastY) * .004, -.55, .75); state.lastX = e.clientX; state.lastY = e.clientY; });
addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, quality.pixelRatio)); });
