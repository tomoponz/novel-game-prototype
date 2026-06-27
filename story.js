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
  npcs: [
    {
      id: "traveler",
      name: "通行人",
      position: { x: -3.8, z: 2.2 },
      color: 0x7f9fbd,
      dialogue: "traveler_start"
    },
    {
      id: "guard",
      name: "護衛隊員",
      position: { x: 4.2, z: 1.1 },
      color: 0xb77954,
      dialogue: "guard_start"
    },
    {
      id: "receptionist",
      name: "ギルド受付",
      position: { x: .2, z: -7.8 },
      color: 0xd8b36b,
      dialogue: "reception_start"
    }
  ],
  dialogues: {
    traveler_start: {
      speaker: "通行人",
      lines: [
        "……お前、さっきから同じ場所を見ているな。",
        "迷子か？　ギルドなら大通りの奥だ。槍と盾の看板が出ている。",
        "ただし、夜鐘が鳴る前に済ませろ。未登録者は面倒に巻き込まれる。"
      ],
      choices: [
        {
          text: "礼を言ってギルドへ向かう",
          to: "traveler_thanks",
          stat: { trust: 1, knowledge: 1 },
          objective: "冒険者ギルドへ向かう"
        },
        {
          text: "未登録者について聞く",
          to: "traveler_unregistered",
          stat: { caution: 1, knowledge: 1 }
        }
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
        {
          text: "ギルドへ向かう",
          to: "traveler_thanks",
          objective: "冒険者ギルドへ向かう"
        }
      ]
    },
    guard_start: {
      speaker: "護衛隊員",
      lines: [
        "下がれ。さっき獣が出た。まだ周辺確認が終わっていない。",
        "武器も身分証もないなら、勝手に路地へ入るな。"
      ],
      choices: [
        {
          text: "素直に従う",
          to: "guard_obey",
          stat: { caution: 1 }
        },
        {
          text: "獣について聞く",
          to: "guard_beast",
          stat: { knowledge: 1 }
        }
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
        "街中に出たなら、何かがおかしい。"
      ]
    },
    reception_start: {
      speaker: "ギルド受付",
      lines: [
        "冒険者登録ですか？",
        "……身分証はお持ちですか。紹介状、洗礼証明、契約紋のいずれかでも構いません。"
      ],
      choices: [
        {
          text: "正直に、何も持っていないと言う",
          to: "reception_honest",
          stat: { trust: 2, caution: 1 },
          set: { "player.rank": "仮登録待ち" },
          objective: "身分保証の方法を探す"
        },
        {
          text: "記憶が混乱しているとごまかす",
          to: "reception_bluff",
          stat: { caution: 2 },
          objective: "受付の警戒を解く"
        }
      ]
    },
    reception_honest: {
      speaker: "ギルド受付",
      lines: [
        "……正直なのは助かります。",
        "では、仮登録の審査になります。教会で洗礼記録を確認するか、保証人を立ててください。"
      ]
    },
    reception_bluff: {
      speaker: "ギルド受付",
      lines: [
        "記憶の混乱、ですか。",
        "申し訳ありませんが、その場合は護衛隊への確認が必要です。"
      ]
    }
  }
};
