import { useState } from "react";

/**
 * Returns the value `value` had before it last changed, or `undefined` until it first changes.
 * Re-renders that pass the same value (compared with `Object.is`) don't move it on.
 */
export function usePrevious<T>(value: T): T | undefined {
  const [state, setState] = useState<{ current: T; previous: T | undefined }>({
    current: value,
    previous: undefined,
  });
  if (!Object.is(state.current, value)) {
    // Storing state during render is React's documented way to track a previous value.
    setState({ current: value, previous: state.current });
  }
  return state.previous;
}
