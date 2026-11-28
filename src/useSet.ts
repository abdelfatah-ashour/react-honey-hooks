import { useState } from "react";

/** The functions `useSet` returns alongside the set. */
export interface SetActions<T> {
  /** Adds `value`, if it isn't in the set. */
  add: (value: T) => void;
  /** Removes `value`, if it is in the set. */
  remove: (value: T) => void;
  /** Removes `value` if it is in the set, and adds it if not. */
  toggle: (value: T) => void;
  /** Removes every value. */
  clear: () => void;
  /** Goes back to the values from the first render. */
  reset: () => void;
}

/**
 * A `Set` held in state. Returns `[set, { add, remove, toggle, clear, reset }]`. The set is
 * never changed in place: every change gives a new set, so it works with memoisation and effect
 * dependencies, and an action that changes nothing (adding a value already there, removing a
 * missing one) keeps the same set and doesn't re-render. `reset` goes back to the values from
 * the first render; later `values` are ignored. The actions object and its functions never
 * change.
 */
export function useSet<T>(values?: Iterable<T>): readonly [ReadonlySet<T>, SetActions<T>] {
  // Copied once, so `reset` works even when `values` is a one-shot iterator.
  const [initial] = useState(() => [...(values ?? [])]);
  const [set, setSet] = useState<ReadonlySet<T>>(() => new Set(initial));
  const [actions] = useState<SetActions<T>>(() => ({
    add: (value) => {
      setSet((current) => (current.has(value) ? current : new Set(current).add(value)));
    },
    remove: (value) => {
      setSet((current) => {
        if (!current.has(value)) return current;
        const next = new Set(current);
        next.delete(value);
        return next;
      });
    },
    toggle: (value) => {
      setSet((current) => {
        const next = new Set(current);
        if (!next.delete(value)) next.add(value);
        return next;
      });
    },
    clear: () => {
      setSet((current) => (current.size === 0 ? current : new Set()));
    },
    reset: () => {
      setSet(new Set(initial));
    },
  }));
  return [set, actions] as const;
}
