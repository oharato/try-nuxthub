import { useDrizzle, tables, eq, inArray } from "../../utils/drizzle";

export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, "id");
  if (!param) {
    throw createError({ statusCode: 400, statusMessage: "Order identifier is required" });
  }

  const db = useDrizzle();
  let order;

  if (/^\d+$/.test(param)) {
    [order] = await db
      .select()
      .from(tables.orders)
      .where(eq(tables.orders.id, Number(param)));
  } else {
    [order] = await db.select().from(tables.orders).where(eq(tables.orders.orderNumber, param));
  }

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: "Order not found" });
  }

  const orderItemsList = await db
    .select()
    .from(tables.orderItems)
    .where(eq(tables.orderItems.orderId, order.id));

  const productIds = Array.from(new Set(orderItemsList.map((i) => i.productId)));
  const products = await db
    .select()
    .from(tables.products)
    .where(inArray(tables.products.id, productIds));

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

  const items = orderItemsList.map((item) => {
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
