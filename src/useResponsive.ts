import { useMemo, useSyncExternalStore } from "react";

/** Breakpoint names and the viewport width, in CSS pixels, where each one starts. */
export type Breakpoints = Readonly<Record<string, number>>;

/** Whether the viewport has reached each breakpoint. */
export type Responsive<B extends Breakpoints> = { readonly [K in keyof B]: boolean };

const DEFAULT_BREAKPOINTS = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 } as const;

interface Store<B extends Breakpoints> {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => Responsive<B>;
  getServerSnapshot: () => Responsive<B>;
}

/** The store for one set of breakpoints, given as `[name, min]` pairs. */
function createStore<B extends Breakpoints>(entries: [string, number][]): Store<B> {
  const queries = entries.map(([, min]) => `(min-width: ${String(min)}px)`);
  let last: Responsive<B> | undefined;
  const server = Object.fromEntries(entries.map(([name]) => [name, false])) as Responsive<B>;
  return {
    subscribe(onChange) {
      const lists = queries.map((query) => window.matchMedia(query));
      for (const list of lists) list.addEventListener("change", onChange);
      return () => {
        for (const list of lists) list.removeEventListener("change", onChange);
      };
    },
    getSnapshot() {
      const matches = queries.map((query) => window.matchMedia(query).matches);
      // The same object while nothing changed, so React doesn't re-render.
      if (!last || entries.some(([name], index) => last?.[name] !== matches[index])) {
        last = Object.fromEntries(
          entries.map(([name], index) => [name, matches[index] ?? false]),
        ) as Responsive<B>;
      }
      return last;
    },
    getServerSnapshot: () => server,
  };
}

/**
 * Says which breakpoints the viewport has reached: for each name in `breakpoints`, whether the
 * viewport is at least that many CSS pixels wide, as `min-width` media queries. Defaults to
 * `{ xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 }`. It re-renders when the viewport crosses a
 * breakpoint, and returns the same object until it does. `breakpoints` can be a new object on
 * every render; it is compared by its contents. Every breakpoint is `false` on the server and
 * while hydrating, so there is no hydration mismatch.
 */
export function useResponsive(): Responsive<typeof DEFAULT_BREAKPOINTS>;
export function useResponsive<B extends Breakpoints>(breakpoints: B): Responsive<B>;
export function useResponsive(
  breakpoints: Breakpoints = DEFAULT_BREAKPOINTS,
): Responsive<Breakpoints> {
  const key = JSON.stringify(Object.entries(breakpoints));
  const store = useMemo(
    () => createStore<Breakpoints>(JSON.parse(key) as [string, number][]),
    [key],
  );
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
