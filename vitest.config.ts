import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          include: ["src/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        // e2e tests import the published bundle, so `npm run test:e2e` builds it first.
        resolve: {
          alias: {
            "react-honey-hooks": fileURLToPath(new URL("dist/index.js", import.meta.url)),
          },
        },
        test: {
          name: "e2e",
          include: ["e2e/**/*.test.{ts,tsx}"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }, { browser: "firefox" }, { browser: "webkit" }],
          },
        },
      },
    ],
  },
});
