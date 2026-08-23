import { subscribeAdminOrders } from "../../utils/realtime";

export default defineEventHandler((event) => {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connected event
  writer
    .write(
      encoder.encode(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`),
    )
    .catch(() => {});

  const unsubscribe = subscribeAdminOrders(async (data) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      unsubscribe();
    }
  });

  const heartbeatInterval = setInterval(() => {
    writer.write(encoder.encode(`: ping\n\n`)).catch(() => {
      clearInterval(heartbeatInterval);
      unsubscribe();
    });
  }, 25000);

  if (event.node?.req) {
    event.node.req.on?.("close", () => {
      clearInterval(heartbeatInterval);
      unsubscribe();
    });
  }

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
