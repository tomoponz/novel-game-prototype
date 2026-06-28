# Architecture docs

このディレクトリは、`novel-game-prototype` の長期的な技術方針をまとめる場所です。

## Documents

- [Open-world technical roadmap](open-world-roadmap.md)
  - Three.js中心の軽量オープンワールド化方針
  - DOM UIとWebGL探索のレイヤード設計
  - 短期・中期・長期の実装順
  - three-mesh-bvh、ポストプロセス、球体世界の扱い

- [Asset hosting strategy](asset-hosting-strategy.md)
  - GitHubに置くもの / 外部CDNへ逃がすもの
  - 大容量アセットの扱い
  - Cloudflare R2等への将来移行方針
  - `ASSET_BASE_URL` 導入の候補

## Current stance

現時点では、王都アウレリアを平面ベースのThree.js探索マップとして育てる。

短期的には以下を優先する。

1. 馬車襲撃イベントの火球アクション化
2. 進行ガードの強化
3. 主要施設の別マップ化
4. NPC/馬車のすり抜け改善
5. アセット肥大化対策

球体世界、three-mesh-bvh、G-Bufferアウトラインは、すぐに本編へ入れず、必要になった段階で別PRまたは実験プロトタイプとして検証する。
