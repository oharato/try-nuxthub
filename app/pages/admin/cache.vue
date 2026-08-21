<script setup lang="ts">
const { user, loggedIn } = useUserSession();
const router = useRouter();

const isPurging = ref(false);
const purgeResult = ref<{ success: boolean; message: string; timestamp: string } | null>(null);

async function handlePurgeCache() {
  isPurging.value = true;
  purgeResult.value = null;
  try {
    const res = await $fetch<{ success: boolean; message: string; timestamp: string }>(
      "/api/admin/cache/purge",
      { method: "POST" },
    );
    purgeResult.value = res;
  } catch (e: any) {
    alert(e?.data?.statusMessage || "キャッシュのパージに失敗しました");
  } finally {
    isPurging.value = false;
  }
}

onMounted(() => {
  const currentUser = user.value as any;
  if (!loggedIn.value || currentUser?.role !== "admin") {
    router.push("/login?redirect=/admin/cache");
  }
});
</script>

<template>
  <div class="admin-page-container">
    <AdminNav />

    <div class="admin-main-content">
      <div class="page-top-bar">
        <div>
          <h1 class="admin-title">⚡ キャッシュ管理 (Nitro Cache)</h1>
          <p class="admin-subtitle">
            商品カタログ・商品詳細のEdgeキャッシュ（TTL:
            60秒）のステータス確認と一括パージが行えます。
          </p>
        </div>
      </div>

      <div class="admin-card">
        <div class="card-section">
          <h3>キャッシュの動作仕様</h3>
          <ul class="spec-list">
            <li>
              <strong>商品カタログ一覧 (<code>/api/products</code>):</strong>
              <code>defineCachedEventHandler</code> により 60秒間 エッジ/サーバーでキャッシュ配信。
            </li>
            <li>
              <strong>高速TTFBレスポンス:</strong>
              キャッシュヒット時は DB (D1)
              へのクエリを発行せず、ミリ秒単位でクライアントへ即時応答します。
            </li>
            <li>
              <strong>手動・即時パージ:</strong>
              商品の価格改定やセール開始時など、下のボタンからワンクリックで全エッジキャッシュを無効化できます。
            </li>
          </ul>

          <div class="purge-action-box">
            <button @click="handlePurgeCache" :disabled="isPurging" class="btn-purge">
              {{
                isPurging ? "キャッシュを破棄中..." : "🗑️ 全カタログキャッシュを一括破棄 (Purge)"
              }}
            </button>
          </div>

          <div v-if="purgeResult" class="purge-result-box">
            <p class="success-title">✅ {{ purgeResult.message }}</p>
            <span class="timestamp"
              >実行日時: {{ new Date(purgeResult.timestamp).toLocaleString() }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page-container {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}

.admin-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.admin-title {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 4px 0;
}

.admin-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.admin-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 28px;
}

.card-section h3 {
  font-size: 1.15rem;
  margin: 0 0 16px 0;
}

.spec-list {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.6;
  margin-bottom: 28px;
}

.spec-list code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.purge-action-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 24px;
  text-align: center;
}

.btn-purge {
  background: #ef4444;
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-purge:hover {
  background: #dc2626;
}

.btn-purge:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.purge-result-box {
  margin-top: 20px;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 16px;
}

.success-title {
  color: #166534;
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.timestamp {
  font-size: 0.8rem;
  color: #15803d;
}
</style>
