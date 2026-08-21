<script setup lang="ts">
const { cart, isLoading, fetchCart, updateQuantity, removeItem } = useCart();

onMounted(() => {
  fetchCart();
});
</script>

<template>
  <div class="cart-page">
    <h1 class="page-title">🛒 ショッピングカート</h1>

    <div v-if="isLoading && cart.items.length === 0" class="loading-state">
      カート情報を読み込んでいます...
    </div>

    <div v-else-if="cart.items.length > 0" class="cart-layout">
      <!-- Items List -->
      <div class="cart-items-card">
        <div class="card-header">
          <h2>カート内の商品 ({{ cart.totalCount }}点)</h2>
          <span class="kv-notice">⚡ Cloudflare KV で一時保持中</span>
        </div>

        <div class="items-list">
          <div v-for="item in cart.items" :key="item.productId" class="cart-item-row">
            <div class="item-img-wrap">
              <img
                v-if="item.image"
                :src="`/api/blob/${encodeURIComponent(item.image)}`"
                :alt="item.name"
                class="item-img"
              />
              <div v-else class="placeholder-img">🏺</div>
            </div>

            <div class="item-info">
              <NuxtLink :to="`/products/${item.slug}`" class="item-name">
                {{ item.name }}
              </NuxtLink>
              <div class="item-price-unit">単価: ¥{{ item.price.toLocaleString() }} (税込)</div>
              <div v-if="item.stockQuantity <= 3" class="stock-warning">
                ⚠️ 残りわずか (在庫: {{ item.stockQuantity }}点)
              </div>
            </div>

            <div class="item-stepper-wrap">
              <div class="stepper">
                <button
                  @click="updateQuantity(item.productId, item.quantity - 1)"
                  :disabled="item.quantity <= 1 || isLoading"
                  class="btn-step"
                >
                  -
                </button>
                <span class="step-val">{{ item.quantity }}</span>
                <button
                  @click="updateQuantity(item.productId, item.quantity + 1)"
                  :disabled="item.quantity >= item.stockQuantity || isLoading"
                  class="btn-step"
                >
                  +
                </button>
              </div>

              <button
                @click="removeItem(item.productId)"
                :disabled="isLoading"
                class="btn-remove"
                title="カートから削除"
              >
                削除
              </button>
            </div>

            <div class="item-line-total">¥{{ item.lineTotal.toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <!-- Order Summary Card -->
      <div class="summary-card">
        <h3>ご注文サマリー</h3>

        <div class="summary-row">
          <span>小計</span>
          <span>¥{{ cart.subtotal.toLocaleString() }}</span>
        </div>
        <div class="summary-row">
          <span>配送料</span>
          <span class="free-shipping">無料（CraftCommerce特典）</span>
        </div>
        <div class="summary-row">
          <span>消費税 (内税)</span>
          <span>¥{{ Math.round(cart.subtotal * 0.1).toLocaleString() }}</span>
        </div>

        <div class="summary-total-row">
          <span>合計（税込）</span>
          <span class="total-price">¥{{ cart.subtotal.toLocaleString() }}</span>
        </div>

        <NuxtLink to="/checkout" class="btn-checkout"> レジへ進む (購入手続き) → </NuxtLink>

        <NuxtLink to="/products" class="btn-continue-shopping"> ← お買い物を続ける </NuxtLink>
      </div>
    </div>

    <!-- Empty Cart -->
    <div v-else class="empty-cart-card">
      <div class="empty-cart-icon">🛒</div>
      <h2>お客様のショッピングカートは空です</h2>
      <p>職人のこだわり作品やオリジナルデジタル素材をぜひご覧ください。</p>
      <NuxtLink to="/products" class="btn-primary">商品を探す</NuxtLink>
    </div>

    <!-- Recently Viewed -->
    <RecentlyViewed />
  </div>
</template>

<style scoped>
.cart-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.cart-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 28px;
  align-items: flex-start;
}

.cart-items-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.card-header h2 {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.kv-notice {
  font-size: 0.75rem;
  color: #0284c7;
  background: #e0f2fe;
  padding: 4px 10px;
  border-radius: 9999px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cart-item-row {
  display: grid;
  grid-template-columns: 80px 1fr auto auto;
  gap: 20px;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #f8fafc;
}

.item-img-wrap {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
  position: relative;
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-img {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  text-decoration: none;
  line-height: 1.4;
}

.item-name:hover {
  color: #0284c7;
}

.item-price-unit {
  font-size: 0.8rem;
  color: #64748b;
}

.stock-warning {
  font-size: 0.75rem;
  color: #d97706;
  font-weight: 600;
}

.item-stepper-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stepper {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
}

.btn-step {
  background: none;
  border: none;
  padding: 4px 10px;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-step:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.step-val {
  padding: 0 6px;
  font-size: 0.85rem;
  font-weight: 700;
}

.btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: underline;
}

.item-line-total {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  min-width: 90px;
  text-align: right;
}

/* Summary Card */
.summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-card h3 {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #475569;
}

.free-shipping {
  color: #16a34a;
  font-weight: 600;
}

.summary-total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 14px;
  border-top: 1px solid #e2e8f0;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.total-price {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0284c7;
}

.btn-checkout {
  background: #0284c7;
  color: #ffffff;
  padding: 14px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  text-align: center;
  font-size: 1rem;
  transition: background 0.2s;
}

.btn-checkout:hover {
  background: #0369a1;
}

.btn-continue-shopping {
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
  text-decoration: none;
}

.btn-continue-shopping:hover {
  color: #0f172a;
}

/* Empty Card */
.empty-cart-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 60px 20px;
  text-align: center;
}

.empty-cart-icon {
  font-size: 3.5rem;
  margin-bottom: 12px;
}

.empty-cart-card h2 {
  font-size: 1.3rem;
  margin: 0 0 8px 0;
}

.empty-cart-card p {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 24px 0;
}

.btn-primary {
  display: inline-block;
  background: #0284c7;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 768px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
}
</style>
