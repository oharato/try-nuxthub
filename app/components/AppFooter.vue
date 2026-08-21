<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-grid">
        <div class="footer-col">
          <div class="footer-brand">
            <span class="brand-icon">🏺</span>
            <span class="brand-name">CraftCommerce</span>
          </div>
          <p class="brand-desc">
            こだわりのクラフト作品・木工家具・デジタル素材を全国の作家から直接お届けするモダンEコマースプラットフォームです。
          </p>
          <div class="tech-tags">
            <span class="tech-tag">Nuxt 4</span>
            <span class="tech-tag">NuxtHub</span>
            <span class="tech-tag">Cloudflare D1</span>
            <span class="tech-tag">KV</span>
            <span class="tech-tag">R2</span>
            <span class="tech-tag">SSE</span>
          </div>
        </div>

        <div class="footer-col">
          <h4>カテゴリー</h4>
          <ul>
            <li><NuxtLink to="/products?category=craft-art">クラフト・雑貨</NuxtLink></li>
            <li><NuxtLink to="/products?category=woodwork">木工家具</NuxtLink></li>
            <li><NuxtLink to="/products?category=ceramics">陶芸・ガラス</NuxtLink></li>
            <li><NuxtLink to="/products?category=leather">レザーアイテム</NuxtLink></li>
            <li><NuxtLink to="/products?category=digital">デジタル素材</NuxtLink></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>アカウント & サポート</h4>
          <ul>
            <li><NuxtLink to="/cart">ショッピングカート</NuxtLink></li>
            <li><NuxtLink to="/mypage/orders">注文履歴・領収書</NuxtLink></li>
            <li><NuxtLink to="/login">ログイン</NuxtLink></li>
            <li><NuxtLink to="/signup">新規会員登録</NuxtLink></li>
            <li><NuxtLink to="/admin">管理者ダッシュボード</NuxtLink></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>© 2026 CraftCommerce Demo. NuxtHub vs Rails 8 Comparison Showcase.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: #0f172a;
  color: #94a3b8;
  padding: 48px 0 24px 0;
  margin-top: 60px;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
  padding-bottom: 36px;
  border-bottom: 1px solid #1e293b;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.brand-icon {
  font-size: 1.5rem;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
}

.brand-desc {
  font-size: 0.85rem;
  line-height: 1.6;
  margin-bottom: 16px;
  color: #94a3b8;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tech-tag {
  font-size: 0.7rem;
  background: #1e293b;
  color: #38bdf8;
  padding: 2px 8px;
  border-radius: 4px;
}

.footer-col h4 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 16px 0;
}

.footer-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-col a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.2s;
}

.footer-col a:hover {
  color: #ffffff;
}

.footer-bottom {
  padding-top: 24px;
  text-align: center;
  font-size: 0.8rem;
  color: #64748b;
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
