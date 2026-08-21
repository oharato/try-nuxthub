import { useDrizzle, tables, eq } from "./drizzle";
import { generateAndStoreReceiptPdf } from "./pdf";

export async function createJobLog(
  jobType: "order_confirmation_mail" | "receipt_generation" | "daily_sales_report",
  status: "queued" | "running" | "completed" | "failed",
  payload: any,
  finishedAt?: Date,
) {
  const db = useDrizzle();
  const [created] = await db
    .insert(tables.jobLogs)
    .values({
      jobType,
      status,
      payload: typeof payload === "string" ? payload : JSON.stringify(payload),
      createdAt: new Date(),
      finishedAt:
        finishedAt || (status === "completed" || status === "failed" ? new Date() : undefined),
    })
    .returning();
  return created;
}

export async function processOrderPostActions(orderId: number) {
  const db = useDrizzle();

  // 1. Fetch Order and Items
  const [order] = await db.select().from(tables.orders).where(eq(tables.orders.id, orderId));
  if (!order) return;

  const orderItemsList = await db
    .select()
    .from(tables.orderItems)
    .where(eq(tables.orderItems.orderId, orderId));

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

  // 2. Queue & Process Order Confirmation Email Job
  await createJobLog("order_confirmation_mail", "completed", {
    to: order.customerEmail,
    subject: `【CraftCommerce】ご注文ありがとうございます (${order.orderNumber})`,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    customerName: order.customerName,
    itemsCount: orderItemsList.length,
    sentAt: new Date().toISOString(),
  });

  // 3. Queue & Process Receipt PDF Generation Job
  try {
    const receiptBlobKey = await generateAndStoreReceiptPdf(order, itemsWithProduct);

    // Update order with receipt key
    await db
      .update(tables.orders)
      .set({ receiptBlobKey, updatedAt: new Date() })
      .where(eq(tables.orders.id, orderId));

    await createJobLog("receipt_generation", "completed", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      receiptBlobKey,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Failed to generate receipt PDF:", error);
    await createJobLog("receipt_generation", "failed", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      error: error?.message || String(error),
    });
  }
}

export async function processDailySalesReport() {
  const db = useDrizzle();

  const allOrders = await db.select().from(tables.orders);
  const paidOrders = allOrders.filter((o) => o.status !== "cancelled");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const reportPayload = {
    reportDate: new Date().toISOString().split("T")[0],
    totalOrders: allOrders.length,
    paidOrdersCount: paidOrders.length,
    totalRevenue,
    generatedAt: new Date().toISOString(),
  };

  const jobLog = await createJobLog("daily_sales_report", "completed", reportPayload, new Date());

  return { success: true, report: reportPayload, jobLog };
}
