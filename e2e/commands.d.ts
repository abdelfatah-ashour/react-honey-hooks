// Custom browser commands registered in vitest.config.ts.
declare module "vitest/browser" {
  interface BrowserCommands {
    dropEchoClients: (port: number) => Promise<void>;
    getCookies: () => Promise<{ name: string; value: string; path: string; expires: number }[]>;
    goOfflineFor: (ms: number) => Promise<void>;
    grantPermission: (name: string) => Promise<boolean>;
    mouseDown: () => Promise<void>;
    mouseUp: () => Promise<void>;
    wheel: (deltaY: number) => Promise<void>;
    setGeolocation: (latitude: number, longitude: number) => Promise<void>;
    startEchoServer: () => Promise<number>;
    emulateMedia: (preferences: {
      reducedMotion?: "reduce" | "no-preference" | null;
      colorScheme?: "light" | "dark" | "no-preference" | null;
    }) => Promise<void>;
  }
}

export {};
