import { useState } from "react";

/** The functions `useToggle` returns alongside the value. */
export interface ToggleActions {
  /** Flips the value. */
  toggle: () => void;
  /** Sets the value to `true`. */
  setTrue: () => void;
  /** Sets the value to `false`. */
  setFalse: () => void;
  /** Sets the value. */
  set: (value: boolean) => void;
}

/**
 * A boolean state with named setters. Returns `[value, { toggle, setTrue, setFalse, set }]`.
 * The actions object and its functions never change, so they are safe in effect dependencies
 * and memoised children, and `toggle` can be passed straight to `onClick` (it ignores its
 * arguments).
 */
export function useToggle(initial = false): readonly [boolean, ToggleActions] {
  const [value, setValue] = useState(initial);
  // Created once: `setValue` never changes, so neither do these.
  const [actions] = useState<ToggleActions>(() => ({
    toggle: () => {
      setValue((current) => !current);
    },
    setTrue: () => {
      setValue(true);
    },
    setFalse: () => {
      setValue(false);
    },
    set: (next) => {
      setValue(next);
    },
  }));
  return [value, actions] as const;
}
