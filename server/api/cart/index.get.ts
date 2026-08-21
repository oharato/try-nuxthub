import { getCartData } from "../../utils/cart";
import { useDrizzle, tables, inArray } from "../../utils/drizzle";

export async function enrichCart(cartData: {
  items: Array<{ productId: number; quantity: number; priceAtAdd: number }>;
}) {
  if (!cartData.items || cartData.items.length === 0) {
    return {
      items: [],
      subtotal: 0,
      totalCount: 0,
    };
  }

  const db = useDrizzle();
  const productIds = cartData.items.map((i) => i.productId);
  const products = await db
    .select()
    .from(tables.products)
    .where(inArray(tables.products.id, productIds));

  const images = await db
    .select()
    .from(tables.productImages)
    .where(inArray(tables.productImages.productId, productIds));

  const imagesMap = new Map<number, string>();
  for (const img of images) {
    if (!imagesMap.has(img.productId) || img.displayOrder === 1) {
      imagesMap.set(img.productId, img.blobKey);
    }
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  let totalCount = 0;

  const enrichedItems = cartData.items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      totalCount += item.quantity;

      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        quantity: item.quantity,
        stockQuantity: product.stockQuantity,
        image: imagesMap.get(product.id) || null,
        lineTotal,
      };
    })
    .filter(Boolean);

  return {
    items: enrichedItems,
    subtotal,
    totalCount,
  };
}

export default defineEventHandler(async (event) => {
  const cartData = await getCartData(event);
  return await enrichCart(cartData);
});
