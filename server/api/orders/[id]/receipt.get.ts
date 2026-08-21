import { blob } from "hub:blob";
import { useDrizzle, tables, eq } from "../../../utils/drizzle";
import { generateAndStoreReceiptPdf } from "../../../utils/pdf";

export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, "id");
  if (!param) {
    throw createError({ statusCode: 400, statusMessage: "Order identifier is required" });
  }

  const query = getQuery(event);
  const force = query.force === "1" || query.force === "true";

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

  let receiptKey = order.receiptBlobKey;

  if (!receiptKey || force) {
    // Generate on demand
    const orderItemsList = await db
      .select()
      .from(tables.orderItems)
      .where(eq(tables.orderItems.orderId, order.id));

    const itemsWithProduct = await Promise.all(
      orderItemsList.map(async (item) => {
        const [prod] = await db
          .select()
          .from(tables.products)
          .where(eq(tables.products.id, item.productId));
        return {
          productName: prod ? prod.name : `Product #${item.productId}`,
          price: item.priceAtPurchase,
          quantity: item.quantity,
          subtotal: item.priceAtPurchase * item.quantity,
        };
      }),
    );

    receiptKey = await generateAndStoreReceiptPdf(order, itemsWithProduct);

    await db
      .update(tables.orders)
      .set({ receiptBlobKey: receiptKey, updatedAt: new Date() })
      .where(eq(tables.orders.id, order.id));
  }

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", `inline; filename="receipt-${order.orderNumber}.pdf"`);

  return blob.serve(event, receiptKey);
});
