import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
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
