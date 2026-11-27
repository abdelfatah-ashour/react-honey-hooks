import { useCallback, useSyncExternalStore } from "react";

/**
 * Returns whether the CSS media `query` matches, updating when it starts or stops matching.
 * During server rendering, and on the first client render while hydrating, it returns
 * `defaultValue` (`false` unless given), because there is no viewport on the server.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => {
        list.removeEventListener("change", onChange);
      };
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => defaultValue,
  );
}
