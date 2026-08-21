<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const { fetch: fetchSession } = useUserSession();
const { fetchCart } = useCart();

const email = ref("user@example.com");
const password = ref("password123");
const isLoading = ref(false);
const errorMessage = ref("");

function fillAdmin() {
  email.value = "admin@example.com";
  password.value = "password123";
}

function fillUser() {
  email.value = "user@example.com";
  password.value = "password123";
}

async function handleLogin() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const res = await $fetch<{ success: boolean; user: any }>("/api/auth/login", {
      method: "POST",
      body: {
        email: email.value,
        password: password.value,
      },
    });

    await fetchSession();
    await fetchCart(); // Updates cart with merged items

    const redirectPath =
      (route.query.redirect as string) || (res.user.role === "admin" ? "/admin" : "/");
    router.push(redirectPath);
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || e?.message || "ログインに失敗しました";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <span class="auth-icon">🔐</span>
        <h1>ログイン</h1>
        <p>CraftCommerce アカウントへサインイン</p>
      </div>

      <!-- Quick Test Fill Buttons -->
      <div class="test-fill-box">
        <span class="test-fill-title">⚡ 検証用アカウント即時入力:</span>
        <div class="test-fill-btns">
          <button type="button" @click="fillAdmin" class="btn-test-fill">
            👑 管理者 (admin@example.com)
          </button>
          <button type="button" @click="fillUser" class="btn-test-fill">
            👤 一般会員 (user@example.com)
          </button>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>メールアドレス:</label>
          <input
            v-model="email"
            type="email"
            class="text-input"
            placeholder="example@domain.com"
            required
          />
        </div>

        <div class="form-group">
          <label>パスワード:</label>
          <input
            v-model="password"
            type="password"
            class="text-input"
            placeholder="••••••••"
            required
          />
        </div>

        <div v-if="errorMessage" class="error-msg">⚠️ {{ errorMessage }}</div>

        <button type="submit" :disabled="isLoading" class="btn-submit">
          {{ isLoading ? "ログイン中..." : "ログイン" }}
        </button>

        <p class="auth-cart-note">
          💡
          ゲスト状態でカートに追加した商品は、ログイン時に自動であなたのアカウントへマージされます。
        </p>

        <div class="auth-foot">
          アカウントをお持ちでないですか？
          <NuxtLink to="/signup" class="link-switch">新規会員登録はこちら</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  max-width: 480px;
  margin: 40px auto;
}

.auth-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 36px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;
}

.auth-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
  display: inline-block;
}

.auth-header h1 {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 6px 0;
}

.auth-header p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.test-fill-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}

.test-fill-title {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 8px;
}

.test-fill-btns {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn-test-fill {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-test-fill:hover {
  background: #e0f2fe;
  border-color: #0284c7;
  color: #0284c7;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.text-input {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
}

.text-input:focus {
  border-color: #0284c7;
}

.error-msg {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
}

.btn-submit {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-submit:hover {
  background: #0369a1;
}

.auth-cart-note {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
  text-align: center;
}

.auth-foot {
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 8px;
}

.link-switch {
  color: #0284c7;
  font-weight: 700;
  text-decoration: underline;
  margin-left: 4px;
}
</style>
