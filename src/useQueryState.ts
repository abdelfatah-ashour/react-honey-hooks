import { useCallback } from "react";
import { notifySearchChange } from "./querySearch";
import { useQuery, type Query } from "./useQuery";

/**
 * Changes to the query string: a string sets one value, an array sets repeated keys
 * (`?tag=a&tag=b`), and `null` or an empty array removes the key. Keys left out are kept.
 */
export type QueryUpdates<K extends string = string> = Partial<
  Record<K, string | readonly string[] | null>
>;

export interface SetQueryOptions {
  /** `"replace"` (the default) rewrites the current history entry; `"push"` adds one. */
  mode?: "replace" | "push";
}

export type SetQuery<K extends string = string> = (
  updates: QueryUpdates<K>,
  options?: SetQueryOptions,
) => void;

/** Values from untyped callers (a number, say) are converted with `String` rather than crash. */
function valuesOf(value: string | readonly string[] | null): readonly string[] {
  if (value === null) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

/** Updated keys keep their place in the query string; new keys are added at the end. */
function applyUpdates(current: URLSearchParams, updates: QueryUpdates): URLSearchParams {
  const changes = new Map(
    Object.entries(updates).filter(
      (entry): entry is [string, string | readonly string[] | null] => entry[1] !== undefined,
    ),
  );
  const next = new URLSearchParams();
  const written = new Set<string>();
  for (const [key, value] of current) {
    const change = changes.get(key);
    if (change === undefined) {
      next.append(key, value);
    } else if (!written.has(key)) {
      for (const item of valuesOf(change)) next.append(key, item);
      written.add(key);
    }
  }
  for (const [key, change] of changes) {
    if (!written.has(key)) for (const item of valuesOf(change)) next.append(key, item);
  }
  return next;
}

/**
 * Reads the URL's query string like `useQuery`, and returns a `setQuery` that merges updates
 * into it: a string sets a key, an array sets repeated keys, `null` removes one, and keys left
 * out are kept in place. By default it replaces the current history entry; pass
 * `{ mode: "push" }` to add one so Back undoes it. Every `useQuery` and `useQueryState` on the
 * page re-renders. An update that changes nothing writes nothing. `history.state` is kept, so
 * routers that store data there are not disturbed. `setQuery` keeps its identity.
 */
export function useQueryState<K extends string = string>(): readonly [Query<K>, SetQuery<K>] {
  const query = useQuery<K>();

  const setQuery = useCallback<SetQuery<K>>((updates, { mode = "replace" } = {}) => {
    const url = new URL(window.location.href);
    const next = applyUpdates(url.searchParams, updates).toString();
    // Compare decoded params, so `%20` and `+` for a space don't count as a change.
    if (next === url.searchParams.toString()) return;
    url.search = next;
    // Keep history.state: client-side routers store their own data there.
    if (mode === "push") window.history.pushState(window.history.state, "", url);
    else window.history.replaceState(window.history.state, "", url);
    notifySearchChange();
  }, []);

  return [query, setQuery];
}
