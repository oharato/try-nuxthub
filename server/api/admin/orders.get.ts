import { useDrizzle, tables, desc, inArray, type Order, type Product } from "../../utils/drizzle";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user || (session.user as any).role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "管理者権限が必要です。" });
  }

  const db = useDrizzle();
  const allOrders = (await db
    .select()
    .from(tables.orders)
    .orderBy(desc(tables.orders.createdAt))) as Order[];

  if (allOrders.length === 0) {
    return [];
  }

  const orderIds = allOrders.map((o) => o.id);
  const allOrderItems = await db
    .select()
    .from(tables.orderItems)
    .where(inArray(tables.orderItems.orderId, orderIds));

  const productIds = Array.from(new Set(allOrderItems.map((i) => i.productId)));
  const allProducts = (await db
    .select()
    .from(tables.products)
    .where(inArray(tables.products.id, productIds))) as Product[];

  const productMap = new Map<number, Product>(allProducts.map((p) => [p.id, p]));

  const enrichedOrders = allOrders.map((order) => {
    const items = allOrderItems
      .filter((i) => i.orderId === order.id)
      .map((i) => {
        const prod = productMap.get(i.productId);
        return {
          ...i,
          productName: prod ? prod.name : `Product #${i.productId}`,
        };
      });

    return {
      ...order,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  });

  return enrichedOrders;
});
