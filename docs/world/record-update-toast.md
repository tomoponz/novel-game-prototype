# Record update toast

Issue #35 の第一段階として、主要クエスト完了時に `RECORD UPDATED` 通知を表示する軽量UIを追加する。

## 方針

`game_world.js` の進行フラグ本体には触れず、`record_update_toast.js` と `record_update_toast.css` で外付けの通知UIを表示する。

## 監視対象

- `merchant`
- `gate`
- `guild_apply`
- `mana_test`
- `provisional`
- `training`
- `mock_battle`
- `academy`

## 追加される体験

イベント完了時に、主人公の状態が王都側に記録されたことを短く通知する。

例:

- `商会紹介状`: 商人救助が記録され、北門一時通行の根拠が発生した。
- `魔力測定`: 未登録波形として、ギルド記録へ送付された。
- `模擬戦査定`: 危険度判定として、学院・教会・王権へ共有される可能性が生じた。

## 制限

- 既存の進行フラグは変更しない
- `game_world.js` は触らない
- stateの読み取りのみ
- pollingは700ms間隔の軽量処理
- 初回読み込み時点で完了済みのクエストには通知を出さない

## 今後の候補

- 通知履歴を許可証・信用台帳UIに統合する
- 重要度別に色や音を変える
- 進行フラグ更新時に正式イベントとして発火する形へClaude側で統合する
