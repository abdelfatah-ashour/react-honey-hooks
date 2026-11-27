import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";

const browserGlobals = ["window", "document"] as const;

/**
 * Renders `element` with `renderToString` while `window` and `document` don't exist, as on a
 * real server. jsdom defines both, so without this a hook that reads them during render would
 * still pass a server-render test.
 */
export function renderOnServer(element: ReactElement): string {
  const saved = browserGlobals.map(
    (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
  );
  for (const name of browserGlobals) Reflect.deleteProperty(globalThis, name);
  try {
    if (typeof window !== "undefined" || typeof document !== "undefined") {
      throw new Error("renderOnServer could not remove window and document");
    }
    return renderToString(element);
  } finally {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    }
  }
}
