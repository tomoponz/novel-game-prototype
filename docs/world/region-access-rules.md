# 地域 入域条件・許可・信用・記録ルール (Region Access Rules)

関連Issue: #54(入域条件設計), #52, #53。正典の地域構成は `kingdom-overworld-plan.md`。

## 0. 設計原則

- 地域解放は**レベル制ではない**。次の組み合わせで決まる。
  - ギルド登録状態 / 商会信用(Merchant Trust) / 教会照会(churchRecord) / 学院観察(academyObs)
  - 王城行動許可(Crown Record) / 地域固有の危険度 / 章進行フラグ
- 解放判定は `progress_guard.js` のE操作ゲートと**矛盾させない**。同じ状態を参照する。
- ワールドマップUI(`world_map.js`)は本書の「解放判定(内部キー)」をそのまま実装する。

## 1. 状態の出典（既存システム）

`world_map.js` は読み取り専用で以下を参照する（書き込みはしない）。

| 内部キー | 出典 | 意味 |
|---|---|---|
| `done(id)` | `__AURELIA_DEBUG__.state.quest` | クエスト完了フラグ |
| `merchantLetter` | `items.merchantLetter`(= done("merchant") or 契約に「紹介状」) | 商会紹介状 |
| `guildApplication` | `done("guild_apply")` | ギルド仮申請 |
| `manaTested` | `done("mana_test")` | 魔力測定 |
| `provisionalRank` | `done("provisional")` or rank「F級」 | F級仮登録 |
| `fRank` | `done("mock_battle")` or rank「F級冒険者」 | 模擬戦・F級 |
| `churchRecord` | `done("church_record")` or 契約に「確認書」 | 教会照会 |
| `academyObs` | `done("academy")` or 契約に「学院」 | 学院観察対象 |
| `merchantTrust` | `state.player.trust.Merchant` | 商会信用(数値) |
| `crownRecord` | 暫定: `academyObs || trust.Crown > 0` | 王権記録/行動許可（将来正式化） |

> Crown Record(王城行動許可) は現状の第1章には正式実装がない。暫定式で扱い、満たさない地域は
> **施錠(理由表示)**のままにする。これは設計どおり（段階的解放）。

## 2. 地域別ルール

書式:
```
地域名:
管理: <勢力>
入域条件: <人間向けの条件文>
必要記録: <記録/信用>
解放判定(内部): <world_map.js が使う論理式>
travel: <fast-travel可能な実装済みmap id / なし>
備考: <注意>
```

### 中央 / 王都アウレリア（#17 4ブロックの対象）

```
王都アウレリア中心部:
管理: 王権 / ギルド / 教会 / 学院 / 商会
入域条件: 北門一時通行
必要記録: 商会紹介状 または 正式身分証
解放判定(内部): merchantLetter || done("gate")
travel: plaza
備考: 4ブロック構想の対象。王国全体ではない。中央広場と混在街路のハブ。

行政通り / 許可局窓口:
管理: 王都行政 / 記録官 / 衛兵
入域条件: 北門一時通行
必要記録: 用途別許可の案内（王城区・港湾・辺境砦など）
解放判定(内部): merchantLetter || done("gate")
travel: administrativeStreet
備考: #17 Phase 2。行政施設はまとまるが、住宅・小商店・待機列・市民生活も混在する。

王城区方面:
管理: 王権
入域条件: 王城区からの行動許可
必要記録: Crown Record
解放判定(内部): crownRecord
travel: なし（plaza内の将来区画。第5章で正式化）
備考: 監視機構・行動許可の発行元。

ギルド本部:
管理: 冒険者ギルド
入域条件: 商会紹介状
必要記録: 商会紹介状
解放判定(内部): merchantLetter
travel: guildHall
備考: 受付→測定→ギルドマスターの進行ハブ。

魔法学院（キャンパス/講義棟）:
管理: 王国学院局 / 学院教師
入域条件: ギルド仮登録 + 魔力測定異常（実績到達）
必要記録: 学院観察対象
解放判定(内部): fRank || academyObs
travel: academyCampus
備考: 王国内施設であり、独立地域ではない。

大聖堂・記録所方面:
管理: 教会
入域条件: 北門一時通行（身分照会は早期に可能）
必要記録: （照会で churchRecord を取得）
解放判定(内部): merchantLetter || done("gate")
travel: churchGrounds
備考: 身元記録・照会の中心。早期解放。

市場通り・商会方面:
管理: 商会連合
入域条件: 北門一時通行
必要記録: なし（信用が高いほど取引拡大）
解放判定(内部): done("gate") || merchantLetter
travel: なし（現状plaza内。将来分離）
備考: 盗難騒ぎイベント。第4章で南港と接続。

住宅街/路地:
管理: 王都自治 / 裏社会
入域条件: 北門一時通行
必要記録: なし
解放判定(内部): done("gate") || merchantLetter
travel: なし（plaza内）
備考: 情報屋・路地裏。
```

### 北 / 王都外

```
北門 / 森の街道:
管理: 王国軍 / 門衛
入域条件: なし（物語の開始地点）
必要記録: なし
解放判定(内部): true
travel: forestRoad
備考: 荷車襲撃。紹介状は身元証明ではなく信用の仮置き。

外門練習場:
管理: ギルド訓練局
入域条件: F級仮登録
必要記録: provisionalRank
解放判定(内部): provisionalRank
travel: trainingGround
備考: 制御査定。勝利ではなく危険度判定。

農村:
管理: 王領
入域条件: 北門一時通行
必要記録: なし
解放判定(内部): done("gate")
travel: なし（未実装）
備考: 第6章で王都外派遣の通過点。

商隊路:
管理: 商会連合
入域条件: 商会信用
必要記録: Merchant Trust >= 4
解放判定(内部): merchantTrust >= 4
travel: なし（未実装）
備考: 護衛依頼。
```

### 東 / 北東 — 学院系（王国内施設）

```
学院研究林:
管理: 学院
入域条件: 学院観察対象
必要記録: academyObs
解放判定(内部): academyObs
travel: なし（未実装）
備考: 魔素観測・素材採集。

禁書塔:
管理: 学院 / 王権
入域条件: 学院観察 + 上位許可
必要記録: academyObs + crownRecord
解放判定(内部): academyObs && crownRecord
travel: なし（未実装）
備考: 召喚・危険魔法の封印。第2/7章。

魔法実験場:
管理: 学院
入域条件: 学院観察対象
必要記録: academyObs
解放判定(内部): academyObs
travel: なし（未実装）

魔導技術工房:
管理: 学院 / 工房組合
入域条件: ギルド + 学院
必要記録: guildApplication && academyObs
解放判定(内部): guildApplication && academyObs
travel: なし（未実装）
```

### 西 — 教会領

```
教会領 / 大聖堂都市:
管理: 教会
入域条件: 北門一時通行
必要記録: なし（照会で churchRecord 取得）
解放判定(内部): done("gate") || merchantLetter
travel: churchGrounds
備考: 既存 churchGrounds に近接。

墓地:
管理: 教会
入域条件: 教会照会
必要記録: churchRecord
解放判定(内部): churchRecord
travel: なし（未実装）
備考: 召喚疑惑(第3章)。

地下記録室:
管理: 教会
入域条件: 教会照会 + 高位許可
必要記録: churchRecord + crownRecord
解放判定(内部): churchRecord && crownRecord
travel: なし（未実装）
備考: 出生・移住・洗礼の原本。第3/8章。
```

### 南 — 港

```
南港市場:
管理: 商会連合 / 港湾管理局
入域条件: 商会信用 または 通行許可
必要記録: Merchant Trust >= 3
解放判定(内部): merchantTrust >= 3
travel: なし（未実装・優先度M）
備考: 第4章の主舞台。

商会倉庫街:
管理: 商会連合
入域条件: 商会信用
必要記録: Merchant Trust >= 5
解放判定(内部): merchantTrust >= 5
travel: なし（未実装）

船着き場:
管理: 港湾管理局
入域条件: 通行許可
必要記録: crownRecord || merchantTrust >= 5
解放判定(内部): crownRecord || merchantTrust >= 5
travel: なし（未実装）
備考: 国外渡航。第8章。

外国人街:
管理: 商会 / 自治
入域条件: 商会信用 + 教会照会
必要記録: merchantTrust >= 3 && churchRecord
解放判定(内部): merchantTrust >= 3 && churchRecord
travel: なし（未実装）
```

### 南東 / 山岳 — 軍

```
辺境砦:
管理: 王国軍
入域条件: 王城区からの派遣許可
必要記録: Crown Record
解放判定(内部): crownRecord
travel: なし（未実装・優先度M）
備考: 第6章。王都外への正式派遣。

山岳街道:
管理: 王国軍
入域条件: 派遣許可
必要記録: crownRecord
解放判定(内部): crownRecord
travel: なし（未実装）

国境監視塔:
管理: 王国軍
入域条件: Crown Record
必要記録: crownRecord
解放判定(内部): crownRecord
travel: なし（未実装）

軍駐屯地:
管理: 王国軍
入域条件: Crown Record
必要記録: crownRecord
解放判定(内部): crownRecord
travel: なし（未実装）
```

### 外縁 — 危険地帯（立入許可必須）

```
古代遺跡群:
管理: 王権 / 学院 / 教会 の共同封鎖
入域条件: 高危険度調査許可
必要記録: 学院観察 + 王権許可 + 教会照会
解放判定(内部): academyObs && crownRecord && churchRecord
travel: なし（未実装・第7章）
備考: 世界外魔法の痕跡。

呪われた森:
管理: 共同封鎖
入域条件: 高危険度調査許可
必要記録: academyObs && crownRecord
解放判定(内部): academyObs && crownRecord
travel: なし（未実装）

魔獣沼地:
管理: 共同封鎖
入域条件: 調査許可
必要記録: academyObs || crownRecord
解放判定(内部): academyObs || crownRecord
travel: なし（未実装）

召喚関連遺構:
管理: 王権 / 学院 / 教会
入域条件: 全照会 + 章8フラグ
必要記録: academyObs && crownRecord && churchRecord（+ 章8）
解放判定(内部): academyObs && crownRecord && churchRecord
travel: なし（未実装・第8章）
備考: 主人公の召喚の秘密に直結。
```

## 3. 4ブロック構想との関係

本書の「中央」「北」「東」「西」などは、ワールドマップ上の見つけやすさと管理情報を整理するための見出しである。
王都アウレリア中心部を思想別・勢力別の4地区へ分割する意味ではない。

#17の4ブロック構想は、王都中心部を約4倍規模へ段階拡張する制作単位である。
行政通りの近くにも住宅や小商店があり、学院・教会方面にも一般市民の生活が混ざる。

## 4. 施錠時の表示

未解放地域は**移動不可**にし、`world_map.js` は「必要記録」を理由として表示する。
例: 「未解放: 商会信用(Merchant Trust 3以上) が必要」「未解放: 王城区からの行動許可(Crown Record) が必要」。
