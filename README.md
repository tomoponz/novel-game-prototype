# Novel Game Prototype

ブラウザで動くThree.js製の3D探索型ノベルRPG試作です。佐藤雄二が森の街道で目覚め、荷車襲撃、商人救助、王都アウレリア入城、ギルド登録申請、魔力測定、F級仮登録、外門練習場、翌日の模擬戦勝利まで進められます。中世ヨーロッパ風の城下町を、社会制度（ギルド・紹介状・身分・教会・門番・市場・信用・ランク）に沿って探索します。王都アウレリアは、丘の上の王城を頂点に、斜面と平地へ赤茶の屋根の家々が密集する、明るいアニメ調の丘陵型城郭都市です。

物語の軸は「強さ」ではなく**信用（クレジット）・身分・記録**です。主人公は未契約の異物として街に放り込まれ、紹介状・登録・受洗・推薦といった**社会的手続き**を一段ずつ積んで居場所を得ていきます。明るいアニメ調のビジュアルと、地に足のついた社会リアリズムの文章を同居させています。

CDNの[three.js](https://threejs.org/) (r160) のみで動作し、追加アセットなしで全ての建物・人物・小物をプリミティブから組み立てています。GitHub Pagesでそのまま公開できます。

世界観・経済・地理・魔法制度・キャラクター設定は [`docs/world/`](docs/world/) に設計ノートとしてまとめています（economy / geography / magic-system / society-and-story / anime-art-spec）。

## 現在できること

- タイトル画面から開始
- 王都へ続く森の街道（土の街道＋草地、並木、岩）から開始
- 黒毛の噛み犬に襲われた荷車イベント
- ファイアボールまたは囮行動で商人を助ける分岐
- 北門検問から王都アウレリアへ入城
- 丘陵型の巨大王都アウレリアを探索（石畳の大通り・踏み固めた土の街区・草地の郊外）
- 丘の上にそびえる王城と、斜面を埋める段々の住宅群（遠景でも大都市が一望できる）
- 大通り沿いに連続して建ち並ぶ、白〜ベージュ壁＋赤茶屋根のアニメ調の家並み（道に正面を向ける）
- 城壁、北門、中央広場（噴水・花壇・ベンチ・広場を囲む高層商店）、王城、ギルド、教会、市場、職人区、貴族街、スラム、怪しい路地裏、外門練習場
- 重要建物（ギルド・教会・鍛冶屋など）は木組み柱・煙突・吊り看板・光る窓付きの作り込み
- 市場通りに天幕屋台が密集し、商人・通行人・馬車が行き交う
- 街路沿いに街灯・樽・木箱・ベンチ・花壇・井戸・篝火を配置
- 冒険者ギルド内部に受付、魔力測定水晶、ギルドマスター、依頼掲示板、木の床、灯り
- 魔力測定で水晶に細かい亀裂が走るイベント
- F級仮登録イベント → 外門練習場へ誘導
- 外門練習場で火球試射、翌日の模擬戦、勝利でランクが `F級冒険者` へ変化
- 通行人・商人・冒険者・信徒・衛兵・馬車が経路を巡回
- 完了済みイベントは自動で「後日談」会話に切り替わり、同じ会話・同じ火球イベントを繰り返さない
- 1人称／3人称の切替
- 1人称で照準方向に火球を撃つアクション（手元から発射・発光・着弾爆発・カメラ揺れ・ヒットストップ）
- MP消費、クールタイムUI
- DualShock 4 / 標準Gamepad API対応
- Debug Flyによる空中浮遊・高速移動・当たり判定無視

### 今回（第一章拡張）で追加

- **アニメ調の人物モデル**：大きめの頭・大きな瞳・尖りあご・髪のシルエット（前髪/横髪/後ろ髪/お団子/ボサ髪/フード）。受付・冒険者・衛兵・商人・信徒・スラム住人・貴族の使用人・学院生・教師など**職種ごとに衣装と装備が違い**、肌・髪・身長が個体差を持つ
- **王立魔法学院**を追加：街の目立つ校舎（塔・幟・看板）＋内部マップ（教師・学院生・魔素可視化の魔導具・書架・講義席）。主人公の「水晶ヒビ／無属性の短詠唱」という魔力異常に教師が反応し、推薦・学費・観察を語る
- **商店街**：石畳の通りに**武器屋・防具屋・薬屋・魔法具店・宿屋(曲がった匙亭)・酒場・記録所・パン屋**が看板付きで並び、各店に話せる店主NPC。**宿屋は内部マップに入れる**（女将マルタ・客・酔っ払い）
- **名前のあるNPCと、接地した会話**：エドリック・ヴェイン（商会／封蝋付き紹介状＝借りは利息）、ガラン・ホルト（護衛／目立つと狙われる）、ブラム・ガーランド（門・規約）、リサ・フェン（受付）、ギルドマスター・ヴォルク、各店主・通行人
- **信用（Trust）システム**：ギルド／教会／王権／商会の機関別の信用をHUDに表示。物語の選択が機関別の信用を増やす（戦闘の強さではなく**社会的正統性**が進行の軸）
- **時間帯システム**：朝／昼／夕方／夜で空・光・窓明かりが変化。夜は街灯・窓・篝火が映え、HUDに時間帯を表示（`T`キー or 自動進行）
- 模擬戦の後、ギルドマスターの推薦で**魔法学院への導線**が開く

## 進行ルート

```text
Start → 森の街道 → 荷車襲撃で商人救助（封蝋付き紹介状） → 北門検問
→ 王都中央広場 → 冒険者ギルド → 受付で登録申請 → 魔力測定水晶 → 水晶に亀裂
→ ギルドマスター面談 → F級仮登録 → 外門練習場 → 火球試射
→ 翌日の模擬戦 → F級冒険者 → 魔法学院への招待（推薦・聴講相談）
```

各段階は「信用・身分・記録」を一段ずつ獲得する**クレジット・ラダー**として設計されています（詳細は [`docs/world/society-and-story.md`](docs/world/society-and-story.md)）。

イベント進行は `game_world.js` の `PROGRESS` テーブル（基準会話ID → 完了クエスト → 完了後会話）で一元管理しています。完了済みイベントは自動で後日談へ切り替わり、二重発生しません。

## 操作

### キーボード / マウス

| 操作 | 内容 |
|---|---|
| W / A / S / D | 視点方向を基準に移動 |
| Shift | ダッシュ |
| 矢印キー | 視点操作 |
| マウスドラッグ | 視点操作 |
| F | 1人称 / 3人称切替 |
| E | 近くのNPCに話しかける / 建物に入る |
| J | 火球 |
| K | 回避 |
| L | 強火球 |
| F3 / ` | Debug Fly切替 |
| Space / Ctrl | Debug Fly中の上昇 / 下降 |
| T | 時間帯を進める（朝→昼→夕方→夜） |
| 1〜9 | ホットバーのスロット選択 |
| Enter / Space | 会話を進める |
| Esc | 会話中：会話を閉じる／通常時：メニュー開閉 |

### 画面UI

- プレイ中は画面下部の**ブロックRPG風HUD**（HPハート・MP・スタミナ・9スロットのホットバー）と、上部の最小限の目的表示のみ。3D画面を覆う旧グラスモーフィズムパネルは廃止。
- `Esc`でメニュー（Status / Objective / Quest / Map / Controls / System）を開閉。詳細ステータス・クエスト・簡易マップ・画質(QUALITY)・効果音ON/OFFはメニュー内。

### DualShock 4 / Gamepad

| 入力 | 内容 |
|---|---|
| 左スティック | 移動 |
| 右スティック | 視点 |
| R2 | ダッシュ |
| □ | 通常魔法 / 火球 |
| △ | 強魔法 / 強火球 |
| ○ | 回避 / 会話を閉じる |
| × | 会話 / 決定 |
| OPTIONS / R3 | 1人称 / 3人称切替 |
| 会話中の上下 / 十字キー | 選択肢の移動 |

※ ブラウザ・OS・接続方式によりボタン番号がずれる場合があります。

## URLパラメータ

| パラメータ | 内容 |
|---|---|
| `?render=low` | 解像度・表示密度を抑えて軽くする |
| `?render=medium` | 既定。見た目と軽さのバランス |
| `?render=high` | 高密度・高解像度寄り |
| `?quality=low` | `?render=low` と同じ軽量表示。`quality` がある場合は `render` より優先 |
| `?map=plaza` | 王都アウレリア城下町から開始 |
| `?map=guildHall` | 冒険者ギルド内部から開始 |
| `?map=academy` | 王立魔法学院 講義棟（内部）から開始 |
| `?map=academyCampus` | 王立魔法学院 キャンパス（正門・中庭・塔・練習場）から開始 |
| `?map=inn` | 宿屋「曲がった匙亭」内部から開始 |
| `?map=marketLodgingStreet` | 市場通り・宿屋周辺の生活道路から開始 |
| `?map=trainingGround` | 外門練習場から開始 |
| `?map=church` | 教会記録所（内部）から開始 |
| `?map=churchGrounds` | 大聖堂前庭（双塔・庭園・記録所）から開始 |
| `?time=morning\|day\|evening\|night` | 開始時の時間帯を固定（自動進行を止める） |
| `?debug=1` | Debug Fly有効状態で開始（当たり判定無視・遠景カリング無効） |

例：`?map=plaza&render=low` で拡張王都を軽量表示。`?quality=low` も互換パラメータとして利用できます。パラメータは組み合わせ可能です。

### デバッグ用コンソールAPI

ブラウザのコンソールから `window.__AURELIA_DEBUG__` で以下が使えます。

- `quests()` … クエスト進行の一覧
- `jump(map, x, z)` … 任意マップ・座標へ移動
- `complete(...ids)` … クエストIDを完了扱いにする
- `resolve(dialogueId)` … 進行状態に応じた会話IDを確認
- `cast(mode)` … 火球（`"fire"` / `"burst"`）を発射
- `fx()` … 飛翔中の火球・爆発の数を確認
- `items()` … 進行から導出した所持/許可（紹介状・登録・仮登録・F級・学院推薦 等）
- `movers()` … 歩行者/荷車の総数・種別・詰まり数・サンプル座標

また `window.__AURELIA_MINIMAP__()` で現在地（map / x / z / yaw / objective / items / active）を読み取り専用で取得できます（`next_destination.js` のミニマップが利用）。

## 技術メモ（描画・性能）

- 大量の一般住宅・丘の住宅群は `InstancedMesh`（本体＋屋根＋ファサードの3バッチ）で描画。数千軒を数ドローコールで処理し、密度を上げつつ高速化
- 近景の重要建物（ギルド・教会・鍛冶屋・広場の商店）は詳細メッシュ、遠景はインスタンスの簡易モデル、と使い分け
- ジオメトリ・マテリアル・Canvasテクスチャをキャッシュ再利用（人物パーツ・小物・屋根プリズムなど）
- 地面・道路・床は手続き生成のCanvasテクスチャ（石畳・土・草・石・板）をタイル表示
- 静的メッシュは行列の自動更新を停止し、毎フレームの計算負荷を削減
- プレイヤー周辺のみ描画する距離カリング（品質設定で範囲を調整）。`render=low/medium/high` と `quality=low/medium/high` で住宅・小物・NPC密度を調整
- 静的colliderはspatial gridで近傍だけを参照し、動く通行人・馬車は別枠で判定
- 通行人・馬車の巡回更新は距離カリング範囲内を優先し、遠距離ではアニメーション更新を抑制
- 影は王城・ギルド・教会・主要NPC・馬車などを優先し、小物や遠景の影を品質設定に応じて抑制
- 建物・城壁・木・岩・馬車・屋台・樽・井戸・ベンチ・篝火に当たり判定（回転建物は回転AABB）。軸ごとの判定で壁沿いに滑れる
- 通常移動は `10.0`、ダッシュは `19.0` に調整。Debug Fly の速度は既存値を維持
- 王都マップで115〜120fps前後（デスクトップ・ヘッドレスWebGL計測。インスタンス化前の旧版は約90fps）

## 現在の制限

- CDNからthree.jsを読み込むため、オフラインでは動作しません
- 戦闘は火球の試射・模擬戦の演出のみ（敵AI・敵HP・ロックオンは未実装）
- セーブ／ロード、BGM／環境音は未実装
- 室内は受付・水晶・祭壇など最小限の配置
- DualShock 4のボタン番号は環境依存

## 次に追加したいこと

- ギルドマスター面談後の初依頼クエスト
- 路地裏での初戦闘（敵HP・ロックオン・被弾）
- 宿屋での夜イベント、宿屋・鍛冶屋・薬草屋・食堂の室内化
- 火球以外の魔法・スキル切替（L1 / R1）
- BGM／環境音、セーブ／ロード
- インスタンス住宅の地域別チャンク分割によるフラスタムカリング強化
- 王城への登坂ルート開放と城内マップ
- VRM / glTFモデルの読み込み

## External asset notes

- Short Kenney CC0 SE are copied into `assets/audio/se/` and played after the
  user starts or otherwise interacts with the page.
- Current SE hooks cover Start, dialogue advance, choice decide, dialogue
  cancel, map transitions, fireball cast/hit, mana crystal cracking, and Trust
  increases.
- BGM and full player/monster model replacement are not implemented.
- Audio credits are recorded in `docs/assets/audio-credits.md`.
- Character outfit candidates are recorded in `docs/assets/model-candidates.md`.
- Human NPCs use a small Quaternius CC0 glTF pool where safe. Named/fixed NPCs
  are prioritized; general crowds and pedestrians fall back to primitive models
  when the Low/Medium/High model budget is exhausted.
- Runtime model files are kept to the prepared `guild_receptionist/` and
  `male_common/` subsets to avoid copying large texture-heavy source folders.

## Quick city polish notes

- Aurelia's ordinary buildings now use richer facade texture detail plus
  low-cost instanced roof ridges, chimneys, awnings, and balcony-like trims.
- A few narrow visual alleys were added around existing city spaces without a
  full layout rewrite.
- Time-of-day changes now interpolate sky, fog, and key lights over a few
  seconds instead of snapping instantly.
- Future Aurelia scale and layout issues are tracked in
  `docs/world/aurelia-master-plan.md` and `docs/world/city-layout-issues.md`.

## Chapter 1 gameplay polish notes

- The caravan attack now requires hitting the black bite-hound with an existing
  fireball before the merchant rescue, letter, and north-gate progression are
  granted.
- The merchant letter / guild status are surfaced through the status panel,
  current objective, and hotbar labels.
- MP now recovers slowly up to max MP; stamina recovery behavior remains tied
  to non-dashing movement/idle states.
- Pedestrians and carts now check nearby static colliders while moving and try
  a small sidestep or route advance when blocked. This is a lightweight guard,
  not full pathfinding.
- glTF NPC fallback/budget behavior, `render=low`, SE, Trust, time of day, and
  existing map transitions are preserved.

## Open gameplay issues notes (#10–#17)

Branch `feature/resolve-open-gameplay-issues-20260629` advances open issues
#10–#17. Per-issue status is tracked in
`docs/world/city-layout-issues.md` (Implemented / Partially implemented table).

- #10 Minimap: official read-only `window.__AURELIA_MINIMAP__` API; the minimap
  now uses the exact player position instead of a camera-based approximation.
- #11 Progression: derived `player.items` permit object (merchant letter / guild
  application / mana test / provisional / F-rank / academy recommendation),
  surfaced in the hotbar; `progress_guard.js` gates verified against the quest
  chain.
- #12 Caravan: a pulsing `⚠ TARGET` marker sits over the bite-hound, hit radius
  is slightly more forgiving, and the rescue still cannot be completed by
  dialogue alone.
- #13 Movers: a stuck-counter forces a re-route so pedestrians/carts cannot
  grind a wall forever; `__AURELIA_DEBUG__.movers()` added. Still collider-based.
- #14 T-pose: idle-animation infrastructure is in place but the current CC0
  assets contain no clips, so the T-pose remains until authored idle GLBs are
  supplied (see `docs/assets/model-credits.md`).
- #15 `academyCampus` and #16 `churchGrounds`: new lightweight outdoor maps that
  link the plaza to the existing academy/church interiors.
- #17 Capital scale expansion: the four-block plan is defined as a staged
  production unit for expanding central Aurelia to roughly 4x scale, not as four
  themed/factional districts. Phase 1 adds central-plaza street cues; Phase 2
  adds `administrativeStreet` with the permit bureau, records window, guard
  post, homes, stalls, and waiting citizens; Phase 3 adds
  `marketLodgingStreet` as a light market/inn/residential connector to
  `inn`, `merchantOffice`, and `backstreet`; see
  `docs/world/capital-scale-expansion-plan.md`.
- #49/#50/#51 Facility expansion resolution: the merchant office, north gate
  post, and residential/backstreet scope are summarized in
  `docs/world/facility-expansion-issue-resolution.md`.

## World planning issue notes (#52–#55)

- #52 Overworld plan: `docs/world/kingdom-overworld-plan.md` defines the
  Magitech Kingdom, major regions, controlling institutions, access conditions,
  chapter fit, and implementation priority.
- #53 World map UI: `world_map.js` provides a lightweight O-key kingdom map with
  region cards, unlock state, missing-record reasons, and travel only to
  implemented maps.
- #54 Region access rules: `docs/world/region-access-rules.md` maps major
  regions to permit/trust/record conditions and keeps the four-block plan scoped
  to Aurelia's central city expansion.
- #55 Long-term roadmap: `docs/story/long-term-roadmap.md` outlines chapters 1
  through 8+ without treating the academy as the kingdom itself or implementing
  all future regions at once.
