import { useState } from "react";
import { useLatest } from "./useLatest";

/**
 * Returns a function that keeps its identity for the component's whole life and always calls
 * the latest `fn`, with the same arguments and `this`, returning its result. Use it to pass
 * callbacks to memoised children or effect dependencies without re-running them when `fn`
 * changes. It is updated once a render commits, before any effects run, so call it from
 * effects and event handlers rather than while rendering.
 */
export function useStableCallback<T, A extends unknown[], R>(
  fn: (this: T, ...args: A) => R,
): (this: T, ...args: A) => R {
  const latest = useLatest(fn);
  const [stable] = useState(
    () =>
      function (this: T, ...args: A): R {
        return latest.current.apply(this, args);
      },
  );
  return stable;
}
