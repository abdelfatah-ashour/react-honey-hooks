import { useEffect, useState } from "react";

/**
 * Returns `value`, but only updates once `value` has stopped changing for `delayMs`. The first
 * render returns `value` straight away. Changing `delayMs` restarts the wait with the new delay.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(() => value);
    }, delayMs);
    return () => {
      clearTimeout(id);
    };
  }, [value, delayMs]);

  return debounced;
}
