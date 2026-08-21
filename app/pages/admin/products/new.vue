<script setup lang="ts">
const { user, loggedIn } = useUserSession();
const router = useRouter();

const { data: categories } = await useFetch<any[]>("/api/categories");

const name = ref("");
const slug = ref("");
const categoryId = ref<number>(1);
const price = ref<number>(5000);
const stockQuantity = ref<number>(10);
const description = ref("");
const isPublished = ref(true);

const selectedFiles = ref<File[]>([]);
const isSubmitting = ref(false);
const errorMessage = ref("");

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    selectedFiles.value = Array.from(target.files);
  }
}

function generateSlugFromName() {
  if (!slug.value && name.value) {
    // Generate ASCII safe slug
    const ascii = name.value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    slug.value = ascii || `item-${Date.now()}`;
  }
}

async function handleSubmit() {
  if (!name.value.trim() || !slug.value.trim() || !price.value) {
    errorMessage.value = "商品名、スラッグ、価格は必須です。";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    const formData = new FormData();
    formData.append("name", name.value.trim());
    formData.append("slug", slug.value.trim().toLowerCase());
    formData.append("categoryId", String(categoryId.value));
    formData.append("price", String(price.value));
    formData.append("stockQuantity", String(stockQuantity.value));
    formData.append("description", description.value.trim());
    formData.append("isPublished", isPublished.value ? "true" : "false");

    for (const file of selectedFiles.value) {
      formData.append("images", file);
    }

    await $fetch("/api/admin/products", {
      method: "POST",
      body: formData,
    });

    router.push("/admin/products");
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || e?.message || "商品の登録に失敗しました";
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  const currentUser = user.value as any;
  if (!loggedIn.value || currentUser?.role !== "admin") {
    router.push("/login?redirect=/admin/products/new");
  }
});
</script>

<template>
  <div class="admin-page-container">
    <AdminNav />

    <div class="admin-main-content">
      <div class="page-top-bar">
        <div>
          <h1 class="admin-title">➕ 商品の新規登録</h1>
          <p class="admin-subtitle">
            商品基本情報と複数画像を登録。画像は Cloudflare R2 (<code>hubBlob()</code>)
            へアップロードされます。
          </p>
        </div>
      </div>

      <div class="admin-card form-card">
        <form @submit.prevent="handleSubmit" class="product-form">
          <div class="form-grid">
            <div class="form-group">
              <label>商品名 *</label>
              <input
                v-model="name"
                @blur="generateSlugFromName"
                type="text"
                class="text-input"
                placeholder="例: 手挽き信楽焼 削り出しマグカップ"
                required
              />
            </div>

            <div class="form-group">
              <label>スラッグ (URL識別子) *</label>
              <input
                v-model="slug"
                type="text"
                class="text-input"
                placeholder="例: handmade-ceramic-cup"
                required
              />
            </div>

            <div class="form-group">
              <label>カテゴリー *</label>
              <select v-model="categoryId" class="select-input" required>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>販売価格 (JPY, 税込) *</label>
              <input v-model="price" type="number" min="100" class="text-input" required />
            </div>

            <div class="form-group">
              <label>初期在庫数 *</label>
              <input v-model="stockQuantity" type="number" min="0" class="text-input" required />
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="isPublished" class="checkbox" />
                <span>すぐにショップで公開する</span>
              </label>
            </div>

            <div class="form-group full-width">
              <label>商品説明・ストーリー</label>
              <textarea
                v-model="description"
                rows="4"
                class="textarea-input"
                placeholder="作品の制作背景、素材の特徴、お手入れ方法などを入力..."
              ></textarea>
            </div>

            <div class="form-group full-width">
              <label>商品画像アップロード (Cloudflare R2 Blob Storage)</label>
              <div class="upload-dropzone">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  @change="handleFileChange"
                  id="img-upload-input"
                  class="file-input"
                />
                <label for="img-upload-input" class="dropzone-label">
                  📁 クリックまたはドラッグ＆ドロップで複数画像を選択
                </label>
                <div v-if="selectedFiles.length > 0" class="selected-files-list">
                  <span v-for="f in selectedFiles" :key="f.name" class="file-chip">
                    🖼️ {{ f.name }} ({{ (f.size / 1024).toFixed(1) }} KB)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="errorMessage" class="error-msg">⚠️ {{ errorMessage }}</div>

          <div class="form-actions">
            <button type="submit" :disabled="isSubmitting" class="btn-submit">
              {{ isSubmitting ? "登録中 (画像アップロード中)..." : "商品を登録する" }}
            </button>
            <NuxtLink to="/admin/products" class="btn-cancel">キャンセル</NuxtLink>
          </div>
        </form>
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

.admin-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 32px;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
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
  font-weight: 700;
  color: #334155;
}

.text-input,
.select-input,
.textarea-input {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  background: #ffffff;
}

.text-input:focus,
.select-input:focus,
.textarea-input:focus {
  border-color: #0284c7;
}

.checkbox-group {
  justify-content: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

.upload-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  padding: 24px;
  text-align: center;
  background: #f8fafc;
}

.file-input {
  display: none;
}

.dropzone-label {
  display: block;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0284c7;
  padding: 12px;
}

.selected-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
}

.file-chip {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 6px;
}

.error-msg {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.btn-submit {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-submit:hover {
  background: #0369a1;
}

.btn-cancel {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  text-decoration: none;
  font-weight: 600;
}
</style>
