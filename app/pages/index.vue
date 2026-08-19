<script setup lang="ts">
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
}

interface KVItem {
  key: string;
  value: any;
}

interface BlobItem {
  pathname: string;
  contentType?: string;
  size: number;
  uploadedAt: string;
}

const activeTab = ref<"db" | "kv" | "blob" | "cache" | "auth">("db");

// --- Auth (Encrypted Cookie) State & Actions ---
const { loggedIn, user, clear, fetch: fetchSession } = useUserSession();
const currentUser = computed(() => user.value as Record<string, any> | null);
const loginEmail = ref("admin@example.com");
const loginPassword = ref("password");
const loginName = ref("管理者 太郎");
const isAuthLoading = ref(false);
const authError = ref("");
const protectedData = ref<{ secretMessage: string; user: any; verifiedAt: string } | null>(null);
const isProtectedLoading = ref(false);

async function handleLogin() {
  isAuthLoading.value = true;
  authError.value = "";
  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        email: loginEmail.value,
        password: loginPassword.value,
        name: loginName.value,
      },
    });
    await fetchSession();
  } catch (e: any) {
    authError.value = e?.data?.statusMessage || e?.message || "ログインに失敗しました";
  } finally {
    isAuthLoading.value = false;
  }
}

async function handleLogout() {
  isAuthLoading.value = true;
  try {
    await $fetch("/api/auth/logout", { method: "POST" });
    await clear();
    protectedData.value = null;
  } catch (e) {
    alert("ログアウトに失敗しました");
  } finally {
    isAuthLoading.value = false;
  }
}

async function fetchProtectedData() {
  isProtectedLoading.value = true;
  try {
    const res = await $fetch<{
      secretMessage: string;
      user: any;
      verifiedAt: string;
    }>("/api/auth/protected");
    protectedData.value = res;
  } catch (e: any) {
    alert(e?.data?.statusMessage || "保護されたデータの取得に失敗しました");
  } finally {
    isProtectedLoading.value = false;
  }
}

// --- Database (Todos) State & Actions ---
const todos = ref<Todo[]>([]);
const newTodoTitle = ref("");
const isTodoLoading = ref(false);

async function fetchTodos() {
  isTodoLoading.value = true;
  try {
    todos.value = (await $fetch("/api/todos")) as unknown as Todo[];
  } catch (e) {
    console.error("Failed to fetch todos", e);
  } finally {
    isTodoLoading.value = false;
  }
}

async function addTodo() {
  if (!newTodoTitle.value.trim()) return;
  try {
    const created = (await $fetch("/api/todos", {
      method: "POST",
      body: { title: newTodoTitle.value.trim() },
    })) as unknown as Todo;
    todos.value.unshift(created);
    newTodoTitle.value = "";
  } catch (e) {
    alert("Failed to add todo");
  }
}

async function toggleTodo(todo: Todo) {
  try {
    const updated = (await $fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      body: { completed: !todo.completed },
    })) as unknown as Todo;
    todo.completed = updated.completed;
  } catch (e) {
    alert("Failed to update todo");
  }
}

async function deleteTodo(id: number) {
  try {
    await $fetch(`/api/todos/${id}`, { method: "DELETE" });
    todos.value = todos.value.filter((t) => t.id !== id);
  } catch (e) {
    alert("Failed to delete todo");
  }
}

// --- KV State & Actions ---
const kvList = ref<KVItem[]>([]);
const newKvKey = ref("");
const newKvValue = ref("");
const isKvLoading = ref(false);

async function fetchKV() {
  isKvLoading.value = true;
  try {
    kvList.value = (await $fetch("/api/kv")) as unknown as KVItem[];
  } catch (e) {
    console.error("Failed to fetch KV", e);
  } finally {
    isKvLoading.value = false;
  }
}

async function setKV() {
  if (!newKvKey.value.trim()) return;
  const key = newKvKey.value.trim();
  try {
    let parsedValue: any = newKvValue.value;
    try {
      parsedValue = JSON.parse(newKvValue.value);
    } catch {
      // keep as string if not JSON
    }

    await $fetch("/api/kv", {
      method: "POST",
      body: { key, value: parsedValue },
    });

    // Optimistic UI: 即座にローカル一覧を更新（Cloudflare KV の list伝播遅延対策）
    const existingIndex = kvList.value.findIndex((item) => item.key === key);
    if (existingIndex >= 0 && kvList.value[existingIndex]) {
      kvList.value[existingIndex].value = parsedValue;
    } else {
      kvList.value.unshift({ key, value: parsedValue });
    }

    newKvKey.value = "";
    newKvValue.value = "";
  } catch (e) {
    alert("Failed to set KV");
  }
}

async function deleteKV(key: string) {
  try {
    await $fetch(`/api/kv/${encodeURIComponent(key)}`, { method: "DELETE" });
    // Optimistic UI: 即座に一覧から除外
    kvList.value = kvList.value.filter((item) => item.key !== key);
  } catch (e) {
    alert("Failed to delete KV");
  }
}

// --- Blob (R2) State & Actions ---
const blobs = ref<BlobItem[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const isBlobLoading = ref(false);
const isUploading = ref(false);

async function fetchBlobs() {
  isBlobLoading.value = true;
  try {
    const res = (await $fetch("/api/blob")) as any;
    blobs.value = Array.isArray(res) ? res : res?.blobs || [];
  } catch (e) {
    console.error("Failed to fetch blobs", e);
  } finally {
    isBlobLoading.value = false;
  }
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isUploading.value = true;
  const formData = new FormData();
  formData.append("file", file);

  try {
    await $fetch("/api/blob/upload", {
      method: "POST",
      body: formData,
    });
    if (fileInput.value) fileInput.value.value = "";
    await fetchBlobs();
  } catch (e) {
    alert("Failed to upload file");
  } finally {
    isUploading.value = false;
  }
}

async function deleteBlob(pathname: string) {
  try {
    await $fetch(`/api/blob/${encodeURIComponent(pathname)}`, {
      method: "DELETE",
    });
    await fetchBlobs();
  } catch (e) {
    alert("Failed to delete blob");
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// --- Cache State & Actions ---
const cacheData = ref<{ generatedAt: string; timestamp: number; message: string } | null>(null);
const clientFetchedAt = ref<string>("");
const isCacheLoading = ref(false);

async function fetchCacheData() {
  isCacheLoading.value = true;
  try {
    const res = await $fetch<{
      generatedAt: string;
      timestamp: number;
      message: string;
    }>("/api/cached-time");
    cacheData.value = res;
    clientFetchedAt.value = new Date().toLocaleTimeString();
  } catch (e) {
    console.error("Failed to fetch cached data", e);
  } finally {
    isCacheLoading.value = false;
  }
}

// Initial fetch
onMounted(() => {
  fetchTodos();
  fetchKV();
  fetchBlobs();
  fetchCacheData();
});
</script>

<template>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="logo-area">
        <span class="badge">Nuxt 4 + NuxtHub v0.10 + Cloudflare</span>
        <h1>NuxtHub Fullstack Demo</h1>
        <p class="subtitle">
          Ruby on Rails のような「設定不要・オールインワン」な開発体験をエッジサーバーで実現
        </p>
      </div>
      <div class="admin-link-area">
        <span class="devtools-hint" title="画面下のNuxtアイコンまたは Shift+Alt+D で開けます">
          🛠️ <strong>Nuxt DevTools</strong> の「Hub」タブで D1/KV/Blob を管理可能
        </span>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <nav class="nav-tabs">
      <button :class="['tab-btn', { active: activeTab === 'db' }]" @click="activeTab = 'db'">
        🗄️ Database (D1 + Drizzle)
      </button>
      <button :class="['tab-btn', { active: activeTab === 'kv' }]" @click="activeTab = 'kv'">
        🔑 KV (Key-Value)
      </button>
      <button :class="['tab-btn', { active: activeTab === 'blob' }]" @click="activeTab = 'blob'">
        📦 Blob (R2 Storage)
      </button>
      <button :class="['tab-btn', { active: activeTab === 'cache' }]" @click="activeTab = 'cache'">
        ⚡ Cache (Edge Handler)
      </button>
      <button :class="['tab-btn', { active: activeTab === 'auth' }]" @click="activeTab = 'auth'">
        🔐 Auth (暗号化 Cookie)
      </button>
    </nav>

    <!-- Content Sections -->
    <main class="content-card">
      <!-- 1. Database (D1) -->
      <section v-if="activeTab === 'db'" class="section">
        <div class="section-header">
          <h2>Cloudflare D1 (SQLite) + Drizzle ORM</h2>
          <p>
            Rails の <code>ActiveRecord</code> のように、スキーマ定義・マイグレーション・クエリが
            TypeScript で型安全に行えます。
          </p>
        </div>

        <form @submit.prevent="addTodo" class="input-form">
          <input
            v-model="newTodoTitle"
            type="text"
            placeholder="新しいタスクを入力... (Enter で追加)"
            class="text-input"
            required
          />
          <button type="submit" class="btn-primary">追加</button>
        </form>

        <div v-if="isTodoLoading" class="loading">読み込み中...</div>
        <ul v-else class="list">
          <li v-for="todo in todos" :key="todo.id" class="list-item">
            <label class="todo-label">
              <input
                type="checkbox"
                :checked="todo.completed"
                @change="toggleTodo(todo)"
                class="checkbox"
              />
              <span :class="{ 'completed-text': todo.completed }">{{ todo.title }}</span>
            </label>
            <div class="item-actions">
              <span class="timestamp">{{ new Date(todo.createdAt).toLocaleString() }}</span>
              <button @click="deleteTodo(todo.id)" class="btn-delete" title="削除">✕</button>
            </div>
          </li>
          <li v-if="todos.length === 0" class="empty-state">
            タスクはまだありません。上のフォームから追加してください。
          </li>
        </ul>

        <div class="code-preview">
          <code
            >// server/api/todos/index.post.ts<br />const db = useDrizzle()<br />await
            db.insert(schema.todos).values({ title: body.title })</code
          >
        </div>
      </section>

      <!-- 2. KV -->
      <section v-if="activeTab === 'kv'" class="section">
        <div class="section-header">
          <h2>Cloudflare KV (Key-Value Store)</h2>
          <p>
            グローバルに高速アクセス可能な Key-Value
            ストア。セッション、フラグ、一時設定値の保存に最適です。
          </p>
        </div>

        <form @submit.prevent="setKV" class="input-form-grid">
          <input
            v-model="newKvKey"
            type="text"
            placeholder="Key (例: site_mode)"
            class="text-input"
            required
          />
          <input
            v-model="newKvValue"
            type="text"
            placeholder='Value (例: "maintenance" または {"count": 1})'
            class="text-input"
            required
          />
          <button type="submit" class="btn-primary">保存</button>
        </form>

        <div v-if="isKvLoading" class="loading">読み込み中...</div>
        <div v-else class="kv-grid">
          <div v-for="item in kvList" :key="item.key" class="kv-card">
            <div class="kv-card-header">
              <span class="kv-key">{{ item.key }}</span>
              <button @click="deleteKV(item.key)" class="btn-delete">✕</button>
            </div>
            <pre class="kv-value">{{
              typeof item.value === "object" ? JSON.stringify(item.value, null, 2) : item.value
            }}</pre>
          </div>
          <div v-if="kvList.length === 0" class="empty-state">KVエントリはありません。</div>
        </div>

        <div class="code-preview">
          <code
            >// server/api/kv/index.post.ts<br />import { kv } from 'hub:kv'<br />await
            kv.set(body.key, body.value)</code
          >
        </div>
      </section>

      <!-- 3. Blob (R2) -->
      <section v-if="activeTab === 'blob'" class="section">
        <div class="section-header">
          <h2>Cloudflare R2 (Blob / Object Storage)</h2>
          <p>
            Rails の
            <code>ActiveStorage</code>
            のように、S3互換のオブジェクトストレージへ直接ファイルをアップロード・配信。
          </p>
        </div>

        <div class="upload-area">
          <input
            ref="fileInput"
            type="file"
            @change="handleFileUpload"
            :disabled="isUploading"
            class="file-input"
            id="file-upload"
          />
          <label for="file-upload" class="upload-btn-label">
            {{ isUploading ? "アップロード中..." : "📁 ファイルを選択してアップロード" }}
          </label>
        </div>

        <div v-if="isBlobLoading" class="loading">読み込み中...</div>
        <div v-else class="blob-grid">
          <div v-for="file in blobs" :key="file.pathname" class="blob-card">
            <div class="blob-info">
              <span class="blob-name" :title="file.pathname">{{ file.pathname }}</span>
              <span class="blob-size">{{ formatBytes(file.size) }}</span>
            </div>
            <div class="blob-actions">
              <a :href="`/api/blob/${file.pathname}`" target="_blank" class="btn-secondary">
                表示 / 取得
              </a>
              <button @click="deleteBlob(file.pathname)" class="btn-delete">✕</button>
            </div>
          </div>
          <div v-if="blobs.length === 0" class="empty-state">
            アップロードされたファイルはありません。
          </div>
        </div>

        <div class="code-preview">
          <code
            >// server/api/blob/upload.post.ts<br />import { blob } from 'hub:blob'<br />await
            blob.put(pathname, file)</code
          >
        </div>
      </section>

      <!-- 4. Cache -->
      <section v-if="activeTab === 'cache'" class="section">
        <div class="section-header">
          <h2>Edge Handler Caching</h2>
          <p>
            <code>defineCachedEventHandler</code> によるエッジでの自動キャッシュ（TTL:
            10秒）。ボタンを連打しても10秒間は同じ生成時刻が返されます。
          </p>
        </div>

        <div class="cache-demo">
          <button @click="fetchCacheData" class="btn-primary" :disabled="isCacheLoading">
            {{ isCacheLoading ? "取得中..." : "🔄 データを再フェッチ" }}
          </button>

          <div v-if="cacheData" class="cache-result">
            <div class="cache-row">
              <strong>クライアント取得時刻:</strong>
              <span>{{ clientFetchedAt }}</span>
            </div>
            <div class="cache-row">
              <strong>サーバー生成時刻 (Generated At):</strong>
              <span class="highlight">{{
                new Date(cacheData.generatedAt).toLocaleTimeString()
              }}</span>
            </div>
            <p class="cache-note">{{ cacheData.message }}</p>
          </div>
        </div>

        <div class="code-preview">
          <code
            >// server/api/cached-time.ts<br />export default defineCachedEventHandler(handler, {
            maxAge: 10 })</code
          >
        </div>
      </section>

      <!-- 5. Auth (Encrypted Cookie) -->
      <section v-if="activeTab === 'auth'" class="section">
        <div class="section-header">
          <h2>Sealed / Encrypted Cookie Authentication</h2>
          <p>
            サーバーレス・エッジ環境のベストプラクティス。DBアクセス 0 回・0ms でセッション判定。
            Cookie の中身は AES 暗号化されているため、ブラウザからの閲覧・改ざんが一切不可能です。
          </p>
        </div>

        <div v-if="loggedIn && currentUser" class="auth-logged-in">
          <div class="user-card">
            <div class="user-avatar">👤</div>
            <div class="user-details">
              <h3>
                {{ currentUser.name }} <span class="role-badge">{{ currentUser.role }}</span>
              </h3>
              <p class="user-email">✉️ {{ currentUser.email }}</p>
              <p class="login-time">
                ログイン日時: {{ new Date(currentUser.loggedInAt).toLocaleString() }}
              </p>
            </div>
            <button @click="handleLogout" class="btn-delete" :disabled="isAuthLoading">
              {{ isAuthLoading ? "処理中..." : "ログアウト" }}
            </button>
          </div>

          <div class="protected-area">
            <h4>🛡️ 保護された API エンドポイント（/api/auth/protected）の検証</h4>
            <button @click="fetchProtectedData" class="btn-primary" :disabled="isProtectedLoading">
              {{ isProtectedLoading ? "通信中..." : "保護データを取得" }}
            </button>

            <div v-if="protectedData" class="protected-result">
              <p class="success-msg">{{ protectedData.secretMessage }}</p>
              <span class="timestamp"
                >検証日時: {{ new Date(protectedData.verifiedAt).toLocaleTimeString() }}</span
              >
            </div>
          </div>
        </div>

        <div v-else class="auth-login-form">
          <form @submit.prevent="handleLogin" class="input-form-grid">
            <input
              v-model="loginName"
              type="text"
              placeholder="表示名 (例: 管理者 太郎)"
              class="text-input"
              required
            />
            <input
              v-model="loginEmail"
              type="email"
              placeholder="メールアドレス (例: admin@example.com)"
              class="text-input"
              required
            />
            <input
              v-model="loginPassword"
              type="password"
              placeholder="パスワード (デモ用: password)"
              class="text-input"
              required
            />
            <button type="submit" class="btn-primary" :disabled="isAuthLoading">
              {{ isAuthLoading ? "ログイン中..." : "🔐 ログイン (暗号化 Cookie を発行)" }}
            </button>
          </form>
          <p v-if="authError" class="auth-error-msg">{{ authError }}</p>
        </div>

        <div class="code-preview">
          <code
            >// server/api/auth/login.post.ts<br />await setUserSession(event, { user: { id, email,
            role } })<br /><br />// server/api/auth/protected.get.ts<br />const session = await
            getUserSession(event) // エッジで 0ms 復号</code
          >
        </div>
      </section>
    </main>

    <!-- Architecture & Features summary footer -->
    <footer class="footer-info">
      <div class="info-card">
        <h3>🚀 Nuxt 4 + Oxlint による高速開発サイクル</h3>
        <p>
          ローカル実行 <code>pnpm dev</code> では Cloudflare の workerd 上で D1/KV/R2
          が自動エミュレートされ、Oxlint / Oxfmt
          による高速な解析・フォーマットとともに設定ゼロで即座に開発を開始できます。
        </p>
      </div>
      <div class="info-card">
        <h3>☁️ IaC (Pulumi) との連携</h3>
        <p>
          本番用の D1、KV、R2 リソースは Pulumi (TypeScript) で宣言的に管理可能。プロジェクト内の
          <code>infra/</code> ディレクトリを参照してください。
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 20px;
}

.badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #0284c7;
  background-color: #e0f2fe;
  padding: 4px 10px;
  border-radius: 9999px;
  margin-bottom: 8px;
}

h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  letter-spacing: -0.025em;
  color: #0f172a;
}

.subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.devtools-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
}

.nav-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
  overflow-x: auto;
}

.tab-btn {
  background: none;
  border: none;
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #0f172a;
  background-color: #f1f5f9;
}

.tab-btn.active {
  color: #0284c7;
  background-color: #e0f2fe;
}

.content-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 6px 0;
}

.section-header p {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

.input-form {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.input-form-grid {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 12px;
  margin-bottom: 20px;
}

.text-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.text-input:focus {
  border-color: #0284c7;
}

.btn-primary {
  background-color: #0284c7;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #0369a1;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.btn-secondary:hover {
  background-color: #e2e8f0;
}

.btn-delete {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.2s;
}

.btn-delete:hover {
  color: #ef4444;
  background-color: #fee2e2;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.list-item:last-child {
  border-bottom: none;
}

.todo-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.completed-text {
  text-decoration: line-through;
  color: #94a3b8;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.timestamp {
  font-size: 0.75rem;
  color: #94a3b8;
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

.kv-grid,
.blob-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.kv-card,
.blob-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
}

.kv-card-header,
.blob-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kv-key {
  font-family: monospace;
  font-weight: 700;
  color: #0369a1;
  font-size: 0.9rem;
}

.kv-value {
  margin: 8px 0 0 0;
  font-family: monospace;
  font-size: 0.85rem;
  background: #ffffff;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
}

.upload-area {
  margin-bottom: 24px;
}

.file-input {
  display: none;
}

.upload-btn-label {
  display: inline-block;
  background-color: #0284c7;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.upload-btn-label:hover {
  background-color: #0369a1;
}

.blob-info {
  margin-bottom: 12px;
}

.blob-name {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blob-size {
  font-size: 0.75rem;
  color: #64748b;
}

.cache-demo {
  margin-bottom: 24px;
}

.cache-result {
  margin-top: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.cache-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.highlight {
  color: #0284c7;
  font-weight: 700;
}

.cache-note {
  font-size: 0.85rem;
  color: #64748b;
  margin: 12px 0 0 0;
}

.code-preview {
  background-color: #1e293b;
  color: #94a3b8;
  padding: 14px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.4;
}

.footer-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 32px;
}

.info-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 18px;
}

.info-card h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 6px 0;
}

.info-card p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.user-avatar {
  font-size: 2.5rem;
}

.user-details {
  flex: 1;
}

.user-details h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
}

.role-badge {
  font-size: 0.75rem;
  background: #e0f2fe;
  color: #0369a1;
  padding: 2px 8px;
  border-radius: 9999px;
  margin-left: 6px;
}

.user-email {
  margin: 0 0 4px 0;
  font-size: 0.85rem;
  color: #475569;
}

.login-time {
  margin: 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.protected-area {
  margin-bottom: 24px;
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.protected-area h4 {
  margin: 0 0 12px 0;
  color: #166534;
}

.protected-result {
  margin-top: 12px;
  padding: 12px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #86efac;
}

.success-msg {
  margin: 0 0 6px 0;
  font-weight: 600;
  color: #15803d;
}

.auth-error-msg {
  margin-top: 8px;
  color: #ef4444;
  font-size: 0.85rem;
}

@media (max-width: 640px) {
  .header {
    flex-direction: column;
  }
  .input-form-grid {
    grid-template-columns: 1fr;
  }
  .footer-info {
    grid-template-columns: 1fr;
  }
}
</style>
