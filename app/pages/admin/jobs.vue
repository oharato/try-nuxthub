<script setup lang="ts">
const { user, loggedIn } = useUserSession();
const router = useRouter();

const { data: logs, pending, refresh } = await useFetch<any[]>("/api/admin/jobs/logs");

const isRunningDailyReport = ref(false);
const triggerMessage = ref("");

async function triggerDailyReport() {
  isRunningDailyReport.value = true;
  triggerMessage.value = "";
  try {
    const res = await $fetch<{ success: boolean; report: any }>("/api/admin/jobs/daily-report", {
      method: "POST",
    });
    triggerMessage.value = `日次売上集計ジョブが完了しました（売上総額: ¥${res.report.totalRevenue.toLocaleString()} / 対象注文数: ${res.report.paidOrdersCount}件）`;
    await refresh();
  } catch (e: any) {
    alert(e?.data?.statusMessage || "ジョブの実行に失敗しました");
  } finally {
    isRunningDailyReport.value = false;
  }
}

onMounted(() => {
  const currentUser = user.value as any;
  if (!loggedIn.value || currentUser?.role !== "admin") {
    router.push("/login?redirect=/admin/jobs");
  }
});
</script>

<template>
  <div class="admin-page-container">
    <AdminNav />

    <div class="admin-main-content">
      <div class="page-top-bar">
        <div>
          <h1 class="admin-title">⚙️ 非同期ジョブ監視 & バッチ実行</h1>
          <p class="admin-subtitle">
            メール送信・PDF帳票生成・売上集計ジョブの実行履歴（<code>JobLog</code>）を管理します。
          </p>
        </div>
        <div class="top-actions">
          <button
            @click="triggerDailyReport"
            :disabled="isRunningDailyReport"
            class="btn-trigger-job"
          >
            {{ isRunningDailyReport ? "集計バッチ実行中..." : "▶️ 日次売上集計を手動実行" }}
          </button>
          <button @click="() => refresh()" class="btn-refresh">🔄 ログ更新</button>
        </div>
      </div>

      <div v-if="triggerMessage" class="toast-success">✅ {{ triggerMessage }}</div>

      <div class="admin-card">
        <div class="card-head">
          <h3>ジョブ実行ログ一覧 (最新順)</h3>
        </div>

        <div v-if="pending" class="loading-state">ジョブログを取得しています...</div>

        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ジョブ種別 (Job Type)</th>
              <th>ステータス</th>
              <th>ペイロード (Payload)</th>
              <th>投入日時</th>
              <th>完了日時</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ log.id }}</td>
              <td>
                <span class="job-type-badge" :class="log.jobType">
                  {{ log.jobType }}
                </span>
              </td>
              <td>
                <span class="status-pill" :class="log.status">
                  {{ log.status.toUpperCase() }}
                </span>
              </td>
              <td>
                <pre class="payload-box">{{ log.payload }}</pre>
              </td>
              <td>{{ new Date(log.createdAt).toLocaleString() }}</td>
              <td>{{ log.finishedAt ? new Date(log.finishedAt).toLocaleString() : "-" }}</td>
            </tr>
            <tr v-if="!logs || logs.length === 0">
              <td colspan="6" class="empty-cell">
                ジョブログはまだありません。注文を行うと自動でログが記録されます。
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

.top-actions {
  display: flex;
  gap: 10px;
}

.btn-trigger-job {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-trigger-job:hover {
  background: #0369a1;
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

.card-head {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-head h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
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
  vertical-align: top;
}

.job-type-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f1f5f9;
}

.job-type-badge.order_confirmation_mail {
  background: #e0f2fe;
  color: #0369a1;
}

.job-type-badge.receipt_generation {
  background: #fef3c7;
  color: #92400e;
}

.job-type-badge.daily_sales_report {
  background: #ede9fe;
  color: #6d28d9;
}

.status-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-pill.completed {
  background: #dcfce7;
  color: #166534;
}
.status-pill.running {
  background: #e0f2fe;
  color: #0369a1;
}
.status-pill.queued {
  background: #fef3c7;
  color: #92400e;
}
.status-pill.failed {
  background: #fee2e2;
  color: #991b1b;
}

.payload-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.75rem;
  max-width: 320px;
  max-height: 80px;
  overflow-y: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-cell {
  text-align: center;
  padding: 32px !important;
  color: #94a3b8;
}
</style>
