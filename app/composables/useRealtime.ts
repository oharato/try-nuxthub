export function useRealtimeInventory(
  onStockUpdate: (data: { productId: number; stockQuantity: number }) => void,
) {
  let eventSource: EventSource | null = null;

  onMounted(() => {
    if (typeof window === "undefined") return;

    try {
      eventSource = new EventSource("/api/realtime/inventory");
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === "inventory" && typeof data.productId === "number") {
            onStockUpdate(data);
          }
        } catch {
          // ignore non-json messages
        }
      };
      eventSource.onerror = () => {
        // SSE automatic reconnect
      };
    } catch (e) {
      console.warn("Failed to initialize Inventory SSE:", e);
    }
  });

  onUnmounted(() => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  });
}

export function useRealtimeAdminOrders(onNewOrder: (data: { order: any }) => void) {
  let eventSource: EventSource | null = null;

  onMounted(() => {
    if (typeof window === "undefined") return;

    try {
      eventSource = new EventSource("/api/realtime/admin-orders");
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === "new_order" && data.order) {
            onNewOrder(data);
          }
        } catch {
          // ignore
        }
      };
      eventSource.onerror = () => {
        // SSE automatic reconnect
      };
    } catch (e) {
      console.warn("Failed to initialize Admin Orders SSE:", e);
    }
  });

  onUnmounted(() => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  });
}
