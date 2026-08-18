export default defineEventHandler(async () => {
  const blob = hubBlob()
  return await blob.list()
})
