import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

/** Stores `value`, or the result of calling it with the current value. */
export type SetStoredValue<T> = (value: T | ((previous: T) => T)) => void;

/** Reads and writes one Web Storage area and tells subscribers when a key may have changed. */
export interface StorageStore {
  readonly subscribe: (onChange: () => void) => () => void;
  readonly read: (key: string) => string | null;
  readonly write: (key: string, raw: string | null) => void;
}

/**
 * Creates the store for one storage area. `getStorage` is called on every access, because
 * merely reading `window.localStorage` throws where storage is blocked.
 */
export function createStorageStore(getStorage: () => Storage): StorageStore {
  const listeners = new Set<() => void>();

  /**
   * Writes that storage refused (it is full, or blocked as in some private modes), keyed by
   * storage key, so the value still updates for this page. `null` means removed.
   */
  const unsaved = new Map<string, string | null>();

  return {
    // Writes in this page notify `listeners` directly; writes in other documents arrive as
    // `storage` events. Either way React re-reads the key and only re-renders if its text changed.
    subscribe(onChange) {
      listeners.add(onChange);
      window.addEventListener("storage", onChange);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    read(key) {
      if (unsaved.has(key)) return unsaved.get(key) ?? null;
      try {
        return getStorage().getItem(key);
      } catch {
        return null;
      }
    },
    write(key, raw) {
      try {
        if (raw === null) getStorage().removeItem(key);
        else getStorage().setItem(key, raw);
        unsaved.delete(key);
      } catch {
        unsaved.set(key, raw);
      }
      for (const listener of listeners) listener();
    },
  };
}

/** There is no storage on the server, so it renders `initialValue`. */
function getServerRaw(): null {
  return null;
}

const MISSING = Symbol("missing");

/** The stored value, or `MISSING` when the key is absent or its text is not valid JSON. */
function parse(raw: string | null): unknown {
  if (raw === null) return MISSING;
  try {
    return JSON.parse(raw);
  } catch {
    return MISSING;
  }
}

function orFallback<T>(parsed: unknown, fallback: T): T {
  return parsed === MISSING ? fallback : (parsed as T);
}

/** The shared body of `useLocalStorage` and `useSessionStorage`. */
export function useStoredValue<T>(
  store: StorageStore,
  key: string,
  initialValue: T,
): readonly [T, SetStoredValue<T>, () => void] {
  const raw = useSyncExternalStore(store.subscribe, () => store.read(key), getServerRaw);
  // Parse once per stored text, so the value keeps its identity across renders.
  const parsed = useMemo(() => parse(raw), [raw]);
  const value = orFallback(parsed, initialValue);

  const initialRef = useRef(initialValue);
  useEffect(() => {
    initialRef.current = initialValue;
  });

  const set = useCallback<SetStoredValue<T>>(
    (next) => {
      const resolved =
        next instanceof Function
          ? next(orFallback(parse(store.read(key)), initialRef.current))
          : next;
      store.write(key, JSON.stringify(resolved));
    },
    [store, key],
  );

  const remove = useCallback(() => {
    store.write(key, null);
  }, [store, key]);

  return [value, set, remove];
}
