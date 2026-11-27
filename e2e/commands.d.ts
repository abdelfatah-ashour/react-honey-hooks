// Custom browser commands registered in vitest.config.ts.
declare module "vitest/browser" {
  interface BrowserCommands {
    goOfflineFor: (ms: number) => Promise<void>;
    grantPermission: (name: string) => Promise<boolean>;
    mouseDown: () => Promise<void>;
    mouseUp: () => Promise<void>;
  }
}

export {};
