import { useState } from "react";
import { useLatest } from "./useLatest";

/**
 * Wraps an async function so only one call runs at a time, such as a submit button clicked
 * twice. While a call is running, further calls are ignored: they don't call `fn` and resolve
 * to `undefined`. Once it settles, the lock is released, whether it resolved or failed, and a
 * failure is passed on to its caller. The returned function keeps its identity for the
 * component's lifetime and always calls the latest `fn`.
 */
export function useLockFn<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R | undefined> {
  const latest = useLatest(fn);
  const [locked] = useState(() => {
    let running = false;
    return async (...args: A): Promise<R | undefined> => {
      if (running) return undefined;
      running = true;
      try {
        return await latest.current(...args);
      } finally {
        running = false;
      }
    };
  });
  return locked;
}
