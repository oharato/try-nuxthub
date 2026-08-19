# 🚀 try-nuxthub: Rails-like DX on Nuxt 4, TypeScript & Cloudflare Workers

> **Nuxt 4 + NuxtHub v0.10 + TypeScript + Oxlint / Oxfmt で Ruby on Rails のような「設定不要・オールインワン（Batteries-Included）」な開発体験を実現するプロジェクト**

NuxtHub を使うことで、Cloudflare Workers のエッジインフラ（D1, KV, R2）を複雑な設定なしに Nuxt アプリケーションから直接操作できます。また、本番インフラの定義・管理には **Pulumi (TypeScript)** を採用し、コード品質管理には超高速な **Oxlint / Oxfmt** を導入しています。

---

## 🎯 Rails との対応表

| 機能 / レイヤー        | Ruby on Rails                     | Nuxt 4 + NuxtHub v0.10 + Cloudflare                       |
| :--------------------- | :-------------------------------- | :-------------------------------------------------------- |
| **フレームワーク**     | Rails 8                           | **Nuxt 4**                                                |
| **データベース (ORM)** | ActiveRecord + PostgreSQL/MySQL   | **Cloudflare D1 (SQLite) + Drizzle ORM** (`hub:db`)       |
| **マイグレーション**   | `db/migrate` / `rails db:migrate` | `server/database/migrations` / `pnpm db:migrations`       |
| **ファイル保存**       | ActiveStorage (S3 / Local)        | **Cloudflare R2** (`hub:blob`)                            |
| **KVS / キャッシュ**   | `Rails.cache` / Redis             | **Cloudflare KV** (`hub:kv`) / `defineCachedEventHandler` |
| **Linter / Formatter** | RuboCop                           | **Oxlint / Oxfmt** (Rust製 超高速ツール)                  |
| **管理GUI**            | Rails Admin / Adminer             | **Nuxt DevTools (Hub タブ)** / **NuxtHub Admin**          |
| **インフラ管理 (IaC)** | Terraform / Ansible / CDK         | **Pulumi (TypeScript)** (`infra/`)                        |

---

## 📂 プロジェクト構成

```text
├── app/
│   ├── app.vue                 # ルートコンポーネント
│   └── pages/
│       └── index.vue           # 全機能（DB/KV/Blob/Cache）を試せるダッシュボード
├── server/
│   ├── api/
│   │   ├── todos/              # D1 データベース操作 (CRUD)
│   │   ├── kv/                 # KV 操作 (Get, Set, Delete via hub:kv)
│   │   ├── blob/               # R2 ファイル操作 (Upload, Serve, Delete via hub:blob)
│   │   └── cached-time.ts      # エッジキャッシュ体験
│   ├── db/
│   │   └── schema.sqlite.ts    # NuxtHub v0.10 Drizzle スキーマ定義
│   ├── database/
│   │   └── migrations/         # D1 用 マイグレーション SQL
│   └── utils/
│       └── drizzle.ts          # 型安全な useDrizzle() ヘルパー
├── infra/                      # Pulumi による Cloudflare インフラ定義 (IaC)
│   ├── .env.example            # 認証情報テンプレート
│   ├── Pulumi.yaml
│   ├── package.json
│   └── index.ts
├── wrangler.toml               # Cloudflare Pages / Workers バインディング設定
├── nuxt.config.ts              # Nuxt 4 & NuxtHub v0.10 設定
├── README.md                   # 本ドキュメント
└── TUTORIAL.md                 # 詳しいチュートリアル・ハンズオンガイド
```

---

## ⚡ クイックスタート

### 1. 依存パッケージのインストール

```bash
pnpm install
```

### 2. 開発サーバーの起動

```bash
pnpm dev
```

- **ローカルからアクセス**: [http://localhost:3000](http://localhost:3000)
- **同一LAN内からアクセス**: [http://nuc7.local:3000](http://nuc7.local:3000)

D1、KV、R2、Cache の全機能をテストできるダッシュボードが表示されます。

### 3. Nuxt DevTools（NuxtHub GUI）の利用

ブラウザでアプリを開いた状態で、画面下部の **Nuxt ロゴ** をクリックするか `Shift + Alt + D` を押すと、**Nuxt DevTools** が開きます。
DevTools 内の **「Hub」** タブから、ローカルの D1 データベース、KV、Blob を直接ブラウザから閲覧・クエリ実行・編集できます。

---

## 🚀 デプロイとインフラ構築の流れ

### ① Pulumi による Cloudflare インフラ作成 (IaC)

```bash
# 1. 認証情報の設定 (.env)
cp infra/.env.example infra/.env
# infra/.env に CLOUDFLARE_ACCOUNT_ID と CLOUDFLARE_API_TOKEN を記入
# (※ API Token には D1 / KV / R2 / Pages の Edit 権限が必要です)

# 2. インフラのデプロイ
pnpm infra:preview   # 変更内容の事前確認
pnpm infra:apply     # インフラの作成・適用
```

### ② 本番 D1 データベースへのマイグレーション適用

初回デプロイ時（またはスキーマ変更時）に、本番 D1 にテーブルを作成します：

```bash
pnpm db:migrate:prod
```

### ③ バインディング設定 & デプロイ

Pulumi 実行結果で出力された ID を `wrangler.toml` に設定し、デプロイコマンドを実行します。

```bash
pnpm deploy:cf
```

---

## 🛠️ コマンド一覧 (npm scripts)

### 💻 開発・ビルド
| コマンド | 説明 |
| :--- | :--- |
| `pnpm dev` | ローカル開発サーバー起動（D1/KV/R2 自動エミュレート、`0.0.0.0` リッスンで LAN 公開対応） |
| `pnpm build` | 本番用ビルド（Node / 汎用サーバー用 `.output` ディレクトリ生成） |
| `pnpm generate` | 静的サイト生成（SSG） |
| `pnpm preview` | ローカルの Cloudflare Pages エミュレータで `dist/` 出力をプレビュー |
| `pnpm postinstall` | `pnpm install` 実行後に自動で `.nuxt` の型定義を生成 (`nuxt prepare`) |

### 🧹 コード品質・テスト
| コマンド | 説明 |
| :--- | :--- |
| `pnpm lint` | **Oxlint** による超高速静的解析 |
| `pnpm lint:fix` | **Oxlint** による静的解析と自動修正 |
| `pnpm format` | **Oxfmt** によるコードベース全体の高速自動整形 |
| `pnpm typecheck` | **vue-tsc** による TypeScript / Vue SFC の型チェック |
| `pnpm test` | **Vitest + @nuxt/test-utils** による単体テストおよび統合 API テストの実行 |
| `pnpm test:watch` | **Vitest** によるテスト監視モード（ファイル保存時に自動再テスト） |

### 🗄️ データベース (D1 / Drizzle)
| コマンド | 説明 |
| :--- | :--- |
| `pnpm db:generate` | スキーマ定義 (`server/db/schema.sqlite.ts`) の変更を検知し、マイグレーション SQL を自動生成 |
| `pnpm db:migrate:prod` | 本番 Cloudflare D1 データベースにマイグレーション SQL を適用 |

### ☁️ インフラ (Pulumi) & デプロイ
| コマンド | 説明 |
| :--- | :--- |
| `pnpm infra:preview` | **Pulumi** による Cloudflare リソース（D1 / KV / R2 / Pages）の変更事前確認 (dry-run) |
| `pnpm infra:apply` | **Pulumi** による Cloudflare リソースの作成・更新 |
| `pnpm infra:destroy` | **Pulumi** で作成した Cloudflare リソースの破棄 |
| `pnpm deploy:cf` | `NITRO_PRESET=cloudflare_pages` で `dist/` にビルドし、Wrangler 経由で Cloudflare Pages へ直接デプロイ |

---

## 📖 詳しいチュートリアル

ステップごとのコードの書き方、マイグレーション管理、Pulumi の詳しい設定方法については [TUTORIAL.md](./TUTORIAL.md) をご覧ください。
