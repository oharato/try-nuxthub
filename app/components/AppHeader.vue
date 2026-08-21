<script setup lang="ts">
const { loggedIn, user, clear, fetch: fetchSession } = useUserSession();
const { cart, fetchCart } = useCart();
const router = useRouter();

const currentUser = computed(() => user.value as Record<string, any> | null);
const isAdmin = computed(() => currentUser.value?.role === "admin");
const searchQuery = ref("");

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: "/products", query: { search: searchQuery.value.trim() } });
  } else {
    router.push("/products");
  }
}

async function handleLogout() {
  try {
    await $fetch("/api/auth/logout", { method: "POST" });
    await clear();
    await fetchSession();
    await fetchCart();
    router.push("/");
  } catch (e) {
    console.error("Logout error:", e);
  }
}

onMounted(() => {
  fetchSession();
  fetchCart();
});
</script>

<template>
  <header class="app-header">
    <div class="header-top">
      <div class="header-container">
        <!-- Logo -->
        <NuxtLink to="/" class="logo-link">
          <span class="logo-icon">🏺</span>
          <div class="logo-text-group">
            <span class="logo-title">CraftCommerce</span>
            <span class="logo-subtitle">モダン・クラフトストア</span>
          </div>
        </NuxtLink>

        <!-- Search Bar -->
        <div class="search-form-wrap">
          <form @submit.prevent="handleSearch" class="search-form">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="こだわりの作品・家具・フォントを検索..."
              class="search-input"
            />
            <button type="submit" class="search-btn" title="検索">🔍</button>
          </form>
        </div>

        <!-- Action Links & User Menu -->
        <div class="header-actions">
          <NuxtLink to="/products" class="nav-action-link"> 📦 商品一覧 </NuxtLink>

          <!-- Admin link if admin -->
          <NuxtLink v-if="isAdmin" to="/admin" class="nav-action-link admin-pill">
            ⚙️ 管理画面
          </NuxtLink>

          <!-- Cart Button -->
          <NuxtLink to="/cart" class="cart-btn" title="ショッピングカート">
            <span class="cart-icon">🛒</span>
            <span class="cart-label">カート</span>
            <span v-if="cart.totalCount > 0" class="cart-badge">{{ cart.totalCount }}</span>
          </NuxtLink>

          <!-- Auth Links -->
          <div v-if="loggedIn && currentUser" class="user-menu">
            <NuxtLink to="/mypage/orders" class="user-greeting" title="マイページ・注文履歴">
              👤 <strong>{{ currentUser.name }}</strong>
            </NuxtLink>
            <button @click="handleLogout" class="btn-logout-mini">ログアウト</button>
          </div>
          <div v-else class="auth-links">
            <NuxtLink to="/login" class="btn-login-mini">ログイン</NuxtLink>
            <NuxtLink to="/signup" class="btn-signup-mini">新規登録</NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Nav Bar -->
    <nav class="category-nav">
      <div class="header-container nav-scroll">
        <NuxtLink
          to="/products"
          class="cat-link"
          active-class="cat-link-active"
          :class="{ 'cat-link-active': !$route.query.category && $route.path === '/products' }"
        >
          すべて
        </NuxtLink>
        <NuxtLink
          to="/products?category=craft-art"
          class="cat-link"
          :class="{ 'cat-link-active': $route.query.category === 'craft-art' }"
        >
          🧶 クラフト・雑貨
        </NuxtLink>
        <NuxtLink
          to="/products?category=woodwork"
          class="cat-link"
          :class="{ 'cat-link-active': $route.query.category === 'woodwork' }"
        >
          🪵 木工家具
        </NuxtLink>
        <NuxtLink
          to="/products?category=ceramics"
          class="cat-link"
          :class="{ 'cat-link-active': $route.query.category === 'ceramics' }"
        >
          🏺 陶芸・ガラス
        </NuxtLink>
        <NuxtLink
          to="/products?category=leather"
          class="cat-link"
          :class="{ 'cat-link-active': $route.query.category === 'leather' }"
        >
          👜 レザーアイテム
        </NuxtLink>
        <NuxtLink
          to="/products?category=digital"
          class="cat-link"
          :class="{ 'cat-link-active': $route.query.category === 'digital' }"
        >
          🎨 デジタル素材
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-top {
  padding: 14px 0;
  border-bottom: 1px solid #f1f5f9;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #0f172a;
}

.logo-icon {
  font-size: 1.75rem;
}

.logo-text-group {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0284c7;
}

.logo-subtitle {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
}

.search-form-wrap {
  flex: 1;
  max-width: 440px;
  margin: 0 24px;
}

.search-form {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  padding: 4px 6px 4px 14px;
  transition: all 0.2s;
}

.search-form:focus-within {
  border-color: #0284c7;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: #0f172a;
}

.search-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-action-link {
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  transition: color 0.2s;
}

.nav-action-link:hover {
  color: #0284c7;
}

.admin-pill {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.8rem;
}

.admin-pill:hover {
  background: #dcfce7;
  color: #15803d;
}

.cart-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #0284c7;
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 9999px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  position: relative;
  transition: background 0.2s;
}

.cart-btn:hover {
  background: #0369a1;
}

.cart-badge {
  background: #ef4444;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 9999px;
  line-height: 1;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-greeting {
  font-size: 0.85rem;
  color: #334155;
  text-decoration: none;
}

.user-greeting:hover {
  color: #0284c7;
}

.btn-logout-mini {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-logout-mini:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.auth-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-login-mini {
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0284c7;
  padding: 6px 12px;
}

.btn-signup-mini {
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffffff;
  background: #0f172a;
  padding: 6px 12px;
  border-radius: 6px;
}

.category-nav {
  background: #fafaf9;
  padding: 8px 0;
  overflow-x: auto;
}

.nav-scroll {
  display: flex;
  gap: 16px;
  white-space: nowrap;
}

.cat-link {
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  padding: 4px 10px;
  border-radius: 6px;
  transition: all 0.15s;
}

.cat-link:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.cat-link-active {
  color: #0284c7 !important;
  background: #e0f2fe !important;
}

@media (max-width: 768px) {
  .search-form-wrap {
    display: none;
  }
}
</style>
