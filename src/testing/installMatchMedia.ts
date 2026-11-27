/**
 * jsdom has no `matchMedia`, so this stands in for the browser API: each query has a
 * `matches` flag the test sets, and `setMatches` fires `change` like a real resize would.
 */
export function installMatchMedia() {
  const matches = new Map<string, boolean>();
  const listeners = new Map<string, Set<(event: MediaQueryListEvent) => void>>();

  window.matchMedia = (query: string) =>
    ({
      media: query,
      get matches() {
        return matches.get(query) ?? false;
      },
      addEventListener: (_type: "change", listener: (event: MediaQueryListEvent) => void) => {
        if (!listeners.has(query)) listeners.set(query, new Set());
        listeners.get(query)?.add(listener);
      },
      removeEventListener: (_type: "change", listener: (event: MediaQueryListEvent) => void) => {
        listeners.get(query)?.delete(listener);
      },
    }) as MediaQueryList;

  return {
    setMatches(query: string, value: boolean) {
      matches.set(query, value);
      for (const listener of listeners.get(query) ?? []) {
        listener({ matches: value, media: query } as MediaQueryListEvent);
      }
    },
    listenerCount(query: string) {
      return listeners.get(query)?.size ?? 0;
    },
  };
}
