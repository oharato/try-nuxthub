export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email and password are required",
    });
  }

  // デモ用認証（パスワード: "password"）
  if (body.password !== "password") {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials (demo password is "password")',
    });
  }

  const user = {
    id: 1,
    name: body.name || body.email.split("@")[0] || "Demo User",
    email: body.email,
    role: body.email.includes("admin") ? "admin" : "user",
    loggedInAt: new Date().toISOString(),
  };

  // 暗号化 Cookie セッションを発行
  await setUserSession(event, {
    user,
  });

  return { success: true, user };
});
