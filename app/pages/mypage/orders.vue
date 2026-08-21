<script setup lang="ts">
const { loggedIn, user } = useUserSession();
const router = useRouter();

const { data: orders, pending, error } = await useFetch<any[]>("/api/orders/my");

onMounted(() => {
  if (!loggedIn.value) {
    router.push("/login?redirect=/mypage/orders");
  }
});
</script>

<template>
  <div class="mypage-orders">
    <div class="page-header">
      <div>
        <h1 class="page-title">👤 注文履歴・領収書一覧</h1>
        <p class="page-subtitle">過去のご注文履歴の確認および領収書PDFのダウンロードが行えます</p>
      </div>
      <NuxtLink to="/products" class="btn-primary">作品を探す</NuxtLink>
    </div>

    <div v-if="pending" class="loading-state">注文履歴を読み込んでいます...</div>

    <div v-else-if="orders && orders.length > 0" class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-card-head">
          <div class="head-left">
            <span class="order-number">注文番号: {{ order.orderNumber }}</span>
            <span class="order-date">{{ new Date(order.createdAt).toLocaleString() }}</span>
          </div>
          <div class="head-right">
            <span class="status-badge" :class="order.status">{{ order.status.toUpperCase() }}</span>
            <a :href="`/api/orders/${order.id}/receipt`" target="_blank" class="btn-receipt">
              📄 領収書PDF
            </a>
          </div>
        </div>

        <div class="order-items-grid">
          <div v-for="item in order.items" :key="item.id" class="order-item-row">
            <div class="order-item-img">
              <img
                v-if="item.productImage"
                :src="`/api/blob/${encodeURIComponent(item.productImage)}`"
                :alt="item.productName"
              />
              <span v-else>🏺</span>
            </div>
            <div class="order-item-info">
              <NuxtLink :to="`/products/${item.productSlug}`" class="item-title">
                {{ item.productName }}
              </NuxtLink>
              <span class="item-qty-price">
                ¥{{ item.priceAtPurchase.toLocaleString() }} × {{ item.quantity }}点
              </span>
            </div>
            <span class="item-total">
              ¥{{ (item.priceAtPurchase * item.quantity).toLocaleString() }}
            </span>
          </div>
        </div>

        <div class="order-card-foot">
          <span class="total-label">お支払い総額:</span>
          <span class="total-amount">¥{{ order.totalAmount.toLocaleString() }} (税込)</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-orders-card">
      <p class="empty-icon">📦</p>
      <h3>まだご注文履歴がありません</h3>
      <p>CraftCommerce でこだわりの作品を見つけてみませんか？</p>
      <NuxtLink to="/products" class="btn-primary">商品カタログを見る</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.mypage-orders {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
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

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.order-card-head {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.head-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.order-number {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.order-date {
  font-size: 0.8rem;
  color: #64748b;
}

.head-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}

.status-badge.paid {
  background: #dcfce7;
  color: #166534;
}

.status-badge.shipped {
  background: #e0f2fe;
  color: #075985;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.btn-receipt {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0284c7;
  padding: 6px 12px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.15s;
}

.btn-receipt:hover {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.order-items-grid {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-item-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.order-item-img {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  background: #f1f5f9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
  text-decoration: none;
}

.item-title:hover {
  color: #0284c7;
}

.item-qty-price {
  font-size: 0.8rem;
  color: #64748b;
}

.item-total {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.order-card-foot {
  border-top: 1px solid #f1f5f9;
  padding: 14px 20px;
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 8px;
  background: #fafaf9;
}

.total-label {
  font-size: 0.85rem;
  color: #64748b;
}

.total-amount {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0284c7;
}

.empty-orders-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.btn-primary {
  background: #0284c7;
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
}
</style>
