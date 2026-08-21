import type { H3Event } from "h3";
import { kv } from "hub:kv";

export interface CartItem {
  productId: number;
  quantity: number;
  priceAtAdd: number;
}

export interface CartData {
  items: CartItem[];
}

export interface RecentlyViewedItem {
  productId: number;
  viewedAt: string;
}

const GUEST_COOKIE_NAME = "guest_session_id";
const GUEST_CART_TTL = 7 * 24 * 60 * 60; // 7 days (seconds)
const USER_CART_TTL = 30 * 24 * 60 * 60; // 30 days (seconds)

export function getOrCreateGuestSessionId(event: H3Event): string {
  let guestId =
    getCookie(event, GUEST_COOKIE_NAME) ||
    (getHeader(event, "x-guest-session-id") as string | undefined);
  if (!guestId) {
    guestId = crypto.randomUUID();
    setCookie(event, GUEST_COOKIE_NAME, guestId, {
      maxAge: GUEST_CART_TTL,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }
  return guestId;
}

export async function getCartKey(
  event: H3Event,
): Promise<{ key: string; isUser: boolean; id: string | number }> {
  const session = await getUserSession(event);
  if (session?.user && (session.user as any).id) {
    const userId = (session.user as any).id;
    return { key: `cart:user_${userId}`, isUser: true, id: userId };
  }
  const guestId = getOrCreateGuestSessionId(event);
  return { key: `cart:guest_${guestId}`, isUser: false, id: guestId };
}

export async function getCartData(event: H3Event): Promise<CartData> {
  const { key } = await getCartKey(event);
  const data = await kv.get<CartData>(key);
  if (!data || !Array.isArray(data.items)) {
    return { items: [] };
  }
  return data;
}

export async function saveCartData(event: H3Event, cart: CartData): Promise<void> {
  const { key, isUser } = await getCartKey(event);
  const ttl = isUser ? USER_CART_TTL : GUEST_CART_TTL;
  await kv.set(key, cart, { ttl });
}

export async function clearCartData(event: H3Event): Promise<void> {
  const { key } = await getCartKey(event);
  await kv.del(key);
}

export async function mergeGuestCartIntoUser(
  guestSessionId: string,
  userId: number,
): Promise<void> {
  if (!guestSessionId) return;

  const guestKey = `cart:guest_${guestSessionId}`;
  const userKey = `cart:user_${userId}`;

  const guestCart = await kv.get<CartData>(guestKey);
  if (!guestCart || !Array.isArray(guestCart.items) || guestCart.items.length === 0) {
    return;
  }

  const userCart = (await kv.get<CartData>(userKey)) || { items: [] };
  const mergedItemsMap = new Map<number, CartItem>();

  for (const item of userCart.items || []) {
    mergedItemsMap.set(item.productId, { ...item });
  }

  for (const item of guestCart.items) {
    if (mergedItemsMap.has(item.productId)) {
      const existing = mergedItemsMap.get(item.productId)!;
      existing.quantity += item.quantity;
    } else {
      mergedItemsMap.set(item.productId, { ...item });
    }
  }

  const mergedCart: CartData = { items: Array.from(mergedItemsMap.values()) };
  await kv.set(userKey, mergedCart, { ttl: USER_CART_TTL });
  await kv.del(guestKey);

  // Also merge recently viewed
  const guestRvKey = `recently_viewed:guest_${guestSessionId}`;
  const userRvKey = `recently_viewed:user_${userId}`;
  const guestRv = (await kv.get<RecentlyViewedItem[]>(guestRvKey)) || [];
  const userRv = (await kv.get<RecentlyViewedItem[]>(userRvKey)) || [];

  const combinedRv = [...guestRv, ...userRv];
  const uniqueRv: RecentlyViewedItem[] = [];
  const seenIds = new Set<number>();
  for (const item of combinedRv) {
    if (!seenIds.has(item.productId)) {
      seenIds.add(item.productId);
      uniqueRv.push(item);
    }
  }
  await kv.set(userRvKey, uniqueRv.slice(0, 6), { ttl: USER_CART_TTL });
  await kv.del(guestRvKey);
}

// --- Recently Viewed ---

export async function getRecentlyViewedKey(
  event: H3Event,
): Promise<{ key: string; isUser: boolean }> {
  const session = await getUserSession(event);
  if (session?.user && (session.user as any).id) {
    return { key: `recently_viewed:user_${(session.user as any).id}`, isUser: true };
  }
  const guestId = getOrCreateGuestSessionId(event);
  return { key: `recently_viewed:guest_${guestId}`, isUser: false };
}

export async function recordRecentlyViewed(event: H3Event, productId: number): Promise<void> {
  const { key, isUser } = await getRecentlyViewedKey(event);
  const ttl = isUser ? USER_CART_TTL : GUEST_CART_TTL;
  const list = (await kv.get<RecentlyViewedItem[]>(key)) || [];

  // Filter out existing occurrence and unshift new one
  const filtered = list.filter((item) => item.productId !== productId);
  filtered.unshift({ productId, viewedAt: new Date().toISOString() });

  // Limit to 6 items
  const updated = filtered.slice(0, 6);
  await kv.set(key, updated, { ttl });
}

export async function getRecentlyViewedList(event: H3Event): Promise<RecentlyViewedItem[]> {
  const { key } = await getRecentlyViewedKey(event);
  const list = await kv.get<RecentlyViewedItem[]>(key);
  return Array.isArray(list) ? list : [];
}
