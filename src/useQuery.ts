import { useMemo, useSyncExternalStore } from "react";

export type QueryParams = Readonly<Record<string, string>>;

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
  };
}

function getSearch(): string {
  return window.location.search;
}

/** No URL exists on the server; hydration then picks up the real query string. */
function getServerSearch(): string {
  return "";
}

/**
 * Returns the current URL's query string as a read-only object, re-reading it on
 * back/forward navigation. For repeated keys (`?tag=a&tag=b`) the last value wins.
 */
export function useQuery(): QueryParams {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  return useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
}
