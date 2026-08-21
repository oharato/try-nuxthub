import { useDrizzle, tables, eq } from "../../../../utils/drizzle";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user || (session.user as any).role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "管理者権限が必要です。" });
  }

  const paramId = getRouterParam(event, "id");
  const orderId = Number(paramId);
  const body = await readBody(event);
  const status = body.status;

  if (!orderId || !status) {
    throw createError({ statusCode: 400, statusMessage: "Order ID and status are required" });
  }

  const validStatuses = ["pending", "paid", "shipped", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid status value" });
  }

  const db = useDrizzle();

  const [updatedOrder] = await db
    .update(tables.orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(tables.orders.id, orderId))
    .returning();

  if (!updatedOrder) {
    throw createError({ statusCode: 404, statusMessage: "Order not found" });
  }

  return { success: true, order: updatedOrder };
});
