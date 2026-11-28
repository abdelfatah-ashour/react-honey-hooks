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

/**
 * Sets the position the browser reports to Geolocation. The page also needs the "geolocation"
 * permission, from `grantPermission`.
 */
const setGeolocation: BrowserCommand<[latitude: number, longitude: number]> = async (
  context,
  latitude,
  longitude,
) => {
  if (context.provider.name !== "playwright") {
    throw new Error(`setGeolocation is not supported by the ${context.provider.name} provider`);
  }
  await context.context.setGeolocation({ latitude, longitude });
};

/** Scrolls the real mouse wheel by `deltaY` pixels where the pointer is. */
const wheel: BrowserCommand<[deltaY: number]> = async (context, deltaY) => {
  if (context.provider.name !== "playwright") {
    throw new Error(`wheel is not supported by the ${context.provider.name} provider`);
  }
  await context.page.mouse.wheel(0, deltaY);
};

/** A cookie as the browser stores it, with the attributes page code can't read. */
interface BrowserCookie {
  name: string;
  value: string;
  path: string;
  /** Seconds since the epoch, or -1 for a session cookie. */
  expires: number;
}

/** The browser's cookies for the page, with their attributes. */
const getCookies: BrowserCommand = async (context): Promise<BrowserCookie[]> => {
  if (context.provider.name !== "playwright") {
    throw new Error(`getCookies is not supported by the ${context.provider.name} provider`);
  }
  const cookies = await context.context.cookies(context.page.url());
  return cookies.map(({ name, value, path, expires }) => ({ name, value, path, expires }));
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

/**
 * Browser tests that need the browser to themselves, so they run one file at a time, after the
 * others, in browsers of their own. Test files otherwise share one tab and one set of
 * permissions: Firefox only grants fullscreen to a focused document, and parallel files keep
 * moving focus, and permission tests would see grants made by other files.
 */
const EXCLUSIVE_E2E = ["e2e/useFullscreen.test.tsx", "e2e/usePermission.test.tsx"];

/** A project running files from `e2e/` in real browsers against the built bundle. */
function e2eProject(test: {
  name: string;
  include: string[];
  exclude?: string[];
  fileParallelism?: boolean;
  sequence: { groupOrder: number };
}) {
  return {
    extends: true,
    // e2e tests import the published bundle, so `npm run test:e2e` builds it first.
    resolve: {
      alias: {
        "react-honey-hooks": fileURLToPath(new URL("dist/index.js", import.meta.url)),
      },
    },
    test: {
      ...test,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        commands: {
          getCookies,
          goOfflineFor,
          grantPermission,
          mouseDown,
          mouseUp,
          wheel,
          emulateMedia,
          setGeolocation,
        },
        instances: [
          { browser: "chromium" as const },
          { browser: "firefox" as const },
          { browser: "webkit" as const },
        ],
      },
    },
  };
}

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
        // Bundle tests read the built package, so `npm run test:bundle` builds it first.
        test: {
          name: "bundle",
          environment: "node",
          globals: true,
          include: ["bundle/**/*.test.ts"],
        },
      },
      e2eProject({
        name: "e2e",
        include: ["e2e/**/*.test.{ts,tsx}"],
        exclude: EXCLUSIVE_E2E,
        sequence: { groupOrder: 0 },
      }),
      e2eProject({
        name: "e2e-exclusive",
        include: EXCLUSIVE_E2E,
        fileParallelism: false,
        sequence: { groupOrder: 1 },
      }),
    ],
  },
});
