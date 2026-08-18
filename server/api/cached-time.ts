export default defineCachedEventHandler(
  async () => {
    return {
      generatedAt: new Date().toISOString(),
      timestamp: Date.now(),
      message: 'This response is cached at the edge for 10 seconds.'
    }
  },
  {
    maxAge: 10,
    name: 'cached-time'
  }
)
