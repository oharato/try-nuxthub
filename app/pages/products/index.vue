<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const selectedCategory = ref((route.query.category as string) || "");
const searchQuery = ref((route.query.search as string) || "");
const selectedSort = ref((route.query.sort as string) || "newest");

const { data: categories } = await useFetch<any[]>("/api/categories");

const {
  data: products,
  pending,
  refresh,
} = await useFetch<any[]>("/api/products", {
  query: computed(() => ({
    category: selectedCategory.value || undefined,
    search: searchQuery.value || undefined,
    sort: selectedSort.value || undefined,
  })),
  watch: [selectedCategory, searchQuery, selectedSort],
});

// SSE inventory listener
useRealtimeInventory((data) => {
  if (products.value) {
    const target = products.value.find((p) => p.id === data.productId);
    if (target) {
      target.stockQuantity = data.stockQuantity;
    }
  }
});

function handleFilterChange() {
  router.push({
    path: "/products",
    query: {
      category: selectedCategory.value || undefined,
      search: searchQuery.value || undefined,
      sort: selectedSort.value || undefined,
    },
  });
}

function clearFilters() {
  selectedCategory.value = "";
  searchQuery.value = "";
  selectedSort.value = "newest";
  handleFilterChange();
}

watch(
  () => route.query,
  (newQuery) => {
    selectedCategory.value = (newQuery.category as string) || "";
    searchQuery.value = (newQuery.search as string) || "";
    selectedSort.value = (newQuery.sort as string) || "newest";
  },
);
</script>

<template>
  <div class="catalog-page">
    <div class="catalog-header">
      <div>
        <h1 class="page-title">商品カタログ</h1>
        <p class="page-subtitle">職人が丹精込めて制作した手仕事作品とデジタル素材</p>
      </div>

      <div class="active-badge-info">
        <span class="cache-badge">⚡ Nitro Cache: 60s 有効</span>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="toolbar-card">
      <div class="filter-group">
        <label class="filter-label">カテゴリー:</label>
        <select v-model="selectedCategory" @change="handleFilterChange" class="select-input">
          <option value="">すべてのカテゴリー</option>
          <option v-for="cat in categories" :key="cat.slug" :value="cat.slug">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <div class="filter-group search-filter">
        <label class="filter-label">キーワード:</label>
        <input
          v-model="searchQuery"
          @keyup.enter="handleFilterChange"
          type="text"
          placeholder="商品名や説明で検索..."
          class="text-input"
        />
        <button @click="handleFilterChange" class="btn-search">検索</button>
      </div>

      <div class="filter-group">
        <label class="filter-label">並び替え:</label>
        <select v-model="selectedSort" @change="handleFilterChange" class="select-input">
          <option value="newest">新着順</option>
          <option value="price_asc">価格の安い順</option>
          <option value="price_desc">価格の高い順</option>
        </select>
      </div>

      <button v-if="selectedCategory || searchQuery" @click="clearFilters" class="btn-clear">
        クリア
      </button>
    </div>

    <!-- Products Grid -->
    <div v-if="pending" class="loading-state">商品を検索中...</div>

    <div v-else-if="products && products.length > 0" class="catalog-grid">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>

    <div v-else class="empty-state">
      <p class="empty-icon">🔍</p>
      <h3>該当する商品が見つかりませんでした</h3>
      <p>検索条件を変更するか、フィルターをクリアしてお試しください。</p>
      <button @click="clearFilters" class="btn-primary">条件をリセット</button>
    </div>

    <!-- Recently Viewed -->
    <RecentlyViewed />
  </div>
</template>

<style scoped>
.catalog-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

.cache-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0284c7;
  background: #e0f2fe;
  padding: 4px 10px;
  border-radius: 9999px;
}

.toolbar-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-filter {
  flex: 1;
  min-width: 260px;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.select-input,
.text-input {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
  background: #ffffff;
}

.text-input {
  flex: 1;
}

.select-input:focus,
.text-input:focus {
  border-color: #0284c7;
}

.btn-search {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-search:hover {
  background: #0369a1;
}

.btn-clear {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-clear:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.loading-state,
.empty-state {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.empty-state h3 {
  font-size: 1.2rem;
  margin: 0 0 8px 0;
  color: #0f172a;
}

.empty-state p {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 20px 0;
}

.btn-primary {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
</style>
