export interface EnrichedCartItem {
  productId: number;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  image: string | null;
  lineTotal: number;
}

export interface CartResponse {
  items: EnrichedCartItem[];
  subtotal: number;
  totalCount: number;
}

export function useCart() {
  const cart = useState<CartResponse>("craft_cart", () => ({
    items: [],
    subtotal: 0,
    totalCount: 0,
  }));
  const isLoading = useState<boolean>("craft_cart_loading", () => false);

  async function fetchCart() {
    isLoading.value = true;
    try {
      const data = await $fetch<CartResponse>("/api/cart");
      cart.value = data;
    } catch (e) {
      console.error("Failed to fetch cart:", e);
    } finally {
      isLoading.value = false;
    }
  }

  async function addToCart(productId: number, quantity = 1) {
    isLoading.value = true;
    try {
      const data = await $fetch<CartResponse>("/api/cart/items", {
        method: "POST",
        body: { productId, quantity },
      });
      cart.value = data;
      return true;
    } catch (e: any) {
      alert(e?.data?.statusMessage || e?.message || "カートへの追加に失敗しました");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateQuantity(productId: number, quantity: number) {
    isLoading.value = true;
    try {
      const data = await $fetch<CartResponse>(`/api/cart/items/${productId}`, {
        method: "PATCH",
        body: { quantity },
      });
      cart.value = data;
    } catch (e: any) {
      alert(e?.data?.statusMessage || e?.message || "数量の変更に失敗しました");
    } finally {
      isLoading.value = false;
    }
  }

  async function removeItem(productId: number) {
    isLoading.value = true;
    try {
      const data = await $fetch<CartResponse>(`/api/cart/items/${productId}`, {
        method: "DELETE",
      });
      cart.value = data;
    } catch (e: any) {
      alert(e?.data?.statusMessage || e?.message || "アイテムの削除に失敗しました");
    } finally {
      isLoading.value = false;
    }
  }

  return {
    cart,
    isLoading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
  };
}
