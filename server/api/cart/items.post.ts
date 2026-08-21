import { getCartData, saveCartData } from "../../utils/cart";
import { useDrizzle, tables, eq } from "../../utils/drizzle";
import { enrichCart } from "./index.get";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const productId = Number(body.productId);
  const quantity = Math.max(1, Number(body.quantity) || 1);

  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: "Product ID is required" });
  }

  const db = useDrizzle();
  const [product] = await db
    .select()
    .from(tables.products)
    .where(eq(tables.products.id, productId));

  if (!product || !product.isPublished) {
    throw createError({ statusCode: 404, statusMessage: "Product not found or unavailable" });
  }

  const cart = await getCartData(event);
  const existingItemIndex = cart.items.findIndex((i) => i.productId === productId);

  if (existingItemIndex >= 0 && cart.items[existingItemIndex]) {
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    cart.items.push({
      productId,
      quantity,
      priceAtAdd: product.price,
    });
  }

  await saveCartData(event, cart);

  return await enrichCart(cart);
});
