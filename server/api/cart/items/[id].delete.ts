import { getCartData, saveCartData } from "../../../utils/cart";
import { enrichCart } from "../index.get";

export default defineEventHandler(async (event) => {
  const paramId = getRouterParam(event, "id");
  const productId = Number(paramId);

  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: "Invalid product ID" });
  }

  const cart = await getCartData(event);
  cart.items = cart.items.filter((i) => i.productId !== productId);

  await saveCartData(event, cart);

  return await enrichCart(cart);
});
