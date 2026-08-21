import { getCartData, clearCartData, type CartItem } from "../../utils/cart";
import { useDrizzle, tables, eq, inArray } from "../../utils/drizzle";
import { broadcastInventoryUpdate, broadcastNewOrder } from "../../utils/realtime";
import { processOrderPostActions } from "../../utils/jobs";

function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomSuffix}`;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { customerName, customerEmail, shippingAddress, items: directItems } = body || {};

  if (!customerName || !customerEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: "お名前とメールアドレスは必須です。",
    });
  }

  const session = await getUserSession(event);
  const userId = (session?.user as any)?.id || null;
  const guestSessionId =
    getCookie(event, "guest_session_id") ||
    (getHeader(event, "x-guest-session-id") as string | undefined) ||
    null;

  let orderItemsList: CartItem[] = [];
  if (Array.isArray(directItems) && directItems.length > 0) {
    orderItemsList = directItems;
  } else {
    const cart = await getCartData(event);
    orderItemsList = cart.items || [];
  }

  if (orderItemsList.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "カートが空です。",
    });
  }

  const db = useDrizzle();
  const productIds = orderItemsList.map((i) => i.productId);
  const products = await db
    .select()
    .from(tables.products)
    .where(inArray(tables.products.id, productIds));

  const productMap = new Map(products.map((p) => [p.id, p]));

  // 1. Verify stock for all items
  for (const item of orderItemsList) {
    const prod = productMap.get(item.productId);
    if (!prod || !prod.isPublished) {
      throw createError({
        statusCode: 400,
        statusMessage: `商品が見つからないか非公開です (ID: ${item.productId})`,
      });
    }
    if (prod.stockQuantity < item.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `「${prod.name}」の在庫が不足しています（残り: ${prod.stockQuantity}点）`,
      });
    }
  }

  // 2. Calculate Total Amount
  const totalAmount = orderItemsList.reduce((sum, item) => {
    const prod = productMap.get(item.productId)!;
    return sum + prod.price * item.quantity;
  }, 0);

  const orderNumber = generateOrderNumber();

  // 3. Create Order and OrderItems, Deduct Stock
  const [createdOrder] = await db
    .insert(tables.orders)
    .values({
      userId,
      guestSessionId,
      orderNumber,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      shippingAddress: shippingAddress ? String(shippingAddress).trim() : null,
      totalAmount,
      status: "paid", // Instant mock payment completion
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!createdOrder) {
    throw createError({
      statusCode: 500,
      statusMessage: "注文の作成に失敗しました。",
    });
  }

  for (const item of orderItemsList) {
    const prod = productMap.get(item.productId)!;
    const newStock = prod.stockQuantity - item.quantity;

    // Insert order item
    await db.insert(tables.orderItems).values({
      orderId: createdOrder.id,
      productId: prod.id,
      priceAtPurchase: prod.price,
      quantity: item.quantity,
    });

    // Deduct stock in DB
    await db
      .update(tables.products)
      .set({ stockQuantity: newStock, updatedAt: new Date() })
      .where(eq(tables.products.id, prod.id));

    // Broadcast inventory update via SSE
    broadcastInventoryUpdate(prod.id, newStock);
  }

  // 4. Clear Cart in KV
  await clearCartData(event);

  // 5. Broadcast to Admin Orders SSE
  broadcastNewOrder({
    id: createdOrder.id,
    orderNumber: createdOrder.orderNumber,
    customerName: createdOrder.customerName,
    totalAmount: createdOrder.totalAmount,
    createdAt: createdOrder.createdAt,
  });

  // 6. Trigger Asynchronous Background Jobs (Email Log + Receipt PDF generation to R2)
  processOrderPostActions(createdOrder.id).catch((err) =>
    console.error("Order post actions job error:", err),
  );

  return {
    success: true,
    order: {
      id: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      totalAmount: createdOrder.totalAmount,
      status: createdOrder.status,
      customerName: createdOrder.customerName,
      customerEmail: createdOrder.customerEmail,
      createdAt: createdOrder.createdAt,
    },
  };
});
