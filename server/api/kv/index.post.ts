export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.key || typeof body.key !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Key is required' })
  }

  const kv = hubKV()
  await kv.setItem(body.key.trim(), body.value)

  return { success: true, key: body.key, value: body.value }
})
