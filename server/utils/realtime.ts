import { EventEmitter } from "node:events";

// Global in-memory event bus for local and single-instance worker SSE broadcasts
class RealtimeHub extends EventEmitter {}

const globalRealtime = new RealtimeHub();
// Increase max listeners for concurrent SSE clients
globalRealtime.setMaxListeners(200);

export function broadcastInventoryUpdate(productId: number, stockQuantity: number) {
  globalRealtime.emit("inventory:update", {
    type: "inventory",
    productId,
    stockQuantity,
    timestamp: Date.now(),
  });
}

export function broadcastNewOrder(order: {
  id: number;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  createdAt: Date | string;
}) {
  globalRealtime.emit("admin:new_order", {
    type: "new_order",
    order,
    timestamp: Date.now(),
  });
}

export function subscribeInventory(callback: (data: any) => void) {
  globalRealtime.on("inventory:update", callback);
  return () => {
    globalRealtime.off("inventory:update", callback);
  };
}

export function subscribeAdminOrders(callback: (data: any) => void) {
  globalRealtime.on("admin:new_order", callback);
  return () => {
    globalRealtime.off("admin:new_order", callback);
  };
}
