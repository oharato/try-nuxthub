import { useDrizzle, tables, eq, desc, inArray } from "../../utils/drizzle";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user || !(session.user as any).id) {
    throw createError({
      statusCode: 401,
      statusMessage: "注文履歴を表示するにはログインが必要です。",
    });
  }

  const userId = (session.user as any).id;
  const db = useDrizzle();

  const userOrders = await db
    .select()
    .from(tables.orders)
    .where(eq(tables.orders.userId, userId))
    .orderBy(desc(tables.orders.createdAt));

  if (userOrders.length === 0) {
    return [];
  }

  const orderIds = userOrders.map((o) => o.id);
  const allOrderItems = await db
    .select()
    .from(tables.orderItems)
    .where(inArray(tables.orderItems.orderId, orderIds));

  const productIds = Array.from(new Set(allOrderItems.map((i) => i.productId)));
  const allProducts = await db
    .select()
    .from(tables.products)
    .where(inArray(tables.products.id, productIds));

  const allImages = await db
    .select()
    .from(tables.productImages)
    .where(inArray(tables.productImages.productId, productIds));

  const imageMap = new Map<number, string>();
  for (const img of allImages) {
    if (!imageMap.has(img.productId) || img.displayOrder === 1) {
      imageMap.set(img.productId, img.blobKey);
    }
  }

  const productMap = new Map(allProducts.map((p) => [p.id, p]));

  const enrichedOrders = userOrders.map((order) => {
    const items = allOrderItems
      .filter((item) => item.orderId === order.id)
      .map((item) => {
        const prod = productMap.get(item.productId);
        return {
          ...item,
          productName: prod ? prod.name : `Product #${item.productId}`,
          productSlug: prod ? prod.slug : "",
          productImage: prod ? imageMap.get(prod.id) || null : null,
        };
      });

    return {
      ...order,
      items,
    };
  });

  return enrichedOrders;
});
