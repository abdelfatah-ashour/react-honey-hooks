import { createStorageStore, useStoredValue, type SetStoredValue } from "./storage";

const store = createStorageStore(() => sessionStorage);

/**
 * Keeps a JSON-serialisable value in `sessionStorage` under `key`: like `useLocalStorage`, but
 * the value lasts only for this tab, surviving reloads until the tab is closed. Returns
 * `[value, set, remove]`. `value` is `initialValue` while nothing (or invalid JSON) is stored,
 * during server rendering and on the first render while hydrating. Every hook using the same
 * key in this tab stays in sync. If storage refuses a write, the new value is kept in memory for
 * this page instead of throwing. `set` and `remove` keep their identity while `key` is unchanged.
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
): readonly [T, SetStoredValue<T>, () => void] {
  return useStoredValue(store, key, initialValue);
}
