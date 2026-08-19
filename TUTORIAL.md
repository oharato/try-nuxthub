# 📘 NuxtHub × Cloudflare チュートリアル & 開発ガイド

このチュートリアルでは、**Nuxt 4 + NuxtHub v0.10 + TypeScript × Cloudflare Workers** 環境で Ruby on Rails のような「設定不要・オールインワン・型安全」な開発体験を実践し、**Pulumi (TypeScript)** を使ったインフラ構築とデプロイまでの全工程を解説します。

---

## 📑 目次

1. [NuxtHub のセットアップと設定](#1-nuxthub-のセットアップと設定)
2. [LAN からの接続設定 (0.0.0.0 リッスン)](#2-lan-からの接続設定-0000-リッスン)
3. [データベース (D1 + Drizzle ORM) を使う](#3-データベース-d1--drizzle-orm-を使う)
4. [KV (Key-Value Store) を使う](#4-kv-key-value-store-を使う)
5. [Blob (R2 オブジェクトストレージ) を使う](#5-blob-r2-オブジェクトストレージ-を使う)
6. [エッジキャッシュ (Cached Handler) を使う](#6-エッジキャッシュ-cached-handler-を使う)
7. [Nuxt DevTools (NuxtHub GUI) の活用](#7-nuxt-devtools-nuxthub-gui-の活用)
8. [Pulumi によるインフラ構築と本番デプロイ](#8-pulumi-によるインフラ構築と本番デプロイ)

---

## 1. NuxtHub のセットアップと設定

NuxtHub の各機能は `nuxt.config.ts` で有効化するだけで、Cloudflare 側のバインディングやローカルエミュレータ（workerd / SQLite）が自動設定されます。

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxthub/core"],
  hub: {
    db: "sqlite", // D1 (SQLite)
    kv: true, // Workers KV
    blob: true, // R2 Storage
    cache: true, // Edge Nitro Cache
  },
});
```

---

## 2. LAN からの接続設定 (0.0.0.0 リッスン)

別PCやスマートフォンなどの同一LAN内の端末から `http://nuc7.local:3000` で接続できるように、`devServer` を設定しています。

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  devServer: {
    host: "0.0.0.0",
    port: 3000,
  },
});
```

---

## 3. データベース (D1 + Drizzle ORM) を使う

Rails の `ActiveRecord` に相当する機能です。TypeScript でスキーマを定義し、型安全にクエリを実行します。

### ① スキーマの定義 (`server/db/schema.sqlite.ts`)

```ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

### ② ヘルパー関数の作成 (`server/utils/drizzle.ts`)

NuxtHub v0.10 では `import { db, schema } from 'hub:db'` を使って Drizzle インスタンスを直接取得できます。

```ts
import { db, schema } from "hub:db";

export { sql, eq, and, or, desc, asc } from "drizzle-orm";
export const tables = schema;

export function useDrizzle() {
  return db;
}

export type Todo = typeof schema.todos.$inferSelect;
export type NewTodo = typeof schema.todos.$inferInsert;
```

### ③ マイグレーションの管理

ローカル開発時は `pnpm dev` 起動時に `server/database/migrations` 内の SQL が自動適用されます。

```bash
# マイグレーション一覧・適用状態の確認
pnpm db:migrations

# 新しいマイグレーションファイルの生成
pnpm db:create <migration_name>
```

### ④ API エンドポイントの実装

`useDrizzle()` または `import { db, schema } from 'hub:db'` を使って Rails ライクにクエリを記述します。

```ts
// server/api/todos/index.post.ts
import { todos } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const db = useDrizzle();

  // 型安全な INSERT
  const [todo] = await db
    .insert(todos)
    .values({
      title: body.title,
    })
    .returning();

  return todo;
});
```

---

## 4. KV (Key-Value Store) を使う

Rails の `Rails.cache` や Redis のように、低レイテンシでグローバルに伝播する Key-Value データを扱えます。NuxtHub v0.10 では `hub:kv` からインポートします。

```ts
import { kv } from "hub:kv";

// 保存 (オブジェクトもそのまま保存可能)
await kv.set("site_settings", { maintenance: false, banner: "Welcome!" });

// 取得
const settings = await kv.get("site_settings");

// キー一覧取得
const keys = await kv.keys();

// 削除
await kv.del("site_settings");
```

---

## 5. Blob (R2 オブジェクトストレージ) を使う

Rails の `ActiveStorage` に相当する機能です。S3互換の Cloudflare R2 ストレージへファイルのアップロードや配信を行います。NuxtHub v0.10 では `hub:blob` からインポートします。

### ① ファイルのアップロード (`server/api/blob/upload.post.ts`)

```ts
import { blob } from "hub:blob";

export default defineEventHandler(async (event) => {
  const form = await readFormData(event);
  const file = form.get("file") as File;

  const pathname = `${Date.now()}-${file.name}`;
  const uploadedBlob = await blob.put(pathname, file);
  return uploadedBlob;
});
```

### ② ファイルの直接配信 (`server/api/blob/[pathname].get.ts`)

```ts
import { blob } from "hub:blob";

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, "pathname");
  if (!pathname) throw createError({ statusCode: 400, statusMessage: "Pathname is required" });

  return blob.serve(event, decodeURIComponent(pathname));
});
```

---

## 6. エッジキャッシュ (Cached Handler) を使う

関数のレスポンスを Cloudflare エッジネットワーク上にキャッシュし、高速な応答と DB 負荷低減を実現します。

```ts
// server/api/cached-time.ts
export default defineCachedEventHandler(
  async () => {
    return {
      timestamp: Date.now(),
      generatedAt: new Date().toISOString(),
      message: "This response is cached at the edge for 10 seconds.",
    };
  },
  {
    maxAge: 10, // 10秒間キャッシュ
    name: "cached-time",
  },
);
```

---

## 7. Nuxt DevTools (NuxtHub GUI) の活用

NuxtHub の管理 GUI は **Nuxt DevTools** に統合されています。

1. ブラウザで [http://nuc7.local:3000](http://nuc7.local:3000) を開きます。
2. 画面下部に表示される小さな **Nuxt アイコン** をクリックするか、ショートカット `Shift + Alt + D` を押します。
3. サイドメニューの **「Hub」** タブを開きます。
   - **Database**: D1 テーブルの確認、レコード編集、任意の SQL クエリ実行
   - **KV**: キー一覧、JSON 値のプレビュー・編集
   - **Blob**: 保存されたファイルの一覧、プレビュー、削除

---

## 8. Pulumi によるインフラ構築と本番デプロイ

### ① Cloudflare API Token の作成と権限設定

Cloudflare ダッシュボード（**「My Profile」→「API Tokens」→「Create Token」→「Create Custom Token」**）から、以下の権限を持つトークンを作成します：

| カテゴリ (Scope) | リソース名 (Permission) | 権限 (Access Level) |
| :--------------- | :---------------------- | :------------------ |
| **Account**      | **D1**                  | **Edit**            |
| **Account**      | **Workers KV Storage**  | **Edit**            |
| **Account**      | **Workers R2 Storage**  | **Edit**            |
| **Account**      | **Cloudflare Pages**    | **Edit**            |
| **Account**      | **Account Settings**    | **Read** (推奨)     |

> **Account ID の確認場所**: Cloudflare ダッシュボードのトップ画面右サイドバー、または URL 内に表示されている 32 桁の英数字です。

### ② 設定ファイル (`infra/.env`) の準備

`infra/.env.example` をコピーして Cloudflare 認証情報を記入します：

```bash
cp infra/.env.example infra/.env
```

```env
# infra/.env
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### ③ Pulumi でインフラをデプロイ

プロジェクトルートから以下のコマンドを実行します：

```bash
# 変更内容の事前確認 (dry-run)
pnpm infra:preview

# インフラの作成・適用
pnpm infra:apply
```

### ③ 出力された ID を `wrangler.toml` に記入

`pulumi up` 完了後、ターミナルに表示される ID（または `pulumi stack output` で確認）をプロジェクトルートの `wrangler.toml` に設定します：

```toml
# wrangler.toml
name = "try-nuxthub"
compatibility_date = "2025-03-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "try-nuxthub-prod-d1"
database_id = "<d1DatabaseId の値>"

[[kv_namespaces]]
binding = "KV"
id = "<kvNamespaceId の値>"

[[r2_buckets]]
binding = "BLOB"
bucket_name = "<r2BucketName の値>"
```

### ④ 本番 D1 データベースへのマイグレーション適用

本番環境の Cloudflare D1 にテーブル（`todos` テーブル等）を作成します（Rails の `rails db:migrate RAILS_ENV=production` に相当）：

```bash
pnpm db:migrate:prod
```

### ⑤ アプリケーションのデプロイ

プロジェクトルートでビルド＆デプロイを実行します：

```bash
pnpm deploy:cf
```

デプロイ完了後、Cloudflare Pages の URL（例: `https://try-nuxthub.pages.dev`）で本番アプリが公開され、Todo の追加や KV / Blob の保存が動作するようになります！
