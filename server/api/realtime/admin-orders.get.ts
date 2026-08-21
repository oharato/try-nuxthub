import { createEventStream } from "h3";
import { subscribeAdminOrders } from "../../utils/realtime";

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event);

  const unsubscribe = subscribeAdminOrders(async (data) => {
    try {
      await eventStream.push(JSON.stringify(data));
    } catch {
      // client disconnected
    }
  });

  eventStream.onClosed(async () => {
    unsubscribe();
  });

  // Send initial ping/connection event
  await eventStream.push(JSON.stringify({ type: "connected", timestamp: Date.now() }));

  return eventStream.send();
});
