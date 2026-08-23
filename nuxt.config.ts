// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // https://nuxt.com/modules
  modules: ["@nuxthub/core", "nuxt-auth-utils"],

  // https://devtools.nuxt.com
  devtools: { enabled: true },

  // Build optimizations
  telemetry: false,
  sourcemap: {
    server: false,
    client: false,
  },

  // App & SEO Configuration
  app: {
    head: {
      htmlAttrs: {
        lang: "ja",
      },
      title: "CraftCommerce - モダン・クラフトストア",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "全国の職人・クリエイターによるこだわりの手作り工芸品、木工家具、陶芸、レザーアイテム、商用フォントをお届けするモダンEコマースプラットフォーム。",
        },
      ],
      link: [
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏺</text></svg>",
        },
      ],
    },
  },

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
