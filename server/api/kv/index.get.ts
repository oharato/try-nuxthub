export default defineEventHandler(async () => {
  const kv = hubKV()
  const keys = await kv.getKeys()
  const entries = await Promise.all(
    keys.map(async (key: string) => ({
      key,
      value: await kv.getItem(key)
    }))
  )
  return entries
})
