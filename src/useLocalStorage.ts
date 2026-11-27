import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

/** Stores `value`, or the result of calling it with the current value. */
export type SetStoredValue<T> = (value: T | ((previous: T) => T)) => void;

const listeners = new Set<() => void>();

/**
 * Writes that storage refused (it is full, or blocked as in some private modes), keyed by
 * storage key, so the value still updates for this page. `null` means removed.
 */
const unsaved = new Map<string, string | null>();

/**
 * Writes in this page notify `listeners` directly; writes in other tabs arrive as `storage`
 * events. Either way React re-reads the key and only re-renders if its text changed.
 */
function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readRaw(key: string): string | null {
  if (unsaved.has(key)) return unsaved.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, raw: string | null): void {
  try {
    if (raw === null) localStorage.removeItem(key);
    else localStorage.setItem(key, raw);
    unsaved.delete(key);
  } catch {
    unsaved.set(key, raw);
  }
  for (const listener of listeners) listener();
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
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), getServerRaw);
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
        next instanceof Function ? next(orFallback(parse(readRaw(key)), initialRef.current)) : next;
      writeRaw(key, JSON.stringify(resolved));
    },
    [key],
  );

  const remove = useCallback(() => {
    writeRaw(key, null);
  }, [key]);

  return [value, set, remove];
}
