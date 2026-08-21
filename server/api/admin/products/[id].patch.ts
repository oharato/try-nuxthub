import { useDrizzle, tables, eq } from "../../../utils/drizzle";
import { broadcastInventoryUpdate } from "../../../utils/realtime";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user || (session.user as any).role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "管理者権限が必要です。" });
  }

  const paramId = getRouterParam(event, "id");
  const productId = Number(paramId);
  const body = await readBody(event);

  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: "Product ID is required" });
  }

  const db = useDrizzle();

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (body.name !== undefined) updateData.name = String(body.name).trim();
  if (body.price !== undefined) updateData.price = Number(body.price);
  if (body.stockQuantity !== undefined) updateData.stockQuantity = Number(body.stockQuantity);
  if (body.isPublished !== undefined) updateData.isPublished = Boolean(body.isPublished);
  if (body.description !== undefined) updateData.description = String(body.description).trim();
  if (body.categoryId !== undefined) updateData.categoryId = Number(body.categoryId);

  const [updatedProduct] = await db
    .update(tables.products)
    .set(updateData)
    .where(eq(tables.products.id, productId))
    .returning();

  if (!updatedProduct) {
    throw createError({ statusCode: 404, statusMessage: "Product not found" });
  }

  // If stockQuantity was updated, broadcast to realtime SSE subscribers
  if (body.stockQuantity !== undefined) {
    broadcastInventoryUpdate(updatedProduct.id, updatedProduct.stockQuantity);
  }

  return { success: true, product: updatedProduct };
});
