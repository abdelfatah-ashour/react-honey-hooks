import { useState } from "react";

/** The functions `useMap` returns alongside the map. */
export interface MapActions<K, V> {
  /** Adds an entry, or replaces the value of an existing key. */
  set: (key: K, value: V) => void;
  /** Replaces every entry with `entries`. */
  setAll: (entries: Iterable<readonly [K, V]>) => void;
  /** Removes the entry for `key`, if there is one. */
  remove: (key: K) => void;
  /** Removes every entry. */
  clear: () => void;
  /** Goes back to the entries from the first render. */
  reset: () => void;
}

/**
 * A `Map` held in state. Returns `[map, { set, setAll, remove, clear, reset }]`. The map is
 * never changed in place: every change gives a new map, so it works with memoisation and effect
 * dependencies, and an action that changes nothing (setting a key to the value it already has,
 * by `Object.is`, or removing a missing key) keeps the same map and doesn't re-render. `reset`
 * goes back to the entries from the first render; later `entries` are ignored. The actions
 * object and its functions never change.
 */
export function useMap<K, V>(
  entries?: Iterable<readonly [K, V]>,
): readonly [ReadonlyMap<K, V>, MapActions<K, V>] {
  // Copied once, so `reset` works even when `entries` is a one-shot iterator.
  const [initial] = useState(() => [...(entries ?? [])]);
  const [map, setMap] = useState<ReadonlyMap<K, V>>(() => new Map(initial));
  const [actions] = useState<MapActions<K, V>>(() => ({
    set: (key, value) => {
      setMap((current) =>
        current.has(key) && Object.is(current.get(key), value)
          ? current
          : new Map(current).set(key, value),
      );
    },
    setAll: (next) => {
      setMap(new Map(next));
    },
    remove: (key) => {
      setMap((current) => {
        if (!current.has(key)) return current;
        const next = new Map(current);
        next.delete(key);
        return next;
      });
    },
    clear: () => {
      setMap((current) => (current.size === 0 ? current : new Map()));
    },
    reset: () => {
      setMap(new Map(initial));
    },
  }));
  return [map, actions] as const;
}
