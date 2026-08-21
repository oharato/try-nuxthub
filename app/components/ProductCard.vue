<script setup lang="ts">
const props = defineProps<{
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    stockQuantity: number;
    mainImage?: string | null;
    category?: { id: number; name: string; slug: string } | null;
    averageRating?: number;
    reviewCount?: number;
  };
}>();

const { addToCart } = useCart();
const isAdding = ref(false);

async function handleAddToCart() {
  if (props.product.stockQuantity <= 0) return;
  isAdding.value = true;
  await addToCart(props.product.id, 1);
  isAdding.value = false;
}
</script>

<template>
  <div class="product-card">
    <NuxtLink :to="`/products/${product.slug}`" class="image-wrap">
      <img
        v-if="product.mainImage"
        :src="`/api/blob/${encodeURIComponent(product.mainImage)}`"
        :alt="product.name"
        class="product-img"
        loading="lazy"
      />
      <div v-else class="placeholder-img">🏺</div>

      <div class="badge-overlay">
        <span v-if="product.stockQuantity <= 0" class="stock-badge out-of-stock">売り切れ</span>
        <span v-else-if="product.stockQuantity <= 3" class="stock-badge low-stock"
          >残り {{ product.stockQuantity }} 点</span
        >
        <span v-else class="stock-badge in-stock">在庫あり</span>
      </div>
    </NuxtLink>

    <div class="card-body">
      <div v-if="product.category" class="category-tag">
        {{ product.category.name }}
      </div>

      <h3 class="product-name">
        <NuxtLink :to="`/products/${product.slug}`">{{ product.name }}</NuxtLink>
      </h3>

      <div class="rating-row" v-if="product.reviewCount !== undefined && product.reviewCount > 0">
        <span class="stars">★ {{ product.averageRating }}</span>
        <span class="review-count">({{ product.reviewCount }}件)</span>
      </div>
      <div class="rating-row no-reviews" v-else>
        <span class="new-tag">新着作品</span>
      </div>

      <div class="card-footer">
        <div class="price-box">
          <span class="price-currency">¥</span>
          <span class="price-val">{{ product.price.toLocaleString() }}</span>
          <span class="tax-tag">税込</span>
        </div>

        <button
          @click="handleAddToCart"
          :disabled="product.stockQuantity <= 0 || isAdding"
          class="btn-card-cart"
          :class="{ 'btn-disabled': product.stockQuantity <= 0 }"
          title="カートに追加"
        >
          {{ isAdding ? "追加中" : product.stockQuantity <= 0 ? "完売" : "カートへ" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
}

.image-wrap {
  position: relative;
  width: 100%;
  padding-top: 70%;
  background: #f1f5f9;
  display: block;
  overflow: hidden;
}

.product-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  background: #f8fafc;
}

.badge-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
}

.stock-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-block;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.in-stock {
  background: #22c55e;
  color: #ffffff;
}

.low-stock {
  background: #f59e0b;
  color: #ffffff;
}

.out-of-stock {
  background: #ef4444;
  color: #ffffff;
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.category-tag {
  font-size: 0.75rem;
  color: #0284c7;
  font-weight: 600;
  margin-bottom: 6px;
}

.product-name {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 8px 0;
  flex: 1;
}

.product-name a {
  color: #0f172a;
  text-decoration: none;
}

.product-name a:hover {
  color: #0284c7;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  margin-bottom: 12px;
}

.stars {
  color: #eab308;
  font-weight: 700;
}

.review-count {
  color: #64748b;
}

.new-tag {
  font-size: 0.75rem;
  color: #64748b;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.price-box {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.price-currency {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.price-val {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.tax-tag {
  font-size: 0.65rem;
  color: #64748b;
  margin-left: 2px;
}

.btn-card-cart {
  background: #0284c7;
  color: #ffffff;
  border: none;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-card-cart:hover {
  background: #0369a1;
}

.btn-disabled {
  background: #cbd5e1 !important;
  color: #64748b !important;
  cursor: not-allowed !important;
}
</style>
