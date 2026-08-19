import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    pool: "forks",
    maxForks: process.env.CI ? 2 : undefined,
    isolate: false,
    environmentOptions: {
      nuxt: {
        domEnvironment: "happy-dom",
      },
    },
    server: {
      deps: {
        external: ["bun:test"],
      },
    },
  },
});
