import { kv } from "hub:kv";

export default defineEventHandler(async () => {
  const keys = await kv.keys();
  const entries = await Promise.all(
    keys.map(async (key: string) => ({
      key,
      value: await kv.get(key),
    })),
  );
  return entries;
});
