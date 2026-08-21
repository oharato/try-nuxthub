import { useDrizzle, tables, eq } from "../../utils/drizzle";
import { mergeGuestCartIntoUser } from "../../utils/cart";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password, name } = body || {};

  if (!email || !password || !name) {
    throw createError({
      statusCode: 400,
      statusMessage: "メールアドレス、パスワード、お名前は必須です。",
    });
  }

  const db = useDrizzle();

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.email, email.toLowerCase().trim()));

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: "このメールアドレスは既に登録されています。",
    });
  }

  const passwordDigest = await hashPassword(password);

  const [newUser] = await db
    .insert(tables.users)
    .values({
      email: email.toLowerCase().trim(),
      passwordDigest,
      name: name.trim(),
      role: email.includes("admin") ? "admin" : "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!newUser) {
    throw createError({
      statusCode: 500,
      statusMessage: "ユーザーの作成に失敗しました。",
    });
  }

  const userSessionData = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    loggedInAt: new Date().toISOString(),
  };

  await setUserSession(event, {
    user: userSessionData,
  });

  // Auto-merge guest cart if guest session cookie is present
  const guestSessionId = getCookie(event, "guest_session_id");
  if (guestSessionId) {
    await mergeGuestCartIntoUser(guestSessionId, newUser.id);
  }

  return { success: true, user: userSessionData };
});
