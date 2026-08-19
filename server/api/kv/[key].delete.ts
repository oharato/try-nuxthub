import { kv } from "hub:kv";

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, "key");

  if (!key) {
    throw createError({ statusCode: 400, statusMessage: "Key is required" });
  }

  await kv.del(decodeURIComponent(key));

  return { success: true };
});
