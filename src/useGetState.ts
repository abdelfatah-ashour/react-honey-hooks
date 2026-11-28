import { type Dispatch, type SetStateAction, useRef, useState } from "react";

/**
 * `useState` with a third item, `getState`, which reads the latest value. Returns `[state,
 * setState, getState]`. `getState` sees each update as soon as `setState` is called, before the
 * re-render, so callbacks created on an earlier render (in a timer, an effect with no
 * dependencies or a third-party listener) never read a stale value. Functional updates are
 * applied to that latest value. `initial` can be a function, called once. `setState` and
 * `getState` never change.
 */
export function useGetState<T>(
  initial: T | (() => T),
): readonly [T, Dispatch<SetStateAction<T>>, () => T] {
  const [state, setState] = useState(initial);
  // Only this hook's `setState` changes the state, and it updates `latest` first.
  const latest = useRef(state);
  const [functions] = useState(() => ({
    set: (action: SetStateAction<T>) => {
      const next =
        typeof action === "function" ? (action as (current: T) => T)(latest.current) : action;
      latest.current = next;
      // Wrapped so a function value is stored as is rather than called as an updater.
      setState(() => next);
    },
    get: () => latest.current,
  }));
  return [state, functions.set, functions.get] as const;
}
