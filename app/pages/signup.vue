<script setup lang="ts">
const router = useRouter();
const { fetch: fetchSession } = useUserSession();
const { fetchCart } = useCart();

const name = ref("");
const email = ref("");
const password = ref("");
const isLoading = ref(false);
const errorMessage = ref("");

async function handleRegister() {
  if (!name.value.trim() || !email.value.trim() || !password.value) {
    errorMessage.value = "すべての項目を入力してください。";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    await $fetch<{ success: boolean; user: any }>("/api/auth/register", {
      method: "POST",
      body: {
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
      },
    });

    await fetchSession();
    await fetchCart(); // Merges guest cart items automatically

    router.push("/");
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || e?.message || "会員登録に失敗しました";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <span class="auth-icon">✨</span>
        <h1>新規会員登録</h1>
        <p>CraftCommerce で特別なクラフト作品をお買い物</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label>お名前 (フルネーム):</label>
          <input
            v-model="name"
            type="text"
            class="text-input"
            placeholder="例: 佐藤 花子"
            required
          />
        </div>

        <div class="form-group">
          <label>メールアドレス:</label>
          <input
            v-model="email"
            type="email"
            class="text-input"
            placeholder="sato@example.com"
            required
          />
        </div>

        <div class="form-group">
          <label>パスワード:</label>
          <input
            v-model="password"
            type="password"
            class="text-input"
            placeholder="6文字以上の英数字"
            required
          />
        </div>

        <div v-if="errorMessage" class="error-msg">⚠️ {{ errorMessage }}</div>

        <button type="submit" :disabled="isLoading" class="btn-submit">
          {{ isLoading ? "アカウント作成中..." : "会員登録してはじめる" }}
        </button>

        <p class="auth-cart-note">
          💡 ゲスト状態でカートに入れた商品は自動的にあなたのアカウントへ統合されます。
        </p>

        <div class="auth-foot">
          すでにアカウントをお持ちですか？
          <NuxtLink to="/login" class="link-switch">ログインはこちら</NuxtLink>
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
