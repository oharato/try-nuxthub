import { getCartData, saveCartData } from "../../../utils/cart";
import { enrichCart } from "../index.get";

export default defineEventHandler(async (event) => {
  const paramId = getRouterParam(event, "id");
  const productId = Number(paramId);
  const body = await readBody(event);
  const quantity = Number(body.quantity);

  if (!productId || isNaN(quantity)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid product ID or quantity" });
  }

  const cart = await getCartData(event);

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.productId !== productId);
  } else {
    const item = cart.items.find((i) => i.productId === productId);
    if (item) {
      item.quantity = quantity;
    }
  }

  await saveCartData(event, cart);

  return await enrichCart(cart);
});
