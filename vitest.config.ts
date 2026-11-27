import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";

/**
 * Cuts the real browser's network for `ms` milliseconds, which page code can't do itself.
 * It returns straight away and restores the network on the server side, because in Chromium
 * going offline also cuts the page's own connection to Vitest.
 */
const goOfflineFor: BrowserCommand<[ms: number]> = async (context, ms) => {
  if (context.provider.name !== "playwright") {
    throw new Error(`goOfflineFor is not supported by the ${context.provider.name} provider`);
  }
  const browserContext = context.context;
  await browserContext.setOffline(true);
  setTimeout(() => void browserContext.setOffline(false), ms);
};

/**
 * Grants the page a permission such as `"geolocation"` or `"clipboard-read"`; resolves whether
 * it did. At the time of writing Playwright grants geolocation in all three browsers but
 * clipboard access in Chromium only. Only ask a browser for permissions it knows: Playwright
 * keeps a refused one in the browser's list and sends it again, so every later grant in that
 * browser fails too. Grants last for the rest of the run in that browser.
 */
const grantPermission: BrowserCommand<[name: string]> = async (context, name) => {
  if (context.provider.name !== "playwright") return false;
  try {
    await context.context.grantPermissions([name]);
    return true;
  } catch {
    return false;
  }
};

/** Presses the real mouse's main button where the pointer is; move it first with `hover`. */
const mouseDown: BrowserCommand = async (context) => {
  if (context.provider.name !== "playwright") {
    throw new Error(`mouseDown is not supported by the ${context.provider.name} provider`);
  }
  await context.page.mouse.down();
};

/** Releases the real mouse's main button. */
const mouseUp: BrowserCommand = async (context) => {
  if (context.provider.name !== "playwright") {
    throw new Error(`mouseUp is not supported by the ${context.provider.name} provider`);
  }
  await context.page.mouse.up();
};

/** Scrolls the real mouse wheel by `deltaY` pixels where the pointer is. */
const wheel: BrowserCommand<[deltaY: number]> = async (context, deltaY) => {
  if (context.provider.name !== "playwright") {
    throw new Error(`wheel is not supported by the ${context.provider.name} provider`);
  }
  await context.page.mouse.wheel(0, deltaY);
};

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
            commands: { goOfflineFor, grantPermission, mouseDown, mouseUp, wheel },
            instances: [{ browser: "chromium" }, { browser: "firefox" }, { browser: "webkit" }],
          },
        },
      },
    ],
  },
});
