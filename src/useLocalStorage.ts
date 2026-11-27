import { createStorageStore, useStoredValue, type SetStoredValue } from "./storage";

export type { SetStoredValue } from "./storage";

// Marked pure so bundlers drop it from apps that never import this hook.
const store = /* @__PURE__ */ createStorageStore(() => localStorage);

/**
 * Keeps a JSON-serialisable value in `localStorage` under `key`, like `useState` that survives
 * reloads. Returns `[value, set, remove]`. `value` is `initialValue` while nothing (or invalid
 * JSON) is stored, during server rendering and on the first render while hydrating. Every hook
 * using the same key stays in sync, in this page and across tabs. If storage refuses a write,
 * the new value is kept in memory for this page instead of throwing. `set` and `remove` keep
 * their identity while `key` is unchanged.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): readonly [T, SetStoredValue<T>, () => void] {
  return useStoredValue(store, key, initialValue);
}
