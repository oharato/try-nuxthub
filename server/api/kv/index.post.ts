import { kv } from "hub:kv";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.key || typeof body.key !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Key is required" });
  }

  await kv.set(body.key.trim(), body.value);

  return { success: true, key: body.key, value: body.value };
});
