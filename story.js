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
    trust: 0
  },
  objective: "ギルドの場所を探す",
  quests: [
    { id: "wake", text: "現在地を把握する", done: false },
    { id: "guild", text: "冒険者ギルドに入る", done: false },
    { id: "register", text: "受付で登録条件を聞く", done: false },
    { id: "church", text: "教会で身分保証を相談する", done: false }
  ],
  maps: {
    plaza: {
      name: "王都中央広場",
      minimap: "      [教会]\n         |\n[宿屋]-[広場]-[市場]\n         |\n      [ギルド]",
      npcs: [
        { id: "traveler", name: "通行人", position: { x: -3.8, z: 2.2 }, color: 0x7f9fbd, dialogue: "traveler_start" },
        { id: "guard", name: "護衛隊員", position: { x: 4.2, z: 1.1 }, color: 0xb77954, dialogue: "guard_start" },
        { id: "guild_guide", name: "ギルド案内係", position: { x: -1.8, z: -8.2 }, color: 0xd8b36b, dialogue: "guild_guide_start" }
      ],
      locations: [
        { id: "guild_door", name: "冒険者ギルドに入る", position: { x: 0, z: -9.6 }, targetMap: "guildHall", spawn: { x: 0, z: 6.4 }, radius: 2.4 },
        { id: "church_door", name: "教会に入る", position: { x: -10.5, z: -4.3 }, targetMap: "church", spawn: { x: 0, z: 5.5 }, radius: 2.2 }
      ]
    },
    guildHall: {
      name: "冒険者ギルド・受付ホール",
      minimap: "[掲示板]  [受付]\n\n  [テーブル]\n\n      [出口]",
      npcs: [
        { id: "receptionist", name: "ギルド受付", position: { x: 0, z: -3.4 }, color: 0xd8b36b, dialogue: "reception_start" },
        { id: "veteran", name: "古参冒険者", position: { x: -3.8, z: .9 }, color: 0x8c6f4f, dialogue: "veteran_start" }
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
        { id: "priest", name: "司祭", position: { x: 0, z: -2.5 }, color: 0xc9c4ad, dialogue: "priest_start" }
      ],
      locations: [
        { id: "church_exit", name: "広場へ戻る", position: { x: 0, z: 6.3 }, targetMap: "plaza", spawn: { x: -10.5, z: -2.2 }, radius: 2.0 }
      ]
    }
  },
  dialogues: {
    traveler_start: {
      speaker: "通行人",
      lines: [
        "……お前、さっきから同じ場所を見ているな。",
        "迷子か？　ギルドなら大通りの奥だ。槍と盾の看板が出ている。",
        "ただし、夜鐘が鳴る前に済ませろ。未登録者は面倒に巻き込まれる。"
      ],
      choices: [
        { text: "礼を言ってギルドへ向かう", to: "traveler_thanks", stat: { trust: 1, knowledge: 1 }, objective: "冒険者ギルドへ向かう", done: ["wake"] },
        { text: "未登録者について聞く", to: "traveler_unregistered", stat: { caution: 1, knowledge: 1 } }
      ]
    },
    traveler_thanks: {
      speaker: "ユウジ",
      lines: [
        "ありがとうございます。",
        "……ギルド。登録制度があるなら、そこが社会への入口だ。"
      ]
    },
    traveler_unregistered: {
      speaker: "通行人",
      lines: [
        "未登録者は、税も身分も保証も曖昧だ。",
        "この街では、何者でもない奴から先に疑われる。"
      ],
      choices: [
        { text: "ギルドへ向かう", to: "traveler_thanks", objective: "冒険者ギルドへ向かう", done: ["wake"] }
      ]
    },
    guard_start: {
      speaker: "護衛隊員",
      lines: [
        "下がれ。さっき獣が出た。まだ周辺確認が終わっていない。",
        "武器も身分証もないなら、勝手に路地へ入るな。"
      ],
      choices: [
        { text: "素直に従う", to: "guard_obey", stat: { caution: 1 } },
        { text: "獣について聞く", to: "guard_beast", stat: { knowledge: 1 } }
      ]
    },
    guard_obey: {
      speaker: "ユウジ",
      lines: [
        "わかりました。",
        "逆らう理由はない。ここでは、正しさよりも生存が先だ。"
      ]
    },
    guard_beast: {
      speaker: "護衛隊員",
      lines: [
        "黒毛の噛み犬だ。普通は外門の外にいる。",
        "街中に出たなら、何かがおかしい。ギルドに報告しておけ。"
      ],
      choices: [
        { text: "ギルドへ向かう", to: "guard_obey", objective: "冒険者ギルドへ向かう" }
      ]
    },
    guild_guide_start: {
      speaker: "ギルド案内係",
      lines: [
        "登録なら中の受付へ。外で名前を書いても意味はないぞ。",
        "受付台は正面奥だ。身分証、紹介状、洗礼証明のどれかを出せ。"
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
        "冒険者登録ですか？",
        "身分証はお持ちですか。紹介状、洗礼証明、契約紋のいずれかでも構いません。",
        "……ええと、どれも無い、ということでよろしいですか。"
      ],
      choices: [
        { text: "正直に、何も持っていないと言う", to: "reception_honest", stat: { trust: 2, caution: 1 }, set: { "player.rank": "仮登録待ち" }, objective: "教会で身分保証を相談する", done: ["register"] },
        { text: "記憶が混乱しているとごまかす", to: "reception_bluff", stat: { caution: 2 }, objective: "受付の警戒を解く" }
      ]
    },
    reception_honest: {
      speaker: "ギルド受付",
      lines: [
        "正直なのは助かります。虚偽申告だと護衛隊案件になりますから。",
        "では、仮登録の審査になります。教会で未洗礼者としての確認を受けるか、保証人を立ててください。",
        "教会は広場の北西です。受付印だけ先に仮で付けておきます。"
      ],
      choices: [
        { text: "教会へ向かう", targetMap: "plaza", spawn: { x: -8.0, z: -2.2 }, objective: "教会で身分保証を相談する" }
      ]
    },
    reception_bluff: {
      speaker: "ギルド受付",
      lines: [
        "記憶の混乱、ですか。",
        "申し訳ありませんが、その場合は護衛隊への確認が必要です。後で説明が増えますよ。"
      ],
      choices: [
        { text: "やはり正直に話す", to: "reception_honest", stat: { trust: 1 }, set: { "player.rank": "仮登録待ち" }, objective: "教会で身分保証を相談する", done: ["register"] }
      ]
    },
    veteran_start: {
      speaker: "古参冒険者",
      lines: [
        "新人か。いや、まだ新人ですらない顔だな。",
        "登録できないなら、まず教会へ行け。保証がない奴は、依頼を受ける前に消える。"
      ],
      choices: [
        { text: "教会の場所を聞く", to: "veteran_church", stat: { knowledge: 1 } }
      ]
    },
    veteran_church: {
      speaker: "古参冒険者",
      lines: ["広場に戻って左手だ。鐘楼が見える。迷う方が難しい。"]
    },
    quest_board_start: {
      speaker: "依頼掲示板",
      lines: [
        "【薬草採取】外門東の草地。銅貨三枚。",
        "【荷運び補助】市場から倉庫。昼鐘まで。",
        "【黒毛の噛み犬 注意】未登録者の単独対応を禁ず。"
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
