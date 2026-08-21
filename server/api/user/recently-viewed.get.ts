import { getRecentlyViewedList } from "../../utils/cart";
import { useDrizzle, tables, inArray } from "../../utils/drizzle";

export default defineEventHandler(async (event) => {
  const viewedList = await getRecentlyViewedList(event);
  if (!viewedList || viewedList.length === 0) {
    return [];
  }

  const productIds = viewedList.map((item) => item.productId);
  const db = useDrizzle();

  const products = await db
    .select()
    .from(tables.products)
    .where(inArray(tables.products.id, productIds));

  const allCategories = await db.select().from(tables.categories);
  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

  const images = await db
    .select()
    .from(tables.productImages)
    .where(inArray(tables.productImages.productId, productIds));

  const imageMap = new Map<number, string>();
  for (const img of images) {
    if (!imageMap.has(img.productId) || img.displayOrder === 1) {
      imageMap.set(img.productId, img.blobKey);
    }
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Preserve order from viewedList
  const orderedProducts = viewedList
    .map((item) => {
      const prod = productMap.get(item.productId);
      if (!prod || !prod.isPublished) return null;

      const cat = categoryMap.get(prod.categoryId);
      return {
        ...prod,
        category: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null,
        mainImage: imageMap.get(prod.id) || null,
        viewedAt: item.viewedAt,
      };
    })
    .filter(Boolean);

  return orderedProducts;
});
