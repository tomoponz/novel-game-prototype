# Asset hosting strategy

この文書は、`novel-game-prototype` で3Dモデル、テクスチャ、音声、BGMなどのアセットが増えた場合の配置方針を整理するものです。

現時点ではGitHub Pagesだけで動く軽量構成を維持する。ただし、将来的に外部モデルやBGMが増えた場合、GitHubリポジトリへ大容量バイナリを詰め込みすぎない。

---

## 1. 基本方針

| 種別 | 配置方針 |
|---|---|
| HTML / CSS / JS | GitHub repository / GitHub Pages |
| docs / JSON設定 | GitHub repository |
| 小さい効果音 | GitHub repositoryでも可 |
| 小さいglTF/GLB | 当面はGitHub repositoryでも可 |
| 大きい地形GLB | 外部CDN候補 |
| 高解像度テクスチャ | 外部CDN候補 |
| BGM / 長い音声 | 外部CDN候補 |
| 動画 | GitHub repositoryに置かない |

---

## 2. GitHubに置いてよいもの

当面、以下はGitHubに置いてよい。

- 軽量なUI画像
- 小さいSE
- 数MB程度のglTF/GLB
- READMEやworld docs
- 設定JSON
- プレースホルダー用モデル

ただし、次の条件に近づいたら外部配信を検討する。

- 1ファイルが50MBに近い
- repository全体が1GBに近い
- `assets/` が肥大化してcloneが重い
- GitHub Pagesのロードが遅い
- 同じアセットを何度も差し替えて履歴が太る

---

## 3. 外部CDNを検討するもの

将来的に以下を追加する場合、GitHubではなく外部CDNを検討する。

- 王都全体の巨大地形GLB
- 大聖堂・学院キャンパスの高密度モデル
- 高解像度テクスチャアトラス
- 長尺BGM
- キャラクターアニメーション大量セット
- 動画演出

候補:

- Cloudflare R2
- Cloudflare Pages + R2
- Firebase Storage
- AWS S3 + CloudFront
- Vercel Blob

優先候補は、転送料金の扱いが比較的有利なCloudflare R2。

---

## 4. パス設計

コード側では、将来的にアセットのbase URLを差し替えられるようにする。

例:

```js
const ASSET_BASE_URL = window.ASSET_BASE_URL || "./assets/";
```

これにより、開発中はGitHub内の相対パス、本番ではCDNの絶対パスへ移行しやすい。

```js
loadModel(ASSET_BASE_URL + "models/characters/guild_receptionist/model.glb");
```

---

## 5. 直近の実装方針

今すぐ外部CDNへ移行しない。

理由:

- 現在のプロトタイプはGitHub Pagesでそのまま確認できることが重要
- アセット数はまだ管理可能
- Cloudflare R2などの運用を始めると、開発手順が複雑になる
- まずゲーム体験の核を作る方が優先

直近では、以下を守る。

- 追加モデルは小さくする
- 同じ役割のNPCは共有モデルを使う
- BGMはまだ入れすぎない
- 大型モデルを入れる前にdocsへ記録する
- `docs/assets/model-credits.md` を更新する

---

## 6. 将来の移行ステップ

1. `ASSET_BASE_URL` を導入
2. GitHub内とCDN上の両方で動くパスに整理
3. 大容量モデルだけCDNへ逃がす
4. model manifestを作る
5. ロード失敗時はprimitive fallbackを使う
6. 画質モードごとに読み込むモデル解像度を切り替える

---

## 7. 禁止・注意事項

- 動画や巨大音声をGitHubに直接置かない
- 100MB近いファイルを入れない
- 大型バイナリを何度も差し替えない
- Git LFSを公開Webゲームの配信用CDNとして当てにしない
- 外部アセットはライセンスとクレジットを必ず記録する

