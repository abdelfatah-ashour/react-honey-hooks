/**
 * The URL's query string as an external store, shared by `useQuery` and `useQueryState`.
 * It changes on back/forward navigation (`popstate`) and when `useQueryState` writes the URL.
 * Internal: not exported from the package.
 */

const listeners = new Set<() => void>();

export function subscribeToSearch(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

export function getSearch(): string {
  return window.location.search;
}

/** No URL exists on the server; hydration then picks up the real query string. */
export function getServerSearch(): string {
  return "";
}

/** Tells every subscriber the query string may have changed after a `history` write. */
export function notifySearchChange(): void {
  for (const listener of listeners) listener();
}
