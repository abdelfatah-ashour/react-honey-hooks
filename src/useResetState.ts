import { type Dispatch, type SetStateAction, useState } from "react";

/**
 * `useState` with a third item, `reset`, which goes back to the initial value. Returns `[state,
 * setState, reset]`. `initial` can be a function, called once; `reset` reuses its result rather
 * than calling it again. `reset` always goes back to the first render's value: later values of
 * `initial` are ignored, as with `useState`. `setState` and `reset` never change.
 */
export function useResetState<T>(
  initial: T | (() => T),
): readonly [T, Dispatch<SetStateAction<T>>, () => void] {
  const [state, setState] = useState(initial);
  // The first render's state is the initial value, already computed if `initial` was a function.
  const [reset] = useState(() => {
    const first = state;
    return () => {
      // Wrapped so a function value is stored as is rather than called as an updater.
      setState(() => first);
    };
  });
  return [state, setState, reset] as const;
}
