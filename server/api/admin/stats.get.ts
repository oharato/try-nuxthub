import { useDrizzle, tables, desc, type Order, type Product } from "../../utils/drizzle";

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

  const allProducts = (await db.select().from(tables.products)) as Product[];

  const totalRevenue = allOrders
    .filter((o: Order) => o.status !== "cancelled")
    .reduce((sum: number, o: Order) => sum + o.totalAmount, 0);

  const lowStockProducts = allProducts.filter(
    (p: Product) => p.stockQuantity <= 3 && p.isPublished,
  );

  const recentOrders = allOrders.slice(0, 5);

  return {
    totalRevenue,
    totalOrdersCount: allOrders.length,
    paidOrdersCount: allOrders.filter((o: Order) => o.status === "paid").length,
    shippedOrdersCount: allOrders.filter((o: Order) => o.status === "shipped").length,
    totalProductsCount: allProducts.length,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.map((p: Product) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      stockQuantity: p.stockQuantity,
      price: p.price,
    })),
    recentOrders,
  };
});
