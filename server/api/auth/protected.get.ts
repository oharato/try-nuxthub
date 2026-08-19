export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  const user = session.user as any;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Please log in to access this edge resource",
    });
  }

  return {
    secretMessage: `🎉 ようこそ ${user.name || user.email} さん！これは暗号化 Cookie 認証されたユーザーだけがアクセスできるエッジデータです。`,
    user,
    verifiedAt: new Date().toISOString(),
  };
});
