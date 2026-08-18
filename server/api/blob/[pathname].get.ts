export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')

  if (!pathname) {
    throw createError({ statusCode: 400, statusMessage: 'Pathname is required' })
  }

  return hubBlob().serve(event, decodeURIComponent(pathname))
})
