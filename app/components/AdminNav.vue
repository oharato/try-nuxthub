<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <aside class="admin-sidebar">
    <div class="sidebar-head">
      <span class="admin-badge">Admin Backoffice</span>
      <h2>管理ダッシュボード</h2>
    </div>

    <nav class="admin-nav-menu">
      <NuxtLink
        to="/admin"
        class="nav-item"
        :class="{ 'nav-item-active': route.path === '/admin' }"
      >
        <span class="icon">📊</span> 売上・注文速報
      </NuxtLink>
      <NuxtLink
        to="/admin/products"
        class="nav-item"
        :class="{ 'nav-item-active': route.path === '/admin/products' }"
      >
        <span class="icon">📦</span> 商品管理・在庫
      </NuxtLink>
      <NuxtLink
        to="/admin/products/new"
        class="nav-item"
        :class="{ 'nav-item-active': route.path === '/admin/products/new' }"
      >
        <span class="icon">➕</span> 商品新規登録
      </NuxtLink>
      <NuxtLink
        to="/admin/orders"
        class="nav-item"
        :class="{ 'nav-item-active': route.path === '/admin/orders' }"
      >
        <span class="icon">📑</span> 注文一覧・発送
      </NuxtLink>
      <NuxtLink
        to="/admin/jobs"
        class="nav-item"
        :class="{ 'nav-item-active': route.path === '/admin/jobs' }"
      >
        <span class="icon">⚙️</span> ジョブ監視・集計
      </NuxtLink>
      <NuxtLink
        to="/admin/cache"
        class="nav-item"
        :class="{ 'nav-item-active': route.path === '/admin/cache' }"
      >
        <span class="icon">⚡</span> キャッシュ管理
      </NuxtLink>
    </nav>

    <div class="sidebar-foot">
      <NuxtLink to="/" class="btn-back-shop"> 🌐 ショップ画面に戻る </NuxtLink>
    </div>
  </aside>
</template>

<style scoped>
.admin-sidebar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 260px;
  flex-shrink: 0;
}

.sidebar-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #16a34a;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 9999px;
  align-self: flex-start;
}

.sidebar-head h2 {
  font-size: 1.15rem;
  font-weight: 800;
  margin: 4px 0 0 0;
  color: #0f172a;
}

.admin-nav-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
  transition: all 0.15s;
}

.nav-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.nav-item-active {
  background: #0284c7 !important;
  color: #ffffff !important;
}

.nav-item .icon {
  font-size: 1.1rem;
}

.sidebar-foot {
  margin-top: auto;
  border-top: 1px solid #f1f5f9;
  padding-top: 16px;
}

.btn-back-shop {
  display: block;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0284c7;
  text-decoration: none;
  padding: 8px;
  border-radius: 6px;
  background: #f0f9ff;
}

.btn-back-shop:hover {
  background: #e0f2fe;
}
</style>
