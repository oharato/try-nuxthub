import { useDrizzle, tables, eq } from "../../../utils/drizzle";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user || !(session.user as any).id) {
    throw createError({
      statusCode: 401,
      statusMessage: "レビューを投稿するにはログインが必要です。",
    });
  }

  const slug = getRouterParam(event, "slug");
  const body = await readBody(event);
  const rating = Number(body.rating);
  const comment = body.comment ? String(body.comment).trim() : "";

  if (!rating || rating < 1 || rating > 5) {
    throw createError({
      statusCode: 400,
      statusMessage: "評価（星）は1〜5の間で選択してください。",
    });
  }

  const db = useDrizzle();

  const [product] = await db
    .select()
    .from(tables.products)
    .where(eq(tables.products.slug, decodeURIComponent(slug!)));

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: "Product not found" });
  }

  const userId = (session.user as any).id;

  const [createdReview] = await db
    .insert(tables.reviews)
    .values({
      userId,
      productId: product.id,
      rating,
      comment,
      createdAt: new Date(),
    })
    .returning();

  return {
    ...createdReview,
    userName: (session.user as any).name || "会員",
  };
});
