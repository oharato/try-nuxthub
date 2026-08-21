import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";

describe("Integration Tests: CraftCommerce & NuxtHub APIs", async () => {
  await setup({
    server: true,
  });

  it("GET /api/ping が正常に応答する", async () => {
    const res = await $fetch("/api/ping");
    expect(res).toBe("pong");
  });

  it("KV の保存・取得・削除が正しく動作する", async () => {
    // 1. 保存 (POST)
    const postRes = await $fetch<{ success: boolean; key: string; value: any }>("/api/kv", {
      method: "POST",
      body: { key: "integration_test_key", value: { status: "ok", count: 42 } },
    });
    expect(postRes).toMatchObject({ success: true, key: "integration_test_key" });

    // 2. 一覧取得 (GET)
    const list = await $fetch<Array<{ key: string; value: any }>>("/api/kv");
    const item = list.find((i) => i.key === "integration_test_key");
    expect(item).toBeDefined();
    expect(item?.value).toEqual({ status: "ok", count: 42 });

    // 3. 削除 (DELETE)
    const delRes = await $fetch<{ success: boolean }>("/api/kv/integration_test_key", {
      method: "DELETE",
    });
    expect(delRes).toEqual({ success: true });
  });

  it("Database (Todos) の CRUD が正しく動作する", async () => {
    const created = await $fetch<any>("/api/todos", {
      method: "POST",
      body: { title: "Integration Test Todo" },
    });
    expect(created.id).toBeDefined();
    expect(created.title).toBe("Integration Test Todo");

    const todos = await $fetch<any[]>("/api/todos");
    expect(todos.some((t) => t.id === created.id)).toBe(true);
  });

  it("カテゴリ一覧取得 (GET /api/categories) が5件の初期カテゴリを返す", async () => {
    const categories = await $fetch<any[]>("/api/categories");
    expect(categories.length).toBeGreaterThanOrEqual(5);
    expect(categories.some((c) => c.slug === "ceramics")).toBe(true);
    expect(categories.some((c) => c.slug === "woodwork")).toBe(true);
  });

  it("商品一覧・詳細 (GET /api/products, GET /api/products/:slug) が正常に動作する", async () => {
    // 1. 商品一覧取得 (Cached)
    const products = await $fetch<any[]>("/api/products");
    expect(products.length).toBeGreaterThanOrEqual(6);

    const first = products[0];
    expect(first.id).toBeDefined();
    expect(first.slug).toBeDefined();

    // 2. 商品詳細取得
    const detail = await $fetch<any>(`/api/products/${first.slug}`);
    expect(detail.id).toBe(first.id);
    expect(detail.name).toBe(first.name);
    expect(detail.images).toBeDefined();
    expect(detail.stockQuantity).toBeGreaterThanOrEqual(0);
  });

  it("ショッピングカート (KV Store: GET /api/cart, POST /api/cart/items) が動作する", async () => {
    const products = await $fetch<any[]>("/api/products");
    const targetProduct = products[0];
    const guestSessionId = "test-guest-session-12345";

    // 1. カートに追加 (POST)
    const updatedCart = await $fetch<any>("/api/cart/items", {
      method: "POST",
      headers: { "x-guest-session-id": guestSessionId },
      body: { productId: targetProduct.id, quantity: 2 },
    });
    expect(updatedCart.items.length).toBeGreaterThanOrEqual(1);
    const inCart = updatedCart.items.find((i: any) => i.productId === targetProduct.id);
    expect(inCart).toBeDefined();
    expect(inCart.quantity).toBeGreaterThanOrEqual(2);

    // 2. カート取得 (GET)
    const cart = await $fetch<any>("/api/cart", {
      headers: { "x-guest-session-id": guestSessionId },
    });
    expect(cart.totalCount).toBeGreaterThanOrEqual(2);
    expect(cart.subtotal).toBeGreaterThan(0);
  });

  it("チェックアウト注文確定 (POST /api/orders) が在庫引き当てと注文作成を行う", async () => {
    const products = await $fetch<any[]>("/api/products");
    const targetProduct = products.find((p) => p.stockQuantity > 0) || products[0];
    const guestSessionId = `test-order-guest-${Date.now()}`;

    // 1. カートに商品をセット
    await $fetch("/api/cart/items", {
      method: "POST",
      headers: { "x-guest-session-id": guestSessionId },
      body: { productId: targetProduct.id, quantity: 1 },
    });

    const beforeOrderProd = await $fetch<any>(`/api/products/${targetProduct.slug}`);
    const initialStock = beforeOrderProd.stockQuantity;

    // 2. 注文確定
    const orderRes = await $fetch<any>("/api/orders", {
      method: "POST",
      headers: { "x-guest-session-id": guestSessionId },
      body: {
        customerName: "テスト 太郎",
        customerEmail: "test@example.com",
        shippingAddress: "東京都千代田区1-1-1",
      },
    });

    expect(orderRes.success).toBe(true);
    expect(orderRes.order.id).toBeDefined();
    expect(orderRes.order.orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
    expect(orderRes.order.status).toBe("paid");

    // 3. 注文詳細取得
    const orderDetail = await $fetch<any>(`/api/orders/${orderRes.order.id}`);
    expect(orderDetail.customerName).toBe("テスト 太郎");
    expect(orderDetail.items.length).toBeGreaterThanOrEqual(1);

    // 4. カートがクリアされていることを確認
    const clearedCart = await $fetch<any>("/api/cart", {
      headers: { "x-guest-session-id": guestSessionId },
    });
    expect(clearedCart.items.length).toBe(0);

    // 5. 在庫が減算されていることを確認
    const updatedProduct = await $fetch<any>(`/api/products/${targetProduct.slug}`);
    expect(updatedProduct.stockQuantity).toBe(initialStock - 1);
  }, 20000);

  it("暗号化 Cookie 認証（ログイン・会員登録）が正しく動作する", async () => {
    // 1. 誤ったパスワードでのログイン -> 401 エラー
    await expect(
      $fetch("/api/auth/login", {
        method: "POST",
        body: { email: "admin@example.com", password: "wrong_password" },
      }),
    ).rejects.toThrow();

    // 2. 正しいログイン -> 成功
    const loginRes = await $fetch<{ success: boolean; user: any }>("/api/auth/login", {
      method: "POST",
      body: { email: "admin@example.com", password: "password123", name: "管理者" },
    });
    expect(loginRes.success).toBe(true);
    expect(loginRes.user.email).toBe("admin@example.com");
    expect(loginRes.user.role).toBe("admin");
  });
});
