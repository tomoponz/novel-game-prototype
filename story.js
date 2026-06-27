window.GAME_DATA = {
  startMap: "forestRoad",
  startSpawn: { x: 0, z: 74 },
  player: {
    name: "ユウジ・サトウ",
    hp: 200,
    maxHp: 200,
    mp: 25,
    maxMp: 25,
    rank: "未登録",
    contract: "未契約",
    knowledge: 0,
    caution: 0,
    trust: 0,
    luck: 18,
    title: "転生者 / 未契約者"
  },
  objective: "王都へ続く森の道で状況を把握する",
  quests: [
    { id: "wake", text: "森の街道で目覚めた状況を確認する", done: false },
    { id: "caravan", text: "荷車襲撃の現場を確認する", done: false },
    { id: "merchant", text: "商人を助けて紹介状を得る", done: false },
    { id: "guild", text: "王都の冒険者ギルドに入る", done: false },
    { id: "register", text: "受付で登録と魔力測定を受ける", done: false },
    { id: "church", text: "教会で身分保証を相談する", done: false }
  ],
  maps: {
    forestRoad: {
      name: "王都へ続く森の街道",
      minimap: "[森]---[荷車]---[王都門]\n  |       |        |\n[目覚め] [黒毛の獣] [城壁]",
      npcs: [
        { id: "road_guard", variant: "guard", name: "街道警備兵", position: { x: -6, z: 7 }, color: 0xb77954, dialogue: "guard_start" }
      ],
      locations: [
        { id: "wake_point", name: "白い輪郭を確認", position: { x: 0, z: 72 }, dialogue: "wake_status", radius: 2.1 },
        { id: "caravan_site", name: "襲われた荷車を見る", position: { x: 6, z: 15 }, dialogue: "street_attack_start", radius: 3.1 },
        { id: "city_gate", name: "王都門へ入る", position: { x: 0, z: -105 }, targetMap: "plaza", spawn: { x: 0, z: 185 }, radius: 4.2 }
      ]
    },
    plaza: {
      name: "王都アウレリア全域",
      minimap: "[北門]\n  |\n[教会丘]-[中央広場]-[市場]\n  |          |       \\\n[貴族街]  [ギルド]  [訓練場]\n  |\n[王城]",
      npcs: [
        { id: "traveler", variant: "traveler", name: "通行人", position: { x: -18, z: 22 }, color: 0x7f9fbd, dialogue: "traveler_start" },
        { id: "guild_guide", variant: "guild_guide", name: "ギルド案内係", position: { x: 22, z: -28 }, color: 0xd8b36b, dialogue: "guild_guide_start" }
      ],
      locations: [
        { id: "north_gate", name: "森の街道へ戻る", position: { x: 0, z: 190 }, targetMap: "forestRoad", spawn: { x: 0, z: -96 }, radius: 5.0 },
        { id: "guild_door", name: "冒険者ギルドに入る", position: { x: 28, z: -31 }, targetMap: "guildHall", spawn: { x: 0, z: 6.4 }, radius: 4.0 },
        { id: "church_door", name: "教会に入る", position: { x: -74, z: -31 }, targetMap: "church", spawn: { x: 0, z: 5.5 }, radius: 3.3 },
        { id: "training_gate", name: "外門練習場へ行く", position: { x: 128, z: 94 }, targetMap: "trainingGround", spawn: { x: 0, z: 48 }, radius: 4.0 }
      ]
    },
    guildHall: {
      name: "冒険者ギルド・受付ホール",
      minimap: "[掲示板]  [受付]\n\n  [テーブル]\n\n      [出口]",
      npcs: [
        { id: "receptionist", variant: "receptionist", name: "ギルド受付", position: { x: 0, z: -3.4 }, color: 0xd8b36b, dialogue: "reception_start" },
        { id: "veteran", variant: "veteran", name: "古参冒険者", position: { x: -3.8, z: .9 }, color: 0x8c6f4f, dialogue: "veteran_start" }
      ],
      locations: [
        { id: "guild_exit", name: "王都へ戻る", position: { x: 0, z: 7.0 }, targetMap: "plaza", spawn: { x: 28, z: -18 }, radius: 1.9 },
        { id: "quest_board", name: "依頼掲示板を見る", position: { x: -4.9, z: -3.5 }, dialogue: "quest_board_start", radius: 1.6 }
      ]
    },
    church: {
      name: "教会・祈祷室",
      minimap: "   [祭壇]\n\n [司祭]\n\n   [出口]",
      npcs: [
        { id: "priest", variant: "priest", name: "司祭", position: { x: 0, z: -2.5 }, color: 0xc9c4ad, dialogue: "priest_start" }
      ],
      locations: [
        { id: "church_exit", name: "王都へ戻る", position: { x: 0, z: 6.3 }, targetMap: "plaza", spawn: { x: -74, z: -20 }, radius: 2.0 }
      ]
    },
    trainingGround: {
      name: "外門練習場",
      minimap: "[標的] [標的] [標的]\n\n      [王都へ戻る]",
      npcs: [],
      locations: [
        { id: "training_exit", name: "王都へ戻る", position: { x: 0, z: 52 }, targetMap: "plaza", spawn: { x: 128, z: 86 }, radius: 3.2 }
      ]
    }
  },
  dialogues: {
    wake_status: {
      speaker: "ユウジ",
      lines: [
        "喉の奥に、まだバナナの感触が残っている気がした。だが肺には空気が入る。",
        "石畳ではない。湿った土、落ち葉、車輪の轍。王都へ続く森の街道だ。",
        "視界の端が白く縁取られ、薄い円の内側に文字が浮かぶ。",
        "【NAME】YUJI SATO　【RACE】Human　【LV】1　【HP】200/200　【MP】25/25",
        "ステータス画面があるから安全、ではない。むしろ誰かに観測されている可能性がある。"
      ],
      choices: [
        { text: "街道と荷車の音を確認する", to: "wake_observe", stat: { caution: 1, knowledge: 1 }, objective: "森の街道を進み、荷車襲撃の現場を確認する", done: ["wake"] }
      ]
    },
    wake_observe: {
      speaker: "ユウジ",
      lines: [
        "王都の城壁が遠くに見える。手前には横倒しの荷車。",
        "テンプレならここで人助けをして信用を得る。だが、テンプレ通りに動けば生き残れる保証はない。"
      ]
    },
    guard_start: {
      speaker: "街道警備兵",
      lines: [
        "下がれ。荷車が襲われた。黒毛の噛み犬がまだ近い。",
        "武器も身分証もないなら近づくな。……ただ、商人が一人、荷の下で動けない。"
      ],
      choices: [
        { text: "危険を承知で荷車を見る", to: "street_attack_start", stat: { caution: 1 }, objective: "荷車襲撃の現場を確認する" },
        { text: "獣について聞く", to: "guard_beast", stat: { knowledge: 1 } }
      ]
    },
    guard_beast: {
      speaker: "街道警備兵",
      lines: [
        "黒毛の魔核動物だ。犬に似ているが、目が違う。殺すために噛む。",
        "火を見せれば一瞬怯む。魔法が使えるなら、叫ぶより撃て。"
      ],
      choices: [
        { text: "荷車を見る", to: "street_attack_start", objective: "荷車襲撃の現場を確認する" }
      ]
    },
    street_attack_start: {
      speaker: "ユウジ",
      lines: [
        "横倒しの荷車。こぼれた布袋。馬の泡。血の匂い。",
        "黒い獣がこちらを見る。荷の下で男が息をしている。",
        "武器はない。魔法が使える保証もない。けれど、何もしないなら、ここで“見殺しにした人間”になる。"
      ],
      choices: [
        { text: "恥を捨てて『ファイアボール』と叫ぶ", to: "fireball_first", stat: { courage: 1 }, done: ["caravan"] },
        { text: "石を投げて注意を引く", to: "stone_decoy", stat: { caution: 2 }, done: ["caravan"] },
        { text: "今は退く", to: "retreat_from_beast", stat: { caution: 1 }, done: ["caravan"] }
      ]
    },
    fireball_first: {
      speaker: "ユウジ",
      lines: [
        "『ファイアボール！』",
        "掌の前で火が生まれる。小さな火球は街道の空気を焦がしながら獣へ飛んだ。",
        "獣が怯む。その一瞬で警備兵の槍が入る。勝ったというより、死なずに済んだ。"
      ],
      choices: [
        { text: "商人を助け起こす", to: "merchant_saved", stat: { trust: 2, knowledge: 1 }, set: { "player.contract": "商人紹介状" }, objective: "紹介状を持って王都のギルドへ向かう", done: ["merchant"] }
      ]
    },
    stone_decoy: {
      speaker: "ユウジ",
      lines: [
        "石を投げる。獣の目がこちらへ流れる。判断としては最悪だ。だが、警備兵の槍が間に合う。",
        "直接倒したわけじゃない。だが、男を引きずり出すだけの時間は作れた。"
      ],
      choices: [
        { text: "商人を助け起こす", to: "merchant_saved", stat: { trust: 1, caution: 1 }, set: { "player.contract": "商人紹介状" }, objective: "紹介状を持って王都のギルドへ向かう", done: ["merchant"] }
      ]
    },
    retreat_from_beast: {
      speaker: "ユウジ",
      lines: [
        "足が後ろへ動いた。生き残るための判断だ。",
        "だが、見なかったことにはできない。紹介状なしで王都のギルドに行くしかない。"
      ],
      choices: [
        { text: "王都門へ向かう", targetMap: "plaza", spawn: { x: 0, z: 185 }, objective: "王都のギルドを探す" }
      ]
    },
    merchant_saved: {
      speaker: "商人",
      lines: [
        "助かった……。あんた、登録前の冒険者か？　いや、違うな。目が街の外の人間だ。",
        "ユウジ・サトウ？　変わった名だが、命の恩人だ。",
        "王都に入ったらギルドへ行け。私の名で紹介状を出す。"
      ],
      choices: [
        { text: "紹介状を受け取る", to: "merchant_letter", set: { "player.rank": "紹介状持ち" }, objective: "王都門からギルドへ向かう" }
      ]
    },
    merchant_letter: {
      speaker: "ユウジ",
      lines: [
        "紙一枚。だが、この世界では紙一枚が身分の代わりになる。",
        "チート能力より先に、疑われずに話を聞いてもらうための信用が必要だ。"
      ]
    },
    traveler_start: {
      speaker: "通行人",
      lines: [
        "ようこそ王都アウレリアへ。北門から来たなら荷車騒ぎを見たか？",
        "ギルドは中央から少し南東だ。城下は広い。道を見失うなよ。"
      ],
      choices: [
        { text: "ギルドへ向かう", to: "traveler_thanks", objective: "王都の冒険者ギルドへ向かう" }
      ]
    },
    traveler_thanks: {
      speaker: "ユウジ",
      lines: ["王都は広い。だが、看板と大通りを見れば迷わず進める。"]
    },
    guild_guide_start: {
      speaker: "ギルド案内係",
      lines: [
        "登録なら中の受付へ。紹介状があるなら話は早い。",
        "ないなら、教会か保証人が必要だ。"
      ],
      choices: [
        { text: "ギルドに入る", targetMap: "guildHall", spawn: { x: 0, z: 6.4 }, objective: "受付で登録条件を聞く", done: ["guild"] },
        { text: "まだ王都を見る", to: "guide_wait" }
      ]
    },
    guide_wait: { speaker: "ギルド案内係", lines: ["王都は広いが、最初に行くべき場所は多くない。登録、宿、教会。この三つだ。"] },
    reception_start: {
      speaker: "ギルド受付",
      lines: [
        "冒険者登録ですか？　紹介状、洗礼証明、契約紋のいずれかはお持ちですか。",
        "……商人の紹介状。街道の荷車襲撃の件ですね。報告は入っています。",
        "ただし、紹介状は身分証ではありません。仮登録の審査と魔力測定を受けていただきます。"
      ],
      choices: [
        { text: "魔力測定を受ける", to: "mana_crystal", stat: { trust: 2, knowledge: 1 }, set: { "player.rank": "最低ランク（仮）" }, objective: "外門練習場で魔法を試す", done: ["register"] },
        { text: "身分証がないことを正直に言う", to: "reception_honest", stat: { trust: 1, caution: 1 }, set: { "player.rank": "仮登録待ち" }, objective: "教会で身分保証を相談する", done: ["register"] }
      ]
    },
    mana_crystal: {
      speaker: "ギルド受付",
      lines: [
        "水晶に手を置いてください。魔力量と属性傾向を測ります。",
        "……反応が薄い？　いえ、違います。内部に細かい亀裂が入っています。過負荷……？",
        "最低ランクの仮登録にしておきます。外門練習場で実技を確認してください。"
      ],
      choices: [
        { text: "王都へ戻る", targetMap: "plaza", spawn: { x: 28, z: -18 }, objective: "外門練習場で魔法を試す" }
      ]
    },
    reception_honest: {
      speaker: "ギルド受付",
      lines: [
        "正直なのは助かります。虚偽申告だと護衛隊案件になります。",
        "教会で未洗礼者としての確認を受けるか、保証人を立ててください。"
      ],
      choices: [
        { text: "教会へ向かう", targetMap: "plaza", spawn: { x: -74, z: -20 }, objective: "教会で身分保証を相談する" }
      ]
    },
    veteran_start: {
      speaker: "古参冒険者",
      lines: [
        "新人か。いや、まだ新人ですらない顔だな。",
        "紹介状があるなら大事にしろ。力より先に信用をなくす奴から死ぬ。"
      ],
      choices: [
        { text: "魔法練習の場所を聞く", to: "veteran_magic", stat: { knowledge: 1 } }
      ]
    },
    veteran_magic: { speaker: "古参冒険者", lines: ["外門練習場に行け。王都内で火球を撃つな。受付嬢に怒られるより先に罰金だ。"] },
    quest_board_start: {
      speaker: "依頼掲示板",
      lines: [
        "【黒毛の噛み犬 注意】未登録者の単独対応を禁ず。",
        "【荷運び補助】市場から倉庫。小銅貨八枚。",
        "【外門練習場】初級魔法の試射は鐘二つまで。"
      ],
      choices: [
        { text: "今は登録を優先する", to: "quest_board_close" }
      ]
    },
    quest_board_close: { speaker: "ユウジ", lines: ["依頼はある。だが、受ける権利がまだない。まずは身分だ。"] },
    priest_start: {
      speaker: "司祭",
      lines: ["旅人よ、祈祷ですか。それとも記録の確認ですか。", "……洗礼記録が無い？　珍しいですね。生国と家名を伺っても？"],
      choices: [
        { text: "異国から来たとだけ言う", to: "priest_foreign", stat: { caution: 1, trust: 1 }, set: { "player.contract": "教会確認中" }, objective: "ギルドへ戻って仮登録を進める", done: ["church"] },
        { text: "正直に、別世界から来たとは言わない", to: "priest_silent", stat: { caution: 2 }, set: { "player.contract": "未確認" } }
      ]
    },
    priest_foreign: {
      speaker: "司祭",
      lines: ["異国の方でしたか。未洗礼扱いで確認書を出せます。", "ただし、保証ではありません。あなたがこの街の規則に従う意思を示すための紙です。"],
      choices: [
        { text: "ギルドへ戻る", targetMap: "plaza", spawn: { x: -74, z: -20 }, objective: "ギルドへ戻って仮登録を進める" }
      ]
    },
    priest_silent: { speaker: "司祭", lines: ["言えない事情があるのですね。", "沈黙は罪ではありません。しかし、沈黙には保証もありません。必要になったら、もう一度来なさい。"] }
  }
};
