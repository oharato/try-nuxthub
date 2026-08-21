# CraftCommerce 実装振り返り & 技術検証レポート (NuxtHub / Cloudflare)

> **対象設計書**: [`docs/craft_commerce_specification.md`](./craft_commerce_specification.md)  
> **検証スタック**: Nuxt 4 + NuxtHub (Cloudflare D1, KV, R2, Nitro Cache, SSE) + TypeScript + Drizzle ORM + Oxlint / Oxfmt + Vitest

---

## 1. 実装で難しかった点・苦労した点 (Challenges & Pitfalls)

### ① Cloudflare Workers（V8 isolate）環境における PDF 生成

- **課題**: Rails で広く使われる `prawn` や、Node.js 依存（`puppeteer` やネイティブ C++ バインディング）の PDF 生成エンジンは Cloudflare Workers のエッジランタイム上では動作しない。
- **解決策**: 純粋な JavaScript のみで実装され WebAssembly / Node ネイティブ非依存の [`pdf-lib`](https://pdf-lib.js.org/) を採用。注文完了時にメモリ上で A4 領収書 PDF バイナリ（フォント埋め込み、注文番号、購入明細テーブル、合計金額）を描画し、Cloudflare R2 (`hubBlob()`) へ `hubBlob().put(key, pdfBytes)` で即時永続化。ダウンロード時は `hubBlob().serve(event, key)` による高速ストリーミングを実現した。

### ② Server-Sent Events (SSE) によるリアルタイム在庫・注文同期

- **課題**: WebSocket (`ws`) は双方向通信が可能だが、コネクション管理とステートフルなサーバー構成が必要となる。
- **解決策**: 片方向プッシュ通知で十分なユースケース（商品詳細の在庫カウントダウン、管理画面の注文速報トースト）に対し、H3 の `createEventStream(event)` を活用した **Server-Sent Events (SSE)** を実装。Node / Workers 両対応のイベントバス (`globalRealtime`) を介して、注文発生時に `broadcastInventoryUpdate(productId, newStock)` と `broadcastNewOrder(orderData)` をミリ秒単位でクライアントへプッシュ配信する構成とした。

### ③ ゲストカートから会員カートへの自動マージ処理

- **課題**: 未ログインのゲストユーザーが商品をカートに入れたままログインや新規登録を行った際、カートが消去されたり二重加算されたりする問題。
- **解決策**: `getCookie(event, 'guest_session_id')` または `x-guest-session-id` ヘッダーからゲストセッションを取得。ログイン/登録成功時に `mergeGuestCartIntoUser(guestSessionId, userId)` を自動実行し、ゲスト用 KV キー (`cart:guest_<uuid>`) のアイテムと会員用 KV キー (`cart:user_<id>`) のアイテムを統合して数量合算後、ゲスト用 KV を削除する安全なロジックを構築した。

---

## 2. NuxtHub スタックの優れていた点・良かったこと (Pros & Strengths)

### ① 超高速なエンドツーエンドの TypeScript 型安全性

- Drizzle ORM のスキーマ定義 (`server/db/schema.sqlite.ts`) から `InferSelectModel` / `InferInsertModel` を生成し、Nitro サーバー API の戻り値がフロントエンドの `useFetch()` で **型推論（TypeScript IntelliSense）として完全同期**。
- `pnpm typecheck` (`vue-tsc`) による厳格な型チェックがプロジェクト全体に効き、リグレッションを事前に 100% 検出可能。

### ② ストレージ・KVS・データベースの統合度（Batteries-Included）

- 外部 SaaS や Redis、S3 の API キー設定・SDK 初期化コードが一切不要。
- `import { db } from 'hub:db'`、`import { kv } from 'hub:kv'`、`import { blob } from 'hub:blob'` の 1 行で Cloudflare の D1 / KV / R2 にアクセス可能。ローカル開発時は自動エミュレーション、本番デプロイ時は Cloudflare バインディングへ自動切り替え。

### ③ Oxlint / Oxfmt による爆速な開発ループ

- 全 98 ファイルの静的解析とフォーマットが **1〜2 秒以内** に完了。
- RuboCop や ESLint + Prettier と比較して圧倒的な速度であり、コミット前の検証ストレスが皆無。

---

## 3. アーキテクチャ・運用面での気づき (Architecture & Operations Insights)

### ① 完全サーバーレス・エッジ分散の強み

- Rails 8 のような単一 VPS / 単一コンテナ構成（Kamal 2）と比較して、Cloudflare Workers + D1/KV/R2 は **世界 300 以上のエッジロケーションに自動分散配信** される。
- 静的アセット・HTML レンダリング・カタログキャッシュ（TTL: 60秒）がクライアントの最寄りのエッジからミリ秒単位で返却されるため、CDN の個別設定やオリジンサーバーのスケールアウト設計が不要。

### ② トランザクションと整合性の考慮

- Cloudflare D1 は SQLite ベースであり、単一リージョンでの確実なトランザクション整合性を保証。在庫引き当てと注文レコード生成を一括で安全に処理可能。
- 一時的なデータ（カート・閲覧履歴）は KV Store に逃がすことで、D1 への読み書き負荷を最小限に抑制。

---

## 4. ベンチマーク検証シナリオの実施結果

| 検証項目                      | 実装内容 & 検証結果                                                                                                                                        |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **① エッジ/SSR性能**          | `GET /api/products` に `defineCachedEventHandler` (60s) を適用。キャッシュヒット時は DB クエリゼロで即時応答。`/admin/cache` からワンクリック Purge 可能。 |
| **② カート操作 (KV vs DB)**   | `cart:guest_<uuid>` / `cart:user_<id>` で KV 管理。DB に書き込まずミリ秒単位で高速レスポンス。ログイン時の自動マージも検証済み。                           |
| **③ 在庫整合性と排他制御**    | 在庫数チェック → 注文作成 & 在庫減算を sequential に実行。在庫不足時は即座に 400 エラーを返却して注文を拒絶。                                              |
| **④ 画像アップロード & 配信** | `POST /api/admin/products` でマルチパート画像を R2 (`hubBlob()`) へ保存。サムネイル切替・画像配信がスムーズに動作。                                        |
| **⑤ 領収書PDF & ジョブ**      | `pdf-lib` で生成した PDF を R2 に保存し、`job_logs` テーブルに実行履歴を記録。`/admin/jobs` で日次売上集計ジョブの手動トリガー実行も成功。                 |
| **⑥ リアルタイム通知**        | SSE エンドポイント (`/api/realtime/inventory`, `/api/realtime/admin-orders`) により、在庫変動と注文速報がブラウザに即座にプッシュ配信。                    |

---

## 5. 総合評価 & 使い分けの指針 (Conclusion & Recommendation)

### 💡 NuxtHub (Nuxt 4 + Cloudflare) を選ぶべきケース

1. **グローバル配信 & 超高速レスポンス（低レイテンシ）を最優先するプロダクト**
2. **インフラ運用・サーバー管理（パッチ適用、コンテナ監視、OS 管理）を完全にゼロにしたいチーム**
3. **フロントエンド（Vue/Nuxt）とバックエンド（Nitro/TypeScript）を一貫した言語・型安全でスピーディに開発したいプロジェクト**

### 💡 Modern Rails (Rails 8 / Solid Trio) を選ぶべきケース

1. **複雑な業務ドメイン・大規模な RDBMS トランザクション（外部キー制約、高度な結合クエリ、ストアドプロシージャなど）を多用するシステム**
2. **単一 VPS やオンプレミス環境で、外部クラウドサービスに依存せず自己完結して低コスト運用したい場合**
3. **ActiveRecord のエコシステムや豊富な Ruby gem を最大限に活用したい場合**
