import { useEffect } from "react";
import { useLatest } from "./useLatest";

/**
 * Calls the latest `fn` when the component unmounts, and at no other time. `fn` need not be
 * memoised, and it can be async; what it returns is ignored. Like any effect cleanup, it doesn't
 * run on the server, and React's development Strict Mode also runs it after its extra mount.
 */
export function useUnmount(fn: () => unknown): void {
  const latest = useLatest(fn);
  useEffect(
    () => () => {
      latest.current();
    },
    [latest],
  );
}
