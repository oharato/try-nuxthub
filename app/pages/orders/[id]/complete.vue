<script setup lang="ts">
const route = useRoute();
const orderId = computed(() => route.params.id as string);

const { data: order, pending, error } = await useFetch<any>(() => `/api/orders/${orderId.value}`);
</script>

<template>
  <div v-if="pending" class="loading-state">注文情報を取得しています...</div>

  <div v-else-if="error || !order" class="error-state">
    <h2>注文が見つかりませんでした</h2>
    <NuxtLink to="/products" class="btn-primary">トップへ戻る</NuxtLink>
  </div>

  <div v-else class="complete-page">
    <div class="complete-card">
      <div class="success-icon">🎉</div>
      <h1 class="complete-title">ご注文ありがとうございました！</h1>
      <p class="complete-subtitle">
        ご注文番号: <strong>{{ order.orderNumber }}</strong>
      </p>

      <div class="order-meta-box">
        <div class="meta-row">
          <span>ご注文日時:</span>
          <span>{{ new Date(order.createdAt).toLocaleString() }}</span>
        </div>
        <div class="meta-row">
          <span>お支払い状況:</span>
          <span class="status-paid">決済完了 ({{ order.status.toUpperCase() }})</span>
        </div>
        <div class="meta-row">
          <span>お届け先:</span>
          <span>{{ order.shippingAddress || "指定なし" }}</span>
        </div>
        <div class="meta-row">
          <span>合計決済金額:</span>
          <span class="amount">¥{{ order.totalAmount.toLocaleString() }} (税込)</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="complete-actions">
        <a :href="`/api/orders/${order.id}/receipt`" target="_blank" class="btn-download-pdf">
          📄 領収書PDFをダウンロード (pdf-lib / R2)
        </a>
        <NuxtLink to="/mypage/orders" class="btn-secondary"> マイページで注文履歴を確認 </NuxtLink>
        <NuxtLink to="/products" class="btn-link"> お買い物を続ける → </NuxtLink>
      </div>

      <!-- Items List -->
      <div class="order-items-section">
        <h3>ご注文商品明細</h3>
        <div class="items-table">
          <div v-for="item in order.items" :key="item.id" class="item-row">
            <div class="item-img-mini">
              <img
                v-if="item.productImage"
                :src="`/api/blob/${encodeURIComponent(item.productImage)}`"
                :alt="item.productName"
              />
              <span v-else>🏺</span>
            </div>
            <div class="item-name-qty">
              <strong>{{ item.productName }}</strong>
              <span>数量: {{ item.quantity }}</span>
            </div>
            <div class="item-subtotal">
              ¥{{ (item.priceAtPurchase * item.quantity).toLocaleString() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.complete-page {
  max-width: 760px;
  margin: 0 auto;
}

.complete-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.success-icon {
  font-size: 3.5rem;
  margin-bottom: 12px;
}

.complete-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.complete-subtitle {
  font-size: 1.05rem;
  color: #64748b;
  margin: 0 0 28px 0;
}

.order-meta-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #475569;
}

.status-paid {
  color: #16a34a;
  font-weight: 700;
}

.amount {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0284c7;
}

.complete-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 36px;
}

.btn-download-pdf {
  background: #0284c7;
  color: #ffffff;
  padding: 14px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 700;
  transition: background 0.2s;
}

.btn-download-pdf:hover {
  background: #0369a1;
}

.btn-secondary {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-link {
  color: #0284c7;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
}

.order-items-section {
  text-align: left;
  border-top: 1px solid #f1f5f9;
  padding-top: 24px;
}

.order-items-section h3 {
  font-size: 1.1rem;
  margin: 0 0 16px 0;
}

.items-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f8fafc;
}

.item-img-mini {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: #f1f5f9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-img-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-name-qty {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name-qty strong {
  font-size: 0.9rem;
  color: #0f172a;
}

.item-name-qty span {
  font-size: 0.8rem;
  color: #64748b;
}

.item-subtotal {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}
</style>
