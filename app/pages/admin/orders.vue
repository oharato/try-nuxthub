<script setup lang="ts">
const { user, loggedIn } = useUserSession();
const router = useRouter();

const { data: orders, pending, refresh } = await useFetch<any[]>("/api/admin/orders");

const updatingId = ref<number | null>(null);
const successMessage = ref("");

async function updateOrderStatus(orderId: number, newStatus: string) {
  updatingId.value = orderId;
  try {
    await $fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      body: { status: newStatus },
    });
    if (orders.value) {
      const target = orders.value.find((o) => o.id === orderId);
      if (target) {
        target.status = newStatus;
      }
    }
    successMessage.value = `注文 (ID: ${orderId}) のステータスを「${newStatus.toUpperCase()}」に更新しました`;
    setTimeout(() => (successMessage.value = ""), 3000);
  } catch (e: any) {
    alert(e?.data?.statusMessage || "ステータスの更新に失敗しました");
  } finally {
    updatingId.value = null;
  }
}

onMounted(() => {
  const currentUser = user.value as any;
  if (!loggedIn.value || currentUser?.role !== "admin") {
    router.push("/login?redirect=/admin/orders");
  }
});
</script>

<template>
  <div class="admin-page-container">
    <AdminNav />

    <div class="admin-main-content">
      <div class="page-top-bar">
        <div>
          <h1 class="admin-title">📑 注文管理・発送ステータス更新</h1>
          <p class="admin-subtitle">
            全注文の確認、発送ステータスの更新、領収書PDFの確認が行えます。
          </p>
        </div>
        <button @click="() => refresh()" class="btn-refresh">🔄 リスト再読み込み</button>
      </div>

      <div v-if="successMessage" class="toast-success">✅ {{ successMessage }}</div>

      <div class="admin-card">
        <div v-if="pending" class="loading-state">注文一覧を取得中...</div>

        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>注文番号 / ID</th>
              <th>お客様情報</th>
              <th>商品内訳</th>
              <th>合計金額</th>
              <th>現在のステータス</th>
              <th>ステータス変更</th>
              <th>領収書</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>
                <strong class="order-num">{{ order.orderNumber }}</strong>
                <span class="order-time">{{ new Date(order.createdAt).toLocaleString() }}</span>
              </td>
              <td>
                <strong class="cust-name">{{ order.customerName }}</strong>
                <span class="cust-email">{{ order.customerEmail }}</span>
                <span v-if="order.shippingAddress" class="cust-addr">{{
                  order.shippingAddress
                }}</span>
              </td>
              <td>
                <div class="items-mini-list">
                  <span v-for="it in order.items" :key="it.id" class="item-chip">
                    {{ it.productName }} (×{{ it.quantity }})
                  </span>
                </div>
              </td>
              <td>
                <strong class="total-amount">¥{{ order.totalAmount.toLocaleString() }}</strong>
              </td>
              <td>
                <span class="status-badge" :class="order.status">{{
                  order.status.toUpperCase()
                }}</span>
              </td>
              <td>
                <select
                  :value="order.status"
                  @change="(e: any) => updateOrderStatus(order.id, e.target.value)"
                  :disabled="updatingId === order.id"
                  class="status-select"
                >
                  <option value="paid">PAID (決済完了)</option>
                  <option value="shipped">SHIPPED (発送済み)</option>
                  <option value="cancelled">CANCELLED (キャンセル)</option>
                </select>
              </td>
              <td>
                <a
                  :href="`/api/orders/${order.id}/receipt`"
                  target="_blank"
                  class="btn-receipt-link"
                >
                  📄 PDF
                </a>
              </td>
            </tr>
            <tr v-if="!orders || orders.length === 0">
              <td colspan="7" class="empty-cell">まだ注文がありません。</td>
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

.btn-refresh {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
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

.order-num {
  display: block;
  font-size: 0.85rem;
  color: #0f172a;
}

.order-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

.cust-name {
  display: block;
  font-size: 0.85rem;
}

.cust-email,
.cust-addr {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.items-mini-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-chip {
  font-size: 0.75rem;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.total-amount {
  font-size: 0.95rem;
  color: #0284c7;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}

.status-badge.paid {
  background: #dcfce7;
  color: #166534;
}
.status-badge.shipped {
  background: #e0f2fe;
  color: #0369a1;
}
.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-select {
  padding: 4px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  background: #ffffff;
}

.btn-receipt-link {
  color: #0284c7;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 700;
  background: #e0f2fe;
  padding: 4px 8px;
  border-radius: 4px;
}

.empty-cell {
  text-align: center;
  padding: 32px !important;
  color: #94a3b8;
}
</style>
