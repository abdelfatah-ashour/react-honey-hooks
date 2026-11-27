// Custom browser commands registered in vitest.config.ts.
declare module "vitest/browser" {
  interface BrowserCommands {
    goOfflineFor: (ms: number) => Promise<void>;
    grantClipboardRead: () => Promise<boolean>;
    emulateMedia: (preferences: {
      reducedMotion?: "reduce" | "no-preference" | null;
      colorScheme?: "light" | "dark" | "no-preference" | null;
    }) => Promise<void>;
  }
}

export {};
