// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // https://nuxt.com/modules
  modules: ["@nuxthub/core", "nuxt-auth-utils"],

  // https://devtools.nuxt.com
  devtools: { enabled: true },

  // Dev server configuration for LAN access
  devServer: {
    host: "0.0.0.0",
    port: 3000,
  },

  // Vite configuration for LAN hosts
  vite: {
    server: {
      allowedHosts: true,
    },
  },

  // Env variables - https://nuxt.com/docs/getting-started/configuration#environment-variables-and-private-tokens
  runtimeConfig: {
    session: {
      password:
        process.env.NUXT_SESSION_PASSWORD ||
        "default-dev-session-password-must-be-at-least-32-chars-long!",
      cookie: {
        secure: false,
        sameSite: "lax",
      },
    },
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
