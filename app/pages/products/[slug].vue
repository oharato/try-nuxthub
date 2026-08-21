<script setup lang="ts">
const route = useRoute();
const slug = computed(() => route.params.slug as string);

const {
  data: product,
  pending,
  error,
  refresh,
} = await useFetch<any>(() => `/api/products/${slug.value}`);
const { addToCart } = useCart();
const { loggedIn, user } = useUserSession();

const activeImageIndex = ref(0);
const quantity = ref(1);
const isAdding = ref(false);
const addSuccessMessage = ref("");

// Review form state
const newRating = ref(5);
const newComment = ref("");
const isSubmittingReview = ref(false);
const reviewSuccess = ref("");
const reviewError = ref("");

// Realtime SSE listener for stock changes on this product!
useRealtimeInventory((data) => {
  if (product.value && product.value.id === data.productId) {
    product.value.stockQuantity = data.stockQuantity;
  }
});

const currentImages = computed(() => {
  if (!product.value?.images || product.value.images.length === 0) return [];
  return product.value.images;
});

const activeImage = computed(() => {
  if (currentImages.value.length === 0) return null;
  return currentImages.value[activeImageIndex.value]?.blobKey || null;
});

async function handleAddToCart() {
  if (!product.value || product.value.stockQuantity <= 0) return;
  isAdding.value = true;
  addSuccessMessage.value = "";
  const success = await addToCart(product.value.id, quantity.value);
  if (success) {
    addSuccessMessage.value = `「${product.value.name}」を ${quantity.value}点 カートに追加しました！`;
    setTimeout(() => {
      addSuccessMessage.value = "";
    }, 4000);
  }
  isAdding.value = false;
}

async function submitReview() {
  if (!loggedIn.value) {
    reviewError.value = "レビューを投稿するにはログインしてください。";
    return;
  }
  isSubmittingReview.value = true;
  reviewError.value = "";
  reviewSuccess.value = "";

  try {
    const created = await $fetch<any>(`/api/products/${slug.value}/reviews`, {
      method: "POST",
      body: {
        rating: newRating.value,
        comment: newComment.value,
      },
    });

    if (product.value) {
      if (!product.value.reviews) product.value.reviews = [];
      product.value.reviews.unshift(created);
      product.value.reviewCount = (product.value.reviewCount || 0) + 1;
    }

    newComment.value = "";
    newRating.value = 5;
    reviewSuccess.value = "レビューをご投稿いただきありがとうございました！";
  } catch (e: any) {
    reviewError.value = e?.data?.statusMessage || e?.message || "レビューの投稿に失敗しました";
  } finally {
    isSubmittingReview.value = false;
  }
}
</script>

<template>
  <div v-if="pending" class="loading-state">商品情報を読み込んでいます...</div>

  <div v-else-if="error || !product" class="error-state">
    <h2>商品が見つかりませんでした</h2>
    <p>指定された商品は削除されたか、非公開になっています。</p>
    <NuxtLink to="/products" class="btn-primary">商品一覧へ戻る</NuxtLink>
  </div>

  <div v-else class="product-detail-page">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <NuxtLink to="/">トップ</NuxtLink>
      <span class="sep">/</span>
      <NuxtLink to="/products">商品一覧</NuxtLink>
      <span class="sep">/</span>
      <NuxtLink v-if="product.category" :to="`/products?category=${product.category.slug}`">
        {{ product.category.name }}
      </NuxtLink>
      <span class="sep">/</span>
      <span class="current">{{ product.name }}</span>
    </nav>

    <!-- Main Product View -->
    <div class="product-main-grid">
      <!-- Gallery Column -->
      <div class="gallery-column">
        <div class="main-image-wrap">
          <img
            v-if="activeImage"
            :src="`/api/blob/${encodeURIComponent(activeImage)}`"
            :alt="product.name"
            class="main-img"
          />
          <div v-else class="placeholder-main">🏺</div>

          <!-- Stock overlay badge -->
          <div class="detail-stock-badge-wrap">
            <span v-if="product.stockQuantity <= 0" class="badge-out">売り切れ (完売)</span>
            <span v-else-if="product.stockQuantity <= 3" class="badge-low">
              🔥 残りわずか (残り {{ product.stockQuantity }} 点)
            </span>
            <span v-else class="badge-in">在庫あり (即納可)</span>
          </div>
        </div>

        <!-- Thumbnail Selector -->
        <div v-if="currentImages.length > 1" class="thumbnail-strip">
          <button
            v-for="(img, idx) in currentImages"
            :key="img.id"
            @click="activeImageIndex = Number(idx)"
            class="thumb-btn"
            :class="{ 'thumb-active': activeImageIndex === Number(idx) }"
          >
            <img
              :src="`/api/blob/${encodeURIComponent(img.blobKey)}`"
              :alt="`Thumbnail ${Number(idx) + 1}`"
            />
          </button>
        </div>
      </div>

      <!-- Info & Purchase Column -->
      <div class="info-column">
        <div v-if="product.category" class="category-chip">
          {{ product.category.name }}
        </div>

        <h1 class="detail-title">{{ product.name }}</h1>

        <!-- Rating row -->
        <div class="detail-rating-row">
          <span class="stars">★ {{ product.averageRating }}</span>
          <span class="review-count">({{ product.reviewCount || 0 }}件のカスタマーレビュー)</span>
        </div>

        <div class="detail-price-box">
          <span class="detail-currency">¥</span>
          <span class="detail-price">{{ product.price.toLocaleString() }}</span>
          <span class="detail-tax">税込（送料無料）</span>
        </div>

        <!-- Realtime Stock Notification Card -->
        <div
          class="realtime-status-card"
          :class="{
            'card-low': product.stockQuantity <= 3 && product.stockQuantity > 0,
            'card-out': product.stockQuantity <= 0,
          }"
        >
          <div class="status-indicator">
            <span class="pulsing-dot"></span>
            <strong>リアルタイム在庫状況:</strong>
          </div>
          <div class="status-value">
            <span v-if="product.stockQuantity <= 0" class="text-danger">現在在庫切れです</span>
            <span v-else-if="product.stockQuantity <= 3" class="text-warning"
              >残り {{ product.stockQuantity }} 点（他のユーザーが検討中）</span
            >
            <span v-else class="text-success">残り {{ product.stockQuantity }} 点（余裕あり）</span>
          </div>
          <p class="sse-hint">※ Server-Sent Events (SSE) により他ユーザー購入時に自動更新</p>
        </div>

        <p class="detail-desc">{{ product.description }}</p>

        <!-- Add to Cart Form -->
        <div class="purchase-box">
          <div class="qty-selector">
            <label>数量:</label>
            <div class="stepper">
              <button
                @click="quantity = Math.max(1, quantity - 1)"
                :disabled="quantity <= 1"
                class="btn-step"
              >
                -
              </button>
              <span class="qty-val">{{ quantity }}</span>
              <button
                @click="quantity = Math.min(product.stockQuantity, quantity + 1)"
                :disabled="quantity >= product.stockQuantity"
                class="btn-step"
              >
                +
              </button>
            </div>
          </div>

          <button
            @click="handleAddToCart"
            :disabled="product.stockQuantity <= 0 || isAdding"
            class="btn-detail-cart"
            :class="{ 'btn-detail-disabled': product.stockQuantity <= 0 }"
          >
            {{
              isAdding
                ? "カートに追加中..."
                : product.stockQuantity <= 0
                  ? "申し訳ありません。完売しました"
                  : "🛒 ショッピングカートに追加"
            }}
          </button>
        </div>

        <div v-if="addSuccessMessage" class="cart-toast-msg">
          ✅ {{ addSuccessMessage }}
          <NuxtLink to="/cart" class="cart-toast-link">カートを見る →</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Reviews Section -->
    <section class="reviews-section">
      <div class="reviews-head">
        <h2>カスタマーレビュー ({{ product.reviews?.length || 0 }}件)</h2>
        <span class="overall-rating">総合評価: ★ {{ product.averageRating }} / 5.0</span>
      </div>

      <!-- Post Review Form -->
      <div class="review-form-card">
        <h3>この作品のレビューを書く</h3>

        <div v-if="loggedIn" class="review-form">
          <div class="rating-select-group">
            <label>評価（星の数）:</label>
            <div class="star-picker">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="newRating = star"
                class="star-btn"
                :class="{ 'star-filled': star <= newRating }"
              >
                ★
              </button>
              <span class="picked-score">{{ newRating }} / 5</span>
            </div>
          </div>

          <div class="comment-group">
            <label>コメント・感想:</label>
            <textarea
              v-model="newComment"
              placeholder="作品の質感、使い心地、梱包などの感想をお聞かせください..."
              rows="3"
              class="comment-textarea"
            ></textarea>
          </div>

          <div class="review-form-actions">
            <button @click="submitReview" :disabled="isSubmittingReview" class="btn-submit-review">
              {{ isSubmittingReview ? "投稿中..." : "レビューを投稿する" }}
            </button>
          </div>

          <p v-if="reviewSuccess" class="review-msg-success">✅ {{ reviewSuccess }}</p>
          <p v-if="reviewError" class="review-msg-error">⚠️ {{ reviewError }}</p>
        </div>

        <div v-else class="review-login-prompt">
          <p>レビューを投稿するにはログインが必要です。</p>
          <NuxtLink to="/login" class="btn-secondary">ログインしてレビューを書く</NuxtLink>
        </div>
      </div>

      <!-- Reviews List -->
      <div class="reviews-list">
        <div v-for="rev in product.reviews" :key="rev.id" class="review-item">
          <div class="review-item-header">
            <span class="reviewer-name">👤 {{ rev.userName || "会員" }}</span>
            <span class="review-stars">★ {{ rev.rating }}</span>
            <span class="review-date">{{ new Date(rev.createdAt).toLocaleDateString() }}</span>
          </div>
          <p class="review-comment">{{ rev.comment }}</p>
        </div>

        <div v-if="!product.reviews || product.reviews.length === 0" class="no-reviews-box">
          まだレビューはありません。最初のレビューを投稿してみましょう！
        </div>
      </div>
    </section>

    <!-- Recently Viewed Section -->
    <RecentlyViewed />
  </div>
</template>

<style scoped>
.product-detail-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #64748b;
}

.breadcrumb a {
  color: #64748b;
  text-decoration: none;
}

.breadcrumb a:hover {
  color: #0284c7;
}

.breadcrumb .current {
  color: #0f172a;
  font-weight: 600;
}

.product-main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 32px;
}

.gallery-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-image-wrap {
  width: 100%;
  padding-top: 80%;
  position: relative;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.main-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-main {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
}

.detail-stock-badge-wrap {
  position: absolute;
  top: 14px;
  left: 14px;
}

.badge-in {
  background: #22c55e;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}

.badge-low {
  background: #f59e0b;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}

.badge-out {
  background: #ef4444;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}

.thumbnail-strip {
  display: flex;
  gap: 12px;
}

.thumb-btn {
  width: 72px;
  height: 72px;
  padding: 0;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-active {
  border-color: #0284c7;
}

.info-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-chip {
  align-self: flex-start;
  background: #e0f2fe;
  color: #0284c7;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
}

.detail-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.detail-rating-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.stars {
  color: #eab308;
  font-weight: 700;
}

.review-count {
  color: #64748b;
}

.detail-price-box {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-currency {
  font-size: 1.2rem;
  font-weight: 700;
}

.detail-price {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
}

.detail-tax {
  font-size: 0.8rem;
  color: #64748b;
  margin-left: 6px;
}

.realtime-status-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-low {
  background: #fffbeb;
  border-color: #fde68a;
}

.card-out {
  background: #fef2f2;
  border-color: #fecaca;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.pulsing-dot {
  width: 8px;
  height: 8px;
  background-color: #22c55e;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.status-value {
  font-size: 0.95rem;
  font-weight: 700;
}

.text-success {
  color: #16a34a;
}
.text-warning {
  color: #d97706;
}
.text-danger {
  color: #dc2626;
}

.sse-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

.detail-desc {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #334155;
  margin: 0;
}

.purchase-box {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}

.qty-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-selector label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.stepper {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
}

.btn-step {
  background: none;
  border: none;
  padding: 6px 12px;
  font-size: 1rem;
  cursor: pointer;
}

.qty-val {
  padding: 0 8px;
  font-size: 0.95rem;
  font-weight: 700;
}

.btn-detail-cart {
  flex: 1;
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-detail-cart:hover {
  background: #0369a1;
}

.btn-detail-disabled {
  background: #cbd5e1 !important;
  cursor: not-allowed !important;
}

.cart-toast-msg {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-toast-link {
  font-weight: 700;
  color: #15803d;
  text-decoration: underline;
}

/* Reviews Section */
.reviews-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.reviews-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 16px;
}

.reviews-head h2 {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

.overall-rating {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0284c7;
}

.review-form-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.review-form-card h3 {
  font-size: 1rem;
  margin: 0 0 16px 0;
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rating-select-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.star-picker {
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: #cbd5e1;
  cursor: pointer;
  padding: 0;
}

.star-filled {
  color: #eab308;
}

.picked-score {
  font-size: 0.85rem;
  font-weight: 700;
  margin-left: 8px;
  color: #475569;
}

.comment-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comment-textarea {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  resize: vertical;
}

.comment-textarea:focus {
  border-color: #0284c7;
}

.btn-submit-review {
  align-self: flex-start;
  background: #0f172a;
  color: #ffffff;
  border: none;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.review-msg-success {
  color: #16a34a;
  font-size: 0.85rem;
  margin: 0;
}

.review-msg-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0;
}

.review-login-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.review-login-prompt p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.btn-secondary {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 16px;
}

.review-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.reviewer-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.review-stars {
  color: #eab308;
  font-size: 0.85rem;
}

.review-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

.review-comment {
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.6;
  margin: 0;
}

.no-reviews-box {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .product-main-grid {
    grid-template-columns: 1fr;
  }
}
</style>
