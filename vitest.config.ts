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
 * Lets the page read the clipboard back, where the browser supports granting that; resolves
 * whether it did. Playwright supports these permissions in Chromium only at the time of writing.
 */
const grantClipboardRead: BrowserCommand = async (context) => {
  if (context.provider.name !== "playwright") return false;
  try {
    await context.context.grantPermissions(["clipboard-read", "clipboard-write"]);
    return true;
  } catch {
    return false;
  }
};

/** The user preferences `emulateMedia` can set; `null` goes back to the browser's own value. */
interface MediaPreferences {
  reducedMotion?: "reduce" | "no-preference" | null;
  colorScheme?: "light" | "dark" | "no-preference" | null;
}

/** Sets the media features the page sees (such as reduced motion), which page code can't do. */
const emulateMedia: BrowserCommand<[preferences: MediaPreferences]> = async (
  context,
  preferences,
) => {
  if (context.provider.name !== "playwright") {
    throw new Error(`emulateMedia is not supported by the ${context.provider.name} provider`);
  }
  await context.page.emulateMedia(preferences);
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
            commands: { goOfflineFor, grantClipboardRead, emulateMedia },
            instances: [{ browser: "chromium" }, { browser: "firefox" }, { browser: "webkit" }],
          },
        },
      },
    ],
  },
});
