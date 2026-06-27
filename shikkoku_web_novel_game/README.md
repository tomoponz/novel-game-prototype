# 漆黒の翼 Web Novel Prototype

アップロードされた創作資料から、まずは本文をブラウザで読めるノベルゲーム形式にした最小プロトタイプです。

## できること

- 第一話〜第四話をクリック/Enter/Spaceで読み進める
- 章末に簡単な選択肢を表示する
- HP/MP/RANK/CONTRACTのステータス欄を表示する
- ローカル保存/読込を行う
- GitHub Pagesでそのまま公開できる

## ファイル構成

```text
.
├── index.html      # 画面構造
├── style.css       # 見た目
├── game.js         # 進行・セーブ・選択肢処理
├── story.js        # 本文・分岐・ステータス初期値
└── assets/
    ├── bg/         # 背景画像を入れる場所
    ├── chara/      # 立ち絵を入れる場所
    ├── bgm/        # BGMを入れる場所
    └── se/         # 効果音を入れる場所
```

## GitHub Pagesで公開する手順

1. GitHubで新しいリポジトリを作る。例：`shikkoku-web-novel`
2. このフォルダの中身をリポジトリ直下にアップロードする。
3. GitHubのリポジトリ画面で `Settings` → `Pages` を開く。
4. `Build and deployment` の Source を `Deploy from a branch` にする。
5. Branch を `main`、Folder を `/root` にして保存する。
6. 数十秒〜数分後に `https://ユーザー名.github.io/リポジトリ名/` で開ける。

## 本文や分岐を編集する場所

`story.js` の `scenes` を編集します。

```js
"new_scene": {
  title: "新しい場面",
  speaker: "ユウジ",
  bg: "city-stone",
  lines: [
    "ここに本文を書く。",
    "クリックすると次の文に進む。"
  ],
  choices: [
    { text: "次へ", to: "next_scene" }
  ]
}
```

選択肢でステータスを変える例：

```js
{ text: "慎重に質問する", to: "next_scene", stat: { knowledge: 1, caution: 1 } }
```

## 次に追加するとよい機能

- 背景画像：`assets/bg` に画像を置き、CSSかJSで反映
- 立ち絵：キャラクター表示欄を追加
- BGM/SE：クリック時、戦闘時、通知時に再生
- 戦闘風UI：HP/MPを選択肢で増減させる
- 章ごとのファイル分割：長くなったら `story_chapter1.js` のように分ける

## 注意

GitHub Pagesで公開すると、HTML/JS内の本文は閲覧者から見えます。公開前の創作本文を守りたい場合は、まずPrivateリポジトリで管理し、公開する範囲だけをPagesに出す方が安全です。
