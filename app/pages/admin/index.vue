<script setup lang="ts">
const { user, loggedIn } = useUserSession();
const router = useRouter();

const { data: stats, pending, refresh } = await useFetch<any>("/api/admin/stats");

const toastMessage = ref("");
let toastTimeout: any = null;

function showToast(msg: string) {
  toastMessage.value = msg;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMessage.value = "";
  }, 6000);
}

// Realtime SSE listener for admin orders!
useRealtimeAdminOrders((data) => {
  if (data?.order) {
    const o = data.order;
    showToast(
      `🔔 新しい注文が入りました！ 注文番号: ${o.orderNumber} (¥${Number(o.totalAmount).toLocaleString()})`,
    );

    // Auto-update dashboard stats dynamically
    if (stats.value) {
      stats.value.totalRevenue = (stats.value.totalRevenue || 0) + Number(o.totalAmount);
      stats.value.totalOrdersCount = (stats.value.totalOrdersCount || 0) + 1;
      stats.value.paidOrdersCount = (stats.value.paidOrdersCount || 0) + 1;
      if (!stats.value.recentOrders) stats.value.recentOrders = [];
      stats.value.recentOrders.unshift(o);
      if (stats.value.recentOrders.length > 5) {
        stats.value.recentOrders.pop();
      }
    }
  }
});

onMounted(() => {
  const currentUser = user.value as any;
  if (!loggedIn.value || currentUser?.role !== "admin") {
    router.push("/login?redirect=/admin");
  }
});
</script>

<template>
  <div class="admin-page-container">
    <AdminNav />

    <div class="admin-main-content">
      <!-- Realtime Toast Notification -->
      <div v-if="toastMessage" class="realtime-toast">
        {{ toastMessage }}
      </div>

      <div class="page-top-bar">
        <div>
          <h1 class="admin-title">📊 売上・注文ダッシュボード</h1>
          <p class="admin-subtitle">
            Cloudflare D1 と Server-Sent Events (SSE) によるリアルタイム速報
          </p>
        </div>
        <button @click="() => refresh()" class="btn-refresh">🔄 最新データ更新</button>
      </div>

      <div v-if="pending" class="loading-state">統計データを集計中...</div>

      <div v-else-if="stats" class="dashboard-body">
        <!-- Stats Cards Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">総売上金額 (Tax Incl.)</span>
            <span class="stat-val text-primary"
              >¥{{ (stats.totalRevenue || 0).toLocaleString() }}</span
            >
            <span class="stat-meta">即時決済完了済の総売上</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">総注文件数</span>
            <span class="stat-val"
              >{{ stats.totalOrdersCount || 0 }} <span class="unit">件</span></span
            >
            <span class="stat-meta"
              >決済完了: {{ stats.paidOrdersCount }}件 / 発送済:
              {{ stats.shippedOrdersCount }}件</span
            >
          </div>

          <div class="stat-card">
            <span class="stat-label">登録商品数</span>
            <span class="stat-val"
              >{{ stats.totalProductsCount || 0 }} <span class="unit">点</span></span
            >
            <span class="stat-meta">公開中のクラフトカタログ</span>
          </div>

          <div class="stat-card" :class="{ 'stat-warning': stats.lowStockCount > 0 }">
            <span class="stat-label">⚠️ 在庫僅少アラート (≤3点)</span>
            <span class="stat-val text-warn"
              >{{ stats.lowStockCount || 0 }} <span class="unit">点</span></span
            >
            <span class="stat-meta">補充が必要な作品</span>
          </div>
        </div>

        <!-- Realtime Live Stream Banner -->
        <div class="live-stream-card">
          <div class="live-head">
            <span class="pulsing-red-dot"></span>
            <strong>リアルタイム注文速報ストリーム (SSE / Nitro EventStream)</strong>
          </div>
          <p class="live-desc">
            顧客が別ブラウザ・端末から注文を確定した瞬間、ページを再読込することなく自動的に上の売上合計・注文件数がインクリメントされます。
          </p>
        </div>

        <!-- Low Stock Items Warning Box -->
        <div v-if="stats.lowStockProducts && stats.lowStockProducts.length > 0" class="admin-card">
          <div class="card-head">
            <h3>⚠️ 残り在庫が少ない作品</h3>
            <NuxtLink to="/admin/products" class="card-link">在庫を調整 →</NuxtLink>
          </div>
          <table class="admin-table">
            <thead>
              <tr>
                <th>商品名</th>
                <th>価格</th>
                <th>残り在庫数</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in stats.lowStockProducts" :key="item.id">
                <td>
                  <strong>{{ item.name }}</strong>
                </td>
                <td>¥{{ item.price.toLocaleString() }}</td>
                <td>
                  <span class="stock-pill low">{{ item.stockQuantity }} 点</span>
                </td>
                <td><span class="text-warn font-bold">要補充</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recent Orders Table -->
        <div class="admin-card">
          <div class="card-head">
            <h3>最新の注文履歴 (直近5件)</h3>
            <NuxtLink to="/admin/orders" class="card-link">すべての注文を見る →</NuxtLink>
          </div>
          <table class="admin-table">
            <thead>
              <tr>
                <th>注文番号</th>
                <th>お客様名</th>
                <th>合計金額</th>
                <th>ステータス</th>
                <th>日時</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in stats.recentOrders" :key="order.id">
                <td>
                  <code>{{ order.orderNumber }}</code>
                </td>
                <td>{{ order.customerName }}</td>
                <td>
                  <strong>¥{{ Number(order.totalAmount).toLocaleString() }}</strong>
                </td>
                <td>
                  <span class="status-badge" :class="order.status">{{
                    order.status.toUpperCase()
                  }}</span>
                </td>
                <td>{{ new Date(order.createdAt).toLocaleString() }}</td>
              </tr>
              <tr v-if="!stats.recentOrders || stats.recentOrders.length === 0">
                <td colspan="5" class="empty-cell">まだ注文はありません。</td>
              </tr>
            </tbody>
          </table>
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
  gap: 24px;
}

.realtime-toast {
  background: #16a34a;
  color: #ffffff;
  padding: 14px 20px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.3);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.page-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.admin-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
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

.dashboard-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-warning {
  border-color: #fde68a;
  background: #fffbeb;
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.stat-val {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
}

.text-primary {
  color: #0284c7;
}

.text-warn {
  color: #d97706;
}

.unit {
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
}

.stat-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}

.live-stream-card {
  background: #0f172a;
  color: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
}

.live-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.pulsing-red-dot {
  width: 8px;
  height: 8px;
  background-color: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

.live-desc {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

.admin-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.card-head {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

.card-head h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
}

.card-link {
  font-size: 0.85rem;
  color: #0284c7;
  text-decoration: none;
  font-weight: 600;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.admin-table th {
  background: #f8fafc;
  padding: 12px 20px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.admin-table td {
  padding: 12px 20px;
  border-bottom: 1px solid #f8fafc;
  color: #1e293b;
}

.stock-pill {
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.stock-pill.low {
  background: #fef3c7;
  color: #92400e;
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

.empty-cell {
  text-align: center;
  padding: 24px !important;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .admin-page-container {
    flex-direction: column;
  }
}
</style>
