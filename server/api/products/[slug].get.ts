import { useDrizzle, tables, eq } from "../../utils/drizzle";
import { ensureSeedData } from "../../utils/seed";
import { recordRecentlyViewed } from "../../utils/cart";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Slug is required" });
  }

  await ensureSeedData();
  const db = useDrizzle();

  const [product] = await db
    .select()
    .from(tables.products)
    .where(eq(tables.products.slug, decodeURIComponent(slug)));

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: "Product not found" });
  }

  // Record recently viewed in KV (async, non-blocking)
  recordRecentlyViewed(event, product.id).catch((err) =>
    console.error("Failed to record recently viewed:", err),
  );

  // Fetch Category
  const [category] = await db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.id, product.categoryId));

  // Fetch Images
  const images = await db
    .select()
    .from(tables.productImages)
    .where(eq(tables.productImages.productId, product.id));
  images.sort((a, b) => a.displayOrder - b.displayOrder);

  // Fetch Reviews with User names
  const rawReviews = await db
    .select()
    .from(tables.reviews)
    .where(eq(tables.reviews.productId, product.id));

  const allUsers = await db.select().from(tables.users);
  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));

  const reviews = rawReviews.map((r) => ({
    ...r,
    userName: userMap.get(r.userId) || "ゲスト購入者",
  }));

  const averageRating =
    reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

  return {
    ...product,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    images,
    mainImage: images[0]?.blobKey || null,
    reviews,
    reviewCount: reviews.length,
    averageRating,
  };
});
