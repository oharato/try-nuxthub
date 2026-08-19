// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // https://nuxt.com/modules
  modules: ["@nuxthub/core"],

  // https://devtools.nuxt.com
  devtools: { enabled: true },

  // Dev server configuration for LAN access
  devServer: {
    host: "0.0.0.0",
    port: 3000,
  },

  // Env variables - https://nuxt.com/docs/getting-started/configuration#environment-variables-and-private-tokens
  runtimeConfig: {
    public: {
      // Can be overridden by NUXT_PUBLIC_HELLO_TEXT environment variable
      helloText: "Hello from the Edge 👋",
    },
  },
  compatibilityDate: "2025-03-01",

  // https://hub.nuxt.com/docs/getting-started/installation#options
  hub: {
    db: "sqlite",
    kv: true,
    blob: true,
    cache: true,
  },
});
