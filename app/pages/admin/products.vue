<script setup lang="ts">
const { user, loggedIn } = useUserSession();
const router = useRouter();

const { data: products, pending, refresh } = await useFetch<any[]>("/api/products?sort=newest");

const savingId = ref<number | null>(null);
const updateSuccess = ref("");

async function updateStock(product: any, delta: number) {
  const newStock = Math.max(0, product.stockQuantity + delta);
  savingId.value = product.id;
  try {
    await $fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      body: { stockQuantity: newStock },
    });
    product.stockQuantity = newStock;
    updateSuccess.value = `「${product.name}」の在庫を ${newStock}点 に更新しました（SSEブロードキャスト完了）`;
    setTimeout(() => (updateSuccess.value = ""), 3000);
  } catch (e: any) {
    alert(e?.data?.statusMessage || "在庫の更新に失敗しました");
  } finally {
    savingId.value = null;
  }
}

async function togglePublish(product: any) {
  savingId.value = product.id;
  try {
    await $fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      body: { isPublished: !product.isPublished },
    });
    product.isPublished = !product.isPublished;
  } catch (e: any) {
    alert(e?.data?.statusMessage || "公開ステータスの更新に失敗しました");
  } finally {
    savingId.value = null;
  }
}

onMounted(() => {
  const currentUser = user.value as any;
  if (!loggedIn.value || currentUser?.role !== "admin") {
    router.push("/login?redirect=/admin/products");
  }
});
</script>

<template>
  <div class="admin-page-container">
    <AdminNav />

    <div class="admin-main-content">
      <div class="page-top-bar">
        <div>
          <h1 class="admin-title">📦 商品管理・在庫調整</h1>
          <p class="admin-subtitle">
            商品の在庫数や公開ステータスを即時変更。在庫変更は全クライアントへSSE即時配信されます。
          </p>
        </div>
        <NuxtLink to="/admin/products/new" class="btn-primary"> ➕ 新規商品登録 </NuxtLink>
      </div>

      <div v-if="updateSuccess" class="toast-success">✅ {{ updateSuccess }}</div>

      <div class="admin-card">
        <div v-if="pending" class="loading-state">商品リストを読み込んでいます...</div>

        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>画像</th>
              <th>商品名 / スラッグ</th>
              <th>カテゴリー</th>
              <th>価格 (JPY)</th>
              <th>在庫数 (即時変更)</th>
              <th>公開状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td>{{ product.id }}</td>
              <td>
                <div class="table-img">
                  <img
                    v-if="product.mainImage"
                    :src="`/api/blob/${encodeURIComponent(product.mainImage)}`"
                    :alt="product.name"
                  />
                  <span v-else>🏺</span>
                </div>
              </td>
              <td>
                <strong class="prod-name">{{ product.name }}</strong>
                <code class="prod-slug">{{ product.slug }}</code>
              </td>
              <td>
                <span class="cat-badge">{{ product.category?.name || "-" }}</span>
              </td>
              <td>
                <strong>¥{{ product.price.toLocaleString() }}</strong>
              </td>
              <td>
                <div class="stock-editor">
                  <button
                    @click="updateStock(product, -1)"
                    :disabled="savingId === product.id || product.stockQuantity <= 0"
                    class="btn-stock-step"
                  >
                    -
                  </button>
                  <span
                    class="stock-num"
                    :class="{
                      'stock-zero': product.stockQuantity === 0,
                      'stock-low': product.stockQuantity <= 3 && product.stockQuantity > 0,
                    }"
                  >
                    {{ product.stockQuantity }} 点
                  </span>
                  <button
                    @click="updateStock(product, +1)"
                    :disabled="savingId === product.id"
                    class="btn-stock-step"
                  >
                    +
                  </button>
                </div>
              </td>
              <td>
                <button
                  @click="togglePublish(product)"
                  :disabled="savingId === product.id"
                  class="btn-publish-toggle"
                  :class="product.isPublished ? 'published' : 'unpublished'"
                >
                  {{ product.isPublished ? "公開中" : "非公開" }}
                </button>
              </td>
              <td>
                <NuxtLink :to="`/products/${product.slug}`" target="_blank" class="btn-view-link">
                  商品ページ ↗
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
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

.btn-primary {
  background: #0284c7;
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
}

.toast-success {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.admin-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.admin-table th {
  background: #f8fafc;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.admin-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
}

.table-img {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  background: #f1f5f9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.prod-name {
  display: block;
  font-size: 0.9rem;
  color: #0f172a;
}

.prod-slug {
  font-size: 0.75rem;
  color: #64748b;
}

.cat-badge {
  background: #f1f5f9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.stock-editor {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-stock-step {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  width: 26px;
  height: 26px;
  font-weight: 700;
  cursor: pointer;
}

.btn-stock-step:hover {
  background: #e2e8f0;
}

.stock-num {
  font-weight: 700;
  min-width: 44px;
  text-align: center;
}

.stock-zero {
  color: #ef4444;
}

.stock-low {
  color: #d97706;
}

.btn-publish-toggle {
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-publish-toggle.published {
  background: #dcfce7;
  color: #166534;
}

.btn-publish-toggle.unpublished {
  background: #fee2e2;
  color: #991b1b;
}

.btn-view-link {
  color: #0284c7;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 600;
}

.btn-view-link:hover {
  text-decoration: underline;
}
</style>
