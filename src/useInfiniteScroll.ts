import { type DependencyList, type RefObject, useEffect, useRef, useState } from "react";
import { useLatest } from "./useLatest";

/** One page of results, and the cursor for the page after it (`undefined` on the last page). */
export interface Page<T, C> {
  items: T[];
  next?: C | undefined;
}

/**
 * `"loading"`: the first page is loading. `"loadingMore"`: a later page is. `"idle"`: nothing is
 * loading. `"error"`: the last load failed.
 */
export type InfiniteScrollStatus = "loading" | "loadingMore" | "idle" | "error";

export interface InfiniteScroll<T> {
  /** Every item loaded so far, in page order. */
  readonly items: T[];
  readonly status: InfiniteScrollStatus;
  /** Why the last load failed, until a load succeeds. */
  readonly error: Error | undefined;
  /** Whether there are more pages to load. */
  readonly hasMore: boolean;
  /** Loads the next page, unless one is loading or there are no more. Retries a failed page. */
  readonly loadMore: () => void;
  /** Drops the loaded items and loads the first page again. */
  readonly reload: () => void;
}

interface State<T, C> {
  items: T[];
  cursor: C | undefined;
  hasMore: boolean;
  status: InfiniteScrollStatus;
  error: Error | undefined;
}

export interface InfiniteScrollOptions {
  /** An element at the end of the list: the next page loads while it is in view. */
  sentinel?: RefObject<Element | null>;
  /** How far from view the sentinel starts loading, in CSS margin syntax. Defaults to `"200px"`. */
  rootMargin?: string;
  /** Values that, when changed, drop the loaded items and load from the first page again. */
  deps?: DependencyList;
}

/**
 * Loads a list page by page, such as a feed that grows as you scroll. `loadPage(cursor, signal)`
 * loads the page at `cursor` (`undefined` for the first) and returns its `items` and the `next`
 * cursor, which is `undefined` on the last page. The first page loads on mount. With a
 * `sentinel` (an element after the list), the next page loads while it is within `rootMargin` of
 * view, page after page until it leaves view; `loadMore` loads one too. Only one page loads at
 * a time. If a page fails, the items so far are kept, `status` is `"error"`, and `loadMore`
 * tries that page again. `reload`, or a change in `deps`, aborts any load in progress, drops
 * the items and starts from the first page; unmounting aborts it too, and a stale page is
 * ignored. The latest `loadPage` is always called, and the functions keep their identity. On the
 * server it is loading with no items.
 */
export function useInfiniteScroll<T, C>(
  loadPage: (cursor: C | undefined, signal: AbortSignal) => Promise<Page<T, C>>,
  { sentinel, rootMargin = "200px", deps = [] }: InfiniteScrollOptions = {},
): InfiniteScroll<T> {
  const [state, setState] = useState<State<T, C>>({
    items: [],
    cursor: undefined,
    hasMore: true,
    status: "loading",
    error: undefined,
  });
  const latestLoad = useLatest(loadPage);
  const latestState = useLatest(state);
  const inFlight = useRef<AbortController | null>(null);

  const [load] = useState(() => (first: boolean) => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    const cursor = first ? undefined : latestState.current.cursor;
    setState((previous) => ({
      ...previous,
      items: first ? [] : previous.items,
      status: first ? "loading" : "loadingMore",
    }));
    // Inside a promise, so a loadPage that throws instead of rejecting is handled the same.
    new Promise<Page<T, C>>((resolve) => {
      resolve(latestLoad.current(cursor, controller.signal));
    }).then(
      (page) => {
        if (inFlight.current !== controller) return;
        inFlight.current = null;
        setState((previous) => ({
          items: [...previous.items, ...page.items],
          cursor: page.next,
          hasMore: page.next !== undefined,
          status: "idle",
          error: undefined,
        }));
      },
      (thrown: unknown) => {
        if (inFlight.current !== controller) return;
        inFlight.current = null;
        const error = thrown instanceof Error ? thrown : new Error(String(thrown));
        // The cursor stays at the page that failed, so loadMore tries it again.
        setState((previous) => ({ ...previous, status: "error", error }));
      },
    );
  });

  useEffect(() => {
    load(true);
    return () => {
      inFlight.current?.abort();
      inFlight.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloads when the caller's deps change.
  }, deps);

  const [loadMore] = useState(() => () => {
    if (inFlight.current || !latestState.current.hasMore) return;
    load(false);
  });

  // While idle, watch the sentinel and load the next page when it is in view. A new observer
  // after each load reports where the sentinel is now, after the new items' layout: a short page
  // that leaves it in view loads the next one, and a stale "in view" from before can't.
  const idle = state.status === "idle" && state.hasMore;
  useEffect(() => {
    const element = sentinel?.current;
    if (!idle || !element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [idle, loadMore, rootMargin, sentinel]);

  const [reload] = useState(() => () => {
    load(true);
  });

  const { items, status, error, hasMore } = state;
  return { items, status, error, hasMore, loadMore, reload };
}
