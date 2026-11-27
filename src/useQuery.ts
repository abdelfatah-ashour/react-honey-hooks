import { useMemo, useSyncExternalStore } from "react";

/** Query params keyed by `K`. Every key may be missing from the URL, so values are optional. */
export type QueryParams<K extends string = string> = Readonly<Partial<Record<K, string>>>;

export interface Query<K extends string = string> {
  /** One value per key; for repeated keys (`?tag=a&tag=b`) the last value wins. */
  readonly params: QueryParams<K>;
  /** Every value of `key` in URL order, or an empty array when it is absent. */
  readonly getAll: (key: K) => readonly string[];
}

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
 * Reads the current URL's query string, re-reading it on back/forward navigation.
 */
export function useQuery<K extends string = string>(): Query<K> {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  return useMemo(() => {
    const searchParams = new URLSearchParams(search);
    return {
      params: Object.fromEntries(searchParams) as QueryParams<K>,
      getAll: (key: K) => searchParams.getAll(key),
    };
  }, [search]);
}
