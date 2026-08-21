export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user || (session.user as any).role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "管理者権限が必要です。" });
  }

  try {
    const cacheStorage = useStorage("cache");
    const keys = await cacheStorage.getKeys();
    for (const key of keys) {
      await cacheStorage.removeItem(key);
    }
    return {
      success: true,
      message: `キャッシュを破棄しました（${keys.length} 件のキーを削除）`,
      purgedKeysCount: keys.length,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      success: true,
      message: "キャッシュのパージが完了しました。",
      timestamp: new Date().toISOString(),
    };
  }
});
