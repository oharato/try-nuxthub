<script setup lang="ts">
const router = useRouter();
const { cart, fetchCart } = useCart();
const { loggedIn, user } = useUserSession();

const customerName = ref("");
const customerEmail = ref("");
const shippingAddress = ref("東京都渋谷区神宮前 1-2-3 クラフトレジデンス 401");
const paymentMethod = ref("mock_credit_card");
const isSubmitting = ref(false);
const errorMessage = ref("");

onMounted(async () => {
  await fetchCart();
  if (cart.value.items.length === 0) {
    router.push("/cart");
  }

  if (loggedIn.value && user.value) {
    const u = user.value as any;
    customerName.value = u.name || "";
    customerEmail.value = u.email || "";
  } else {
    customerName.value = "山田 太郎";
    customerEmail.value = "guest@example.com";
  }
});

async function handlePlaceOrder() {
  if (!customerName.value.trim() || !customerEmail.value.trim()) {
    errorMessage.value = "お名前とメールアドレスを入力してください。";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    const res = await $fetch<{
      success: boolean;
      order: { id: number; orderNumber: string; totalAmount: number };
    }>("/api/orders", {
      method: "POST",
      body: {
        customerName: customerName.value.trim(),
        customerEmail: customerEmail.value.trim(),
        shippingAddress: shippingAddress.value.trim(),
      },
    });

    await fetchCart(); // Cart is cleared
    router.push(`/orders/${res.order.id}/complete`);
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || e?.message || "注文処理中にエラーが発生しました";
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="checkout-page">
    <h1 class="page-title">💳 ご注文手続き (チェックアウト)</h1>

    <div class="checkout-layout">
      <!-- Checkout Form Column -->
      <div class="checkout-form-card">
        <section class="form-section">
          <h2>1. お届け先・お客様情報</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>お名前 (フルネーム):</label>
              <input
                v-model="customerName"
                type="text"
                class="text-input"
                placeholder="例: 山田 太郎"
                required
              />
            </div>
            <div class="form-group">
              <label>メールアドレス (注文確認メール送信用):</label>
              <input
                v-model="customerEmail"
                type="email"
                class="text-input"
                placeholder="例: yamada@example.com"
                required
              />
            </div>
            <div class="form-group full-width">
              <label>お届け先住所:</label>
              <input
                v-model="shippingAddress"
                type="text"
                class="text-input"
                placeholder="例: 東京都渋谷区..."
                required
              />
            </div>
          </div>
        </section>

        <section class="form-section">
          <h2>2. お支払い方法（決済シミュレーション）</h2>
          <div class="payment-options">
            <label
              class="payment-card-option"
              :class="{ 'option-selected': paymentMethod === 'mock_credit_card' }"
            >
              <input type="radio" v-model="paymentMethod" value="mock_credit_card" />
              <div class="option-content">
                <strong>💳 クレジットカード決済（モック即時決済）</strong>
                <p>テスト検証用のため、外部通信を行わず即座に status: 'paid' で決済完了します。</p>
              </div>
            </label>
            <label
              class="payment-card-option"
              :class="{ 'option-selected': paymentMethod === 'mock_apple_pay' }"
            >
              <input type="radio" v-model="paymentMethod" value="mock_apple_pay" />
              <div class="option-content">
                <strong>🍎 Apple Pay / Google Pay（モック決済）</strong>
                <p>ワンクリックで即時承認されます。</p>
              </div>
            </label>
          </div>
        </section>

        <div v-if="errorMessage" class="error-box">⚠️ {{ errorMessage }}</div>
      </div>

      <!-- Order Review Column -->
      <div class="checkout-summary-card">
        <h3>ご注文内容の確認</h3>

        <div class="summary-items-list">
          <div v-for="item in cart.items" :key="item.productId" class="summary-item">
            <div class="summary-item-img">
              <img
                v-if="item.image"
                :src="`/api/blob/${encodeURIComponent(item.image)}`"
                :alt="item.name"
              />
              <span v-else>🏺</span>
            </div>
            <div class="summary-item-info">
              <span class="name">{{ item.name }}</span>
              <span class="qty-price"
                >数量: {{ item.quantity }} × ¥{{ item.price.toLocaleString() }}</span
              >
            </div>
            <span class="line-total">¥{{ item.lineTotal.toLocaleString() }}</span>
          </div>
        </div>

        <div class="summary-calculation">
          <div class="calc-row">
            <span>小計</span>
            <span>¥{{ cart.subtotal.toLocaleString() }}</span>
          </div>
          <div class="calc-row">
            <span>配送料</span>
            <span class="free-text">無料</span>
          </div>
          <div class="calc-total-row">
            <span>お支払い総額</span>
            <span class="total-price">¥{{ cart.subtotal.toLocaleString() }}</span>
          </div>
        </div>

        <button
          @click="handlePlaceOrder"
          :disabled="isSubmitting || cart.items.length === 0"
          class="btn-place-order"
        >
          {{ isSubmitting ? "決済処理・注文確定中..." : "注文を確定する (決済完了)" }}
        </button>

        <p class="order-notice">
          ※
          注文確定後、DBトランザクションにより在庫が引き当てられ、自動でPDF領収書の生成・注文完了メール送信ジョブが投入されます。
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-page {
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

.checkout-layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 32px;
  align-items: flex-start;
}

.checkout-form-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-section h2 {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.full-width {
  grid-column: span 2;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.text-input {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
}

.text-input:focus {
  border-color: #0284c7;
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-card-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-card-option:hover {
  background: #f8fafc;
}

.option-selected {
  border-color: #0284c7;
  background: #f0f9ff;
}

.option-content strong {
  display: block;
  font-size: 0.95rem;
  margin-bottom: 4px;
  color: #0f172a;
}

.option-content p {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.error-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
}

/* Summary Card */
.checkout-summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.checkout-summary-card h3 {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.summary-items-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 280px;
  overflow-y: auto;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-item-img {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  background: #f1f5f9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.summary-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-item-info .name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f172a;
}

.summary-item-info .qty-price {
  font-size: 0.75rem;
  color: #64748b;
}

.line-total {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.summary-calculation {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #475569;
}

.free-text {
  color: #16a34a;
  font-weight: 600;
}

.calc-total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  font-weight: 700;
  font-size: 1rem;
}

.total-price {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0284c7;
}

.btn-place-order {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 16px;
  border-radius: 8px;
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-place-order:hover {
  background: #0369a1;
}

.btn-place-order:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.order-notice {
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 768px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }
}
</style>
