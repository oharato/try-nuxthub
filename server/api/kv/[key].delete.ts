export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')

  if (!key) {
    throw createError({ statusCode: 400, statusMessage: 'Key is required' })
  }

  const kv = hubKV()
  await kv.removeItem(decodeURIComponent(key))

  return { success: true }
})
