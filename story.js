window.GAME_DATA = {
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
  objective: "まずは現在地を把握する",
  quests: [
    { id: "wake", text: "石畳で目覚めた状況を確認する", done: false },
    { id: "caravan", text: "荷車襲撃の現場を確認する", done: false },
    { id: "merchant", text: "商人から紹介状を得る", done: false },
    { id: "guild", text: "冒険者ギルドに入る", done: false },
    { id: "register", text: "受付で登録条件を聞く", done: false },
    { id: "church", text: "教会で身分保証を相談する", done: false }
  ],
  maps: {
    plaza: {
      name: "王都中央広場",
      minimap: "      [教会]\n         |\n[宿屋]-[広場]-[市場]\n       / | \\\n [荷車] [ギルド]",
      npcs: [
        { id: "traveler", variant: "traveler", name: "通行人", position: { x: -3.8, z: 2.2 }, color: 0x7f9fbd, dialogue: "traveler_start" },
        { id: "guard", variant: "guard", name: "護衛隊員", position: { x: 4.2, z: 1.1 }, color: 0xb77954, dialogue: "guard_start" },
        { id: "guild_guide", variant: "guild_guide", name: "ギルド案内係", position: { x: -1.8, z: -8.2 }, color: 0xd8b36b, dialogue: "guild_guide_start" }
      ],
      locations: [
        { id: "wake_point", name: "白い輪郭を確認", position: { x: 0.8, z: 4.8 }, dialogue: "wake_status", radius: 1.8 },
        { id: "caravan_site", name: "倒れた荷車を見る", position: { x: 6.2, z: -2.2 }, dialogue: "street_attack_start", radius: 2.3 },
        { id: "guild_door", name: "冒険者ギルドに入る", position: { x: 0, z: -9.6 }, targetMap: "guildHall", spawn: { x: 0, z: 6.4 }, radius: 2.4 },
        { id: "church_door", name: "教会に入る", position: { x: -10.5, z: -4.3 }, targetMap: "church", spawn: { x: 0, z: 5.5 }, radius: 2.2 }
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
        { id: "guild_exit", name: "広場へ戻る", position: { x: 0, z: 7.0 }, targetMap: "plaza", spawn: { x: 0, z: -7.2 }, radius: 1.9 },
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
        { id: "church_exit", name: "広場へ戻る", position: { x: 0, z: 6.3 }, targetMap: "plaza", spawn: { x: -10.5, z: -2.2 }, radius: 2.0 }
      ]
    }
  },
  dialogues: {
    wake_status: {
      speaker: "ユウジ",
      lines: [
        "喉の奥に、まだバナナの感触が残っている気がした。だが肺には空気が入る。",
        "石畳。土埃。獣脂と汗と排泄の匂い。綺麗な絵本みたいな異世界ではない。",
        "視界の端が白く縁取られ、薄い円の内側に文字が浮かぶ。",
        "【NAME】YUJI SATO　【RACE】Human　【LV】1　【HP】200/200　【MP】25/25",
        "……はいはい、ステータスオープン。だが、これは誰かが用意したUIかもしれない。"
      ],
      choices: [
        { text: "周囲を観察する", to: "wake_observe", stat: { caution: 1, knowledge: 1 }, objective: "ギルドと荷車襲撃の情報を集める", done: ["wake"] }
      ]
    },
    wake_observe: {
      speaker: "ユウジ",
      lines: [
        "門税、夜間外出禁止、未洗礼、失踪者。掲示板の文字だけで、この街が“社会”だとわかる。",
        "社会なら、入口がある。冒険者ギルド。テンプレ要素で、今だけ少し安心する。"
      ]
    },
    traveler_start: {
      speaker: "通行人",
      lines: [
        "……お前、さっきから同じ場所を見ているな。",
        "迷子か？　ギルドなら大通りの奥だ。槍と盾の看板が出ている。",
        "ただし、いまは荷車が荒れている。黒毛の噛み犬が出たらしい。近づくなら自己責任だ。"
      ],
      choices: [
        { text: "礼を言って荷車の方も見る", to: "traveler_thanks", stat: { trust: 1, knowledge: 1 }, objective: "荷車襲撃の現場を確認する", done: ["wake"] },
        { text: "未登録者について聞く", to: "traveler_unregistered", stat: { caution: 1, knowledge: 1 } }
      ]
    },
    traveler_thanks: {
      speaker: "ユウジ",
      lines: [
        "ありがとうございます。",
        "ギルドに登録するにも、まずはこの街で使える信用がいる。紹介状か、保証人か、洗礼証明。"
      ]
    },
    traveler_unregistered: {
      speaker: "通行人",
      lines: [
        "未登録者は、税も身分も保証も曖昧だ。",
        "この街では、何者でもない奴から先に疑われる。ギルドか教会に噛ませろ。"
      ],
      choices: [
        { text: "荷車の現場へ向かう", to: "traveler_thanks", objective: "荷車襲撃の現場を確認する", done: ["wake"] }
      ]
    },
    guard_start: {
      speaker: "護衛隊員",
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
      speaker: "護衛隊員",
      lines: [
        "外門の外にいるはずの魔核動物だ。犬に似ているが、目が違う。殺すために噛む。",
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
        "黒い獣がこちらを見る。関わるな、と身体が言う。だが、荷の下で男が息をしている。",
        "武器はない。魔法が使える保証もない。けれど、何もしないなら、ここで“見殺しにした人間”になる。"
      ],
      choices: [
        { text: "恥を捨てて『ファイアボール』と叫ぶ", to: "fireball_first", stat: { courage: 1 }, done: ["caravan"] },
        { text: "石を投げて注意を引く", to: "stone_decoy", stat: { caution: 2 }, done: ["caravan"] },
        { text: "今は退く", to: "retreat_from_beast", stat: { caution: 1 } }
      ]
    },
    fireball_first: {
      speaker: "ユウジ",
      lines: [
        "『ファイアボール！』",
        "自分で言っていて恥ずかしい。だが、掌の前で火が生まれた。小さな火球は獣の鼻先で弾ける。",
        "獣が怯んだ。その一瞬で、護衛隊員が槍を入れる。勝った、というより、死なずに済んだ。"
      ],
      choices: [
        { text: "商人を助け起こす", to: "merchant_saved", stat: { trust: 2, knowledge: 1 }, set: { "player.contract": "商人紹介状" }, objective: "紹介状を持ってギルドへ向かう", done: ["merchant"] }
      ]
    },
    stone_decoy: {
      speaker: "ユウジ",
      lines: [
        "石を拾って投げる。獣の目がこちらへ流れる。判断としては最悪だ。だが、護衛隊員の槍が間に合う。",
        "直接倒したわけじゃない。だが、男が荷の下から引きずり出されるだけの時間は作れた。"
      ],
      choices: [
        { text: "商人を助け起こす", to: "merchant_saved", stat: { trust: 1, caution: 1 }, set: { "player.contract": "商人紹介状" }, objective: "紹介状を持ってギルドへ向かう", done: ["merchant"] }
      ]
    },
    retreat_from_beast: {
      speaker: "ユウジ",
      lines: [
        "足が動かない。いや、動いた。後ろへ。",
        "生きることはできる。だが、見なかったことにはできない。紹介状なしでギルドに行くしかない。"
      ],
      choices: [
        { text: "ギルドへ向かう", to: "traveler_thanks", objective: "冒険者ギルドへ向かう" }
      ]
    },
    merchant_saved: {
      speaker: "商人",
      lines: [
        "助かった……。あんた、登録前の冒険者か？　いや、違うな。目が街の外の人間だ。",
        "名前は？　ユウジ・サトウ？　変わった名だが、命の恩人だ。",
        "ギルドへ行け。私の名で紹介状を出す。宿の一晩くらいなら手配する。"
      ],
      choices: [
        { text: "紹介状を受け取る", to: "merchant_letter", set: { "player.rank": "紹介状持ち" }, objective: "紹介状を持ってギルドへ向かう" }
      ]
    },
    merchant_letter: {
      speaker: "ユウジ",
      lines: [
        "紙一枚。だが、この世界では紙一枚が身分の代わりになる。",
        "いま欲しいのはチート能力ではない。疑われずに話を聞いてもらうための信用だ。"
      ]
    },
    guild_guide_start: {
      speaker: "ギルド案内係",
      lines: [
        "登録なら中の受付へ。外で名前を書いても意味はないぞ。",
        "紹介状があるなら話は早い。ないなら、教会か保証人が必要だ。"
      ],
      choices: [
        { text: "ギルドに入る", targetMap: "guildHall", spawn: { x: 0, z: 6.4 }, objective: "受付で登録条件を聞く", done: ["guild"] },
        { text: "まだ広場を見る", to: "guide_wait" }
      ]
    },
    guide_wait: {
      speaker: "ギルド案内係",
      lines: ["迷う時間があるなら、昼のうちに済ませた方がいい。夜は面倒が増える。"]
    },
    reception_start: {
      speaker: "ギルド受付",
      lines: [
        "冒険者登録ですか？　紹介状、洗礼証明、契約紋のいずれかはお持ちですか。",
        "……商人の紹介状。荷車襲撃の件ですね。状況報告は入っています。",
        "ただし、紹介状は身分証ではありません。仮登録の審査と魔力測定を受けていただきます。"
      ],
      choices: [
        { text: "魔力測定を受ける", to: "mana_crystal", stat: { trust: 2, knowledge: 1 }, set: { "player.rank": "最低ランク（仮）" }, objective: "明日の模擬戦に備えて魔法を練習する", done: ["register"] },
        { text: "身分証がないことを正直に言う", to: "reception_honest", stat: { trust: 1, caution: 1 }, set: { "player.rank": "仮登録待ち" }, objective: "教会で身分保証を相談する", done: ["register"] }
      ]
    },
    mana_crystal: {
      speaker: "ギルド受付",
      lines: [
        "水晶に手を置いてください。魔力量と属性傾向を測ります。",
        "……反応が薄い？　いえ、違います。内部に細かい亀裂が入っています。故障、ではなく過負荷……？",
        "最低ランクの仮登録にしておきます。明日の模擬戦で実技を確認します。"
      ],
      choices: [
        { text: "広場へ戻る", targetMap: "plaza", spawn: { x: 0, z: -7.2 }, objective: "明日の模擬戦に備えて魔法を練習する" }
      ]
    },
    reception_honest: {
      speaker: "ギルド受付",
      lines: [
        "正直なのは助かります。虚偽申告だと護衛隊案件になりますから。",
        "では、仮登録の審査になります。教会で未洗礼者としての確認を受けるか、保証人を立ててください。"
      ],
      choices: [
        { text: "教会へ向かう", targetMap: "plaza", spawn: { x: -8.0, z: -2.2 }, objective: "教会で身分保証を相談する" }
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
    veteran_magic: {
      speaker: "古参冒険者",
      lines: ["外門の練習場に行け。街中で火球を撃つな。受付嬢に怒られるより先に罰金だ。"]
    },
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
    quest_board_close: {
      speaker: "ユウジ",
      lines: ["依頼はある。だが、受ける権利がまだない。まずは身分だ。"]
    },
    priest_start: {
      speaker: "司祭",
      lines: [
        "旅人よ、祈祷ですか。それとも記録の確認ですか。",
        "……洗礼記録が無い？　珍しいですね。生国と家名を伺っても？"
      ],
      choices: [
        { text: "異国から来たとだけ言う", to: "priest_foreign", stat: { caution: 1, trust: 1 }, set: { "player.contract": "教会確認中" }, objective: "ギルドへ戻って仮登録を進める", done: ["church"] },
        { text: "正直に、別世界から来たとは言わない", to: "priest_silent", stat: { caution: 2 }, set: { "player.contract": "未確認" } }
      ]
    },
    priest_foreign: {
      speaker: "司祭",
      lines: [
        "異国の方でしたか。ならば未洗礼扱いで確認書を出せます。",
        "ただし、保証ではありません。あなたがこの街の規則に従う意思を示すための紙です。",
        "ギルドへ戻りなさい。受付なら、この印を読めるはずです。"
      ],
      choices: [
        { text: "ギルドへ戻る", targetMap: "plaza", spawn: { x: -9.0, z: -3.0 }, objective: "ギルドへ戻って仮登録を進める" }
      ]
    },
    priest_silent: {
      speaker: "司祭",
      lines: [
        "言えない事情があるのですね。",
        "沈黙は罪ではありません。しかし、沈黙には保証もありません。必要になったら、もう一度来なさい。"
      ]
    }
  }
};
