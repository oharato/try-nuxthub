import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";

describe("Integration Tests: NuxtHub APIs", async () => {
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

    // 4. 削除後の確認
    const updatedList = await $fetch<Array<{ key: string; value: any }>>("/api/kv");
    expect(updatedList.find((i) => i.key === "integration_test_key")).toBeUndefined();
  });

  it("Database (Todos) の CRUD が正しく動作する", async () => {
    // 1. Todo 作成 (POST)
    const created = await $fetch<any>("/api/todos", {
      method: "POST",
      body: { title: "Integration Test Todo" },
    });
    expect(created.id).toBeDefined();
    expect(created.title).toBe("Integration Test Todo");
    expect(created.completed).toBe(false);

    // 2. Todo 一覧 (GET)
    const todos = await $fetch<any[]>("/api/todos");
    expect(todos.some((t) => t.id === created.id)).toBe(true);

    // 3. Todo 更新 (PATCH)
    const updated = await $fetch<any>(`/api/todos/${created.id}`, {
      method: "PATCH",
      body: { completed: true },
    });
    expect(updated.completed).toBe(true);

    // 4. Todo 削除 (DELETE)
    const deleted = await $fetch<{ success: boolean }>(`/api/todos/${created.id}`, {
      method: "DELETE",
    });
    expect(deleted).toEqual({ success: true });
  });

  it("Cache API がレスポンスを返す", async () => {
    const res = await $fetch<{ generatedAt: string; timestamp: number; message: string }>(
      "/api/cached-time",
    );
    expect(res.generatedAt).toBeDefined();
    expect(res.timestamp).toBeGreaterThan(0);
    expect(res.message).toContain("cached");
  });

  it("暗号化 Cookie 認証（ログイン・保護API検証）が正しく動作する", async () => {
    // 1. 未ログインでの保護 API へのアクセス -> 401 エラー
    await expect($fetch("/api/auth/protected")).rejects.toThrow();

    // 2. 誤ったパスワードでのログイン -> 401 エラー
    await expect(
      $fetch("/api/auth/login", {
        method: "POST",
        body: { email: "admin@example.com", password: "wrong_password" },
      }),
    ).rejects.toThrow();

    // 3. 正しいログイン -> 成功
    const loginRes = await $fetch<{ success: boolean; user: any }>("/api/auth/login", {
      method: "POST",
      body: { email: "admin@example.com", password: "password", name: "管理者" },
    });
    expect(loginRes.success).toBe(true);
    expect(loginRes.user.email).toBe("admin@example.com");
    expect(loginRes.user.role).toBe("admin");
  });
});
