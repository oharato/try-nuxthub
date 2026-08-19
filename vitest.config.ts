import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    pool: "forks",
    poolOptions: {
      forks: {
        maxForks: process.env.CI ? 2 : undefined,
      },
    },
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
