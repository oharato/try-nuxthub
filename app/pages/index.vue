<script setup lang="ts">
const { data: products, pending, refresh } = await useFetch<any[]>("/api/products");
const { data: categories } = await useFetch<any[]>("/api/categories");

// Realtime inventory SSE listener
useRealtimeInventory((data) => {
  if (products.value) {
    const target = products.value.find((p) => p.id === data.productId);
    if (target) {
      target.stockQuantity = data.stockQuantity;
    }
  }
});

const featuredProducts = computed(() => {
  if (!products.value) return [];
  return products.value.slice(0, 4);
});

const newArrivals = computed(() => {
  if (!products.value) return [];
  return products.value.slice(4, 8);
});
</script>

<template>
  <div class="top-page">
    <!-- Hero Banner -->
    <section class="hero-banner">
      <div class="hero-content">
        <div class="hero-badge">✨ Handcrafted & Digital Creations</div>
        <h1 class="hero-title">職人の手仕事と、<br />現代のクリエイティビティが出会う場所。</h1>
        <p class="hero-desc">
          信楽焼の器、山桜の一枚板カッティングボード、イタリアンレザー財布から商用フォントまで。<br />
          Nuxt 4 + NuxtHub (Cloudflare D1 / KV / R2 / SSE) で駆動する次世代ECプラットフォーム。
        </p>
        <div class="hero-actions">
          <NuxtLink to="/products" class="btn-hero-primary">すべての作品を見る</NuxtLink>
          <NuxtLink to="/products?category=craft-art" class="btn-hero-secondary"
            >クラフト特集</NuxtLink
          >
        </div>
      </div>
      <div class="hero-visual">
        <div class="visual-card">
          <div class="visual-badge">🔥 フラッシュセール中</div>
          <div class="visual-item-title">手挽き信楽焼 削り出しマグカップ</div>
          <div class="visual-price">¥3,800 <span class="tax">税込</span></div>
          <p class="visual-note">⚡ Realtime SSE で在庫がリアルタイムに変動します</p>
        </div>
      </div>
    </section>

    <!-- Categories Strip -->
    <section class="section-container">
      <div class="section-head">
        <h2 class="section-title">人気のカテゴリー</h2>
        <NuxtLink to="/products" class="link-more">すべて見る →</NuxtLink>
      </div>

      <div class="category-grid">
        <NuxtLink to="/products?category=ceramics" class="cat-box">
          <span class="cat-icon">🏺</span>
          <span class="cat-title">陶芸・ガラス</span>
          <span class="cat-desc">職人の手打ち陶器と花器</span>
        </NuxtLink>
        <NuxtLink to="/products?category=woodwork" class="cat-box">
          <span class="cat-icon">🪵</span>
          <span class="cat-title">木工家具</span>
          <span class="cat-desc">国産天然木のクラフト</span>
        </NuxtLink>
        <NuxtLink to="/products?category=leather" class="cat-box">
          <span class="cat-icon">👜</span>
          <span class="cat-title">レザーアイテム</span>
          <span class="cat-desc">経年変化を楽しむ本革</span>
        </NuxtLink>
        <NuxtLink to="/products?category=digital" class="cat-box">
          <span class="cat-icon">🎨</span>
          <span class="cat-title">デジタル素材</span>
          <span class="cat-desc">商用フォント・デザイン</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="section-container">
      <div class="section-head">
        <div>
          <h2 class="section-title">おすすめの作品</h2>
          <p class="section-subtitle">今週バイヤーが注目したこだわりのアイテム</p>
        </div>
        <NuxtLink to="/products" class="link-more">商品一覧 →</NuxtLink>
      </div>

      <div v-if="pending" class="loading-state">商品を読み込み中...</div>
      <div v-else-if="featuredProducts.length > 0" class="products-grid">
        <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
      </div>
    </section>

    <!-- New Arrivals -->
    <section class="section-container" v-if="newArrivals.length > 0">
      <div class="section-head">
        <div>
          <h2 class="section-title">新着コレクション</h2>
          <p class="section-subtitle">新しく登録されたクリエイターの作品</p>
        </div>
        <NuxtLink to="/products" class="link-more">すべて見る →</NuxtLink>
      </div>

      <div class="products-grid">
        <ProductCard v-for="product in newArrivals" :key="product.id" :product="product" />
      </div>
    </section>

    <!-- Tech Architecture Features Highlight -->
    <section class="tech-highlight-section">
      <div class="tech-head">
        <span class="tech-badge">ARCHITECTURAL SHOWCASE</span>
        <h2>NuxtHub (Nuxt 4 + Cloudflare) によるフルスタックEC</h2>
        <p>
          Rails 8 の「Solid Trio」と同等以上の開発体験・パフォーマンスをサーバーレスエッジで実現
        </p>
      </div>

      <div class="tech-cards-grid">
        <div class="tech-box">
          <div class="tech-icon">⚡</div>
          <h3>Edge SSR & Cache</h3>
          <p>
            <code>defineCachedEventHandler</code>
            による60秒自動エッジキャッシュ。ミリ秒単位の超高速TTFBレスポンス。
          </p>
        </div>
        <div class="tech-box">
          <div class="tech-icon">🔑</div>
          <h3>KV Store カート</h3>
          <p>
            Cloudflare KV (<code>hubKV()</code>)
            でDB負荷ゼロの一時カート管理。ログイン時の自動マージと閲覧履歴対応。
          </p>
        </div>
        <div class="tech-box">
          <div class="tech-icon">📄</div>
          <h3>PDF 領収書 & R2</h3>
          <p>
            <code>pdf-lib</code> で Workers 上でバイナリ生成し、Cloudflare R2
            (<code>hubBlob()</code>) に自動保管・ストリーミング。
          </p>
        </div>
        <div class="tech-box">
          <div class="tech-icon">📡</div>
          <h3>Server-Sent Events</h3>
          <p>購入時のリアルタイム在庫引き当てと、管理者向け注文速報トースト通知を SSE で同期。</p>
        </div>
      </div>
    </section>

    <!-- Recently Viewed Section -->
    <RecentlyViewed />
  </div>
</template>

<style scoped>
.top-page {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.hero-banner {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%);
  color: #ffffff;
  border-radius: 16px;
  padding: 48px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 32px;
  align-items: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  color: #38bdf8;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
  margin-bottom: 16px;
}

.hero-title {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.3;
  margin: 0 0 16px 0;
  letter-spacing: -0.02em;
}

.hero-desc {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #cbd5e1;
  margin: 0 0 28px 0;
}

.hero-actions {
  display: flex;
  gap: 12px;
}

.btn-hero-primary {
  background: #0284c7;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-hero-primary:hover {
  background: #0369a1;
}

.btn-hero-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-hero-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.hero-visual {
  display: flex;
  justify-content: center;
}

.visual-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 320px;
}

.visual-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #f59e0b;
  margin-bottom: 8px;
}

.visual-item-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.visual-price {
  font-size: 1.5rem;
  font-weight: 800;
  color: #38bdf8;
  margin-bottom: 12px;
}

.visual-price .tax {
  font-size: 0.75rem;
  color: #cbd5e1;
}

.visual-note {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

.section-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
}

.section-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 4px 0 0 0;
}

.link-more {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0284c7;
  text-decoration: none;
}

.link-more:hover {
  text-decoration: underline;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.cat-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.cat-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #0284c7;
}

.cat-icon {
  font-size: 2rem;
  margin-bottom: 4px;
}

.cat-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.cat-desc {
  font-size: 0.8rem;
  color: #64748b;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.loading-state {
  padding: 40px;
  text-align: center;
  color: #64748b;
}

.tech-highlight-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 40px;
}

.tech-head {
  text-align: center;
  max-width: 650px;
  margin: 0 auto 36px auto;
}

.tech-badge {
  font-size: 0.75rem;
  font-weight: 800;
  color: #0284c7;
  background: #e0f2fe;
  padding: 4px 12px;
  border-radius: 9999px;
  display: inline-block;
  margin-bottom: 12px;
}

.tech-head h2 {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px 0;
}

.tech-head p {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

.tech-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.tech-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
}

.tech-icon {
  font-size: 1.8rem;
  margin-bottom: 10px;
}

.tech-box h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.tech-box p {
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

.tech-box code {
  background: #e2e8f0;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .hero-banner {
    grid-template-columns: 1fr;
    padding: 28px;
  }
}
</style>
