<script setup lang="ts">
const recentlyViewed = ref<any[]>([]);
const isLoading = ref(false);

async function loadRecentlyViewed() {
  isLoading.value = true;
  try {
    const data = await $fetch<any[]>("/api/user/recently-viewed");
    recentlyViewed.value = data || [];
  } catch (e) {
    console.warn("Failed to load recently viewed:", e);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadRecentlyViewed();
});
</script>

<template>
  <div v-if="recentlyViewed.length > 0" class="recently-viewed-section">
    <div class="section-title-wrap">
      <h3 class="section-title">🕒 最近チェックした商品</h3>
      <span class="section-sub">Cloudflare KV で高速保持</span>
    </div>

    <div class="recently-grid">
      <NuxtLink
        v-for="item in recentlyViewed"
        :key="item.id"
        :to="`/products/${item.slug}`"
        class="recent-card"
      >
        <div class="recent-img-wrap">
          <img
            v-if="item.mainImage"
            :src="`/api/blob/${encodeURIComponent(item.mainImage)}`"
            :alt="item.name"
            class="recent-img"
            loading="lazy"
          />
          <div v-else class="recent-placeholder">🏺</div>
        </div>
        <div class="recent-info">
          <span class="recent-name">{{ item.name }}</span>
          <span class="recent-price">¥{{ item.price.toLocaleString() }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.recently-viewed-section {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid #e2e8f0;
}

.section-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.section-sub {
  font-size: 0.75rem;
  color: #64748b;
}

.recently-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.recent-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.recent-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.recent-img-wrap {
  width: 100%;
  padding-top: 70%;
  position: relative;
  background: #f8fafc;
}

.recent-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recent-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.recent-info {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-price {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0284c7;
}
</style>
