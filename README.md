# 🚀 try-nuxthub: CraftCommerce on Nuxt 4, TypeScript & Cloudflare Workers

> **Nuxt 4 + NuxtHub + TypeScript + Oxlint / Oxfmt で構築された実践的モダンECプラットフォーム「CraftCommerce」**  
> Cloudflare Workers のエッジインフラ（D1, KV, R2, Cache, SSE）をフル活用し、Ruby on Rails のような「設定不要・オールインワン（Batteries-Included）」な開発体験を実現したリファレンス実装です。

---

## 🎯 Rails との技術スタック対応表

| 機能 / レイヤー          | Ruby on Rails (Rails 8)           | Nuxt 4 + NuxtHub + Cloudflare                            |
| :----------------------- | :-------------------------------- | :------------------------------------------------------- |
| **フレームワーク**       | Rails 8                           | **Nuxt 4 (Vue 3 + Nitro)**                               |
| **データベース (ORM)**   | ActiveRecord + SQLite3/PostgreSQL | **Cloudflare D1 (SQLite) + Drizzle ORM** (`hub:db`)      |
| **認証 (Session)**       | Devise / Session Cookie           | **暗号化 Cookie (Sealed Session)** (`nuxt-auth-utils`)   |
| **マイグレーション**     | `db/migrate` / `rails db:migrate` | `server/db/migrations` / `pnpm db:generate`              |
| **ファイル / メディア**  | ActiveStorage (S3 / Local)        | **Cloudflare R2 (Blob Storage)** (`hub:blob`)            |
| **KVS / 一時カート**     | `Solid Cache` / Redis             | **Cloudflare KV** (`hub:kv`)                             |
| **カタログキャッシュ**   | `Rails.cache.fetch`               | **Nitro Cache** (`defineCachedEventHandler` / Purge API) |
| **リアルタイム同期**     | `Solid Cable` + Turbo Streams     | **Server-Sent Events (SSE)** (`createEventStream`)       |
| **帳票 (PDF) 生成**      | `prawn` gem                       | **`pdf-lib`** (Workers 互換・純粋 JS PDF レンダラ)       |
| **Linter / Formatter**   | RuboCop                           | **Oxlint / Oxfmt** (Rust製 超高速ツール)                 |
| **テストフレームワーク** | Minitest / RSpec                  | **Vitest + @nuxt/test-utils**                            |
| **インフラ管理 (IaC)**   | Kamal 2 (VPS) / Terraform         | **Pulumi (TypeScript)** (`infra/`)                       |

---

## 🛍️ CraftCommerce の主な機能と画面

### 1. 顧客向け機能 (Customer Frontend)

- 🏠 **トップページ (`/`)**: 特集バナー、おすすめ作品、新着コレクション、技術ハイライト、最近チェックした商品カルーセル
- 📦 **商品カタログ (`/products`)**: カテゴリ絞り込み、キーワード検索、価格/新着ソート、エッジキャッシュ（60秒）
- 🔍 **商品詳細 (`/products/:slug`)**: 複数画像ギャラリー、**リアルタイム在庫同期 (SSE)**、星評価レビュー一覧 & 投稿フォーム
- 🛒 **ショッピングカート (`/cart`)**: **Cloudflare KV** による高速カート管理（数量変更、削除、小計計算）
- 💳 **チェックアウト (`/checkout`)**: 配送先入力、モック決済シミュレーション、安全な在庫引き当て
- 🎉 **注文完了 (`/orders/:id/complete`)**: 注文番号表示、**領収書PDFダウンロード** (`pdf-lib` + R2)
- 👤 **注文履歴 (`/mypage/orders`)**: 過去の注文明細と領収書PDF再ダウンロード
- 🔐 **認証 (`/login`, `/signup`)**: 暗号化Cookieセッション、**ゲストカートから会員カートへの自動マージ**

### 2. 管理者向け機能 (Admin Backoffice)

- 📊 **売上ダッシュボード (`/admin`)**: 売上総額・注文件数・在庫僅少アラート、**リアルタイム注文速報トースト (SSE)**
- 🏷️ **商品管理 (`/admin/products`)**: 商品一覧、在庫の即時増減 (+/-) とリアルタイムブロードキャスト連動、公開トグル
- ➕ **商品新規登録 (`/admin/products/new`)**: **Cloudflare R2** への複数画像ドラッグ＆ドロップアップロード、カテゴリ選択
- 📑 **注文管理 (`/admin/orders`)**: 全注文一覧、発送ステータス更新 (`PAID` → `SHIPPED`)、領収書PDF確認
- ⚙️ **ジョブ監視 (`/admin/jobs`)**: `JobLog` 履歴閲覧、日次売上集計バッチの手動トリガー実行
- ⚡ **キャッシュ管理 (`/admin/cache`)**: カタログキャッシュステータス確認、ワンクリック Purge

---

## 🔑 検証用シードアカウント

開発サーバー起動時に自動でシードデータ（5カテゴリ・8商品・サンプル画像・レビュー）が登録されます。

| アカウント種別          | メールアドレス      | パスワード    | 権限・用途                             |
| :---------------------- | :------------------ | :------------ | :------------------------------------- |
| **管理者 (Admin)**      | `admin@example.com` | `password123` | 管理画面 (`/admin/*`) へのフルアクセス |
| **一般会員 (Customer)** | `user@example.com`  | `password123` | 商品購入、注文履歴、レビュー投稿       |

---

## ⚡ クイックスタート

### 1. インストール & 開発サーバー起動

```bash
pnpm install
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと、CraftCommerce のトップページが表示されます。

### 2. Nuxt DevTools (Hub UI)

ブラウザで `Shift + Alt + D` を押すと **Nuxt DevTools** が開きます。  
**「Hub」** タブから、ローカルの D1 データベース、KV ストア、Blob ストレージを直接閲覧・編集できます。

---

## 🛠️ コマンド一覧

### 💻 開発・ビルド

```bash
pnpm dev             # ローカル開発サーバー起動 (D1/KV/R2 自動エミュレート)
pnpm build           # 本番用ビルド (.output 生成)
pnpm generate        # 静的サイト生成 (SSG)
pnpm preview         # Cloudflare Pages エミュレータでプレビュー
```

### 🧹 コード品質・テスト

```bash
pnpm lint            # Oxlint による超高速静的解析
pnpm lint:fix        # Oxlint による静的解析と自動修正
pnpm format          # Oxfmt によるコード全体の高速自動整形
pnpm typecheck       # vue-tsc による TypeScript 型チェック
pnpm test            # Vitest + @nuxt/test-utils による単体・統合テスト実行
pnpm check           # 一括検証: format + lint + typecheck + test + build
pnpm check:fix       # 一括修正 & 検証
```

### 🗄️ データベース (D1 / Drizzle)

```bash
pnpm db:generate     # スキーマ変更からマイグレーション SQL を自動生成
pnpm db:migrate:prod # 本番 Cloudflare D1 データベースへマイグレーション適用
```

### ☁️ インフラ (Pulumi) & デプロイ

```bash
pnpm infra:preview   # Pulumi による Cloudflare リソース事前確認
pnpm infra:apply     # Cloudflare リソースの作成・更新
pnpm deploy:cf       # Cloudflare Pages への本番デプロイ
```

---

## 📖 関連ドキュメント

- 📋 **[CraftCommerce 要件・設計仕様書 (docs/craft_commerce_specification.md)](./docs/craft_commerce_specification.md)**
- 📝 **[実装振り返り & 技術検証レポート (docs/IMPLEMENTATION_REPORT.md)](./docs/IMPLEMENTATION_REPORT.md)**
- 📘 **[チュートリアル & 開発ガイド (docs/TUTORIAL.md)](./docs/TUTORIAL.md)**
- 🔐 **[暗号化 Cookie 認証ガイド (docs/AUTH.md)](./docs/AUTH.md)**
- ⚡ **[CI/CD & デプロイ高速化ガイド (docs/ci-optimization.md)](./docs/ci-optimization.md)**
