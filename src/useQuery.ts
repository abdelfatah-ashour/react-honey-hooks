import { useMemo, useSyncExternalStore } from "react";
import { getSearch, getServerSearch, subscribeToSearch } from "./querySearch";

/** Query params keyed by `K`. Every key may be missing from the URL, so values are optional. */
export type QueryParams<K extends string = string> = Readonly<Partial<Record<K, string>>>;

export interface Query<K extends string = string> {
  /** One value per key; for repeated keys (`?tag=a&tag=b`) the last value wins. */
  readonly params: QueryParams<K>;
  /** Every value of `key` in URL order, or an empty array when it is absent. */
  readonly getAll: (key: K) => readonly string[];
}

/**
 * Reads the current URL's query string, re-reading it on back/forward navigation.
 */
export function useQuery<K extends string = string>(): Query<K> {
  const search = useSyncExternalStore(subscribeToSearch, getSearch, getServerSearch);
  return useMemo(() => {
    const searchParams = new URLSearchParams(search);
    return {
      params: Object.fromEntries(searchParams) as QueryParams<K>,
      getAll: (key: K) => searchParams.getAll(key),
    };
  }, [search]);
}
