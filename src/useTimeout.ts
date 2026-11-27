import { useEffect, useRef } from "react";

/**
 * Calls `callback` once, `delayMs` milliseconds after mounting. Changing `delayMs` starts the
 * wait again from now; `null` (or a negative or non-finite delay) cancels it until a valid delay
 * is given. A delay of 0 calls it after the current task. The latest `callback` is always
 * called, so it does not need to be memoised.
 */
export function useTimeout(callback: () => void, delayMs: number | null): void {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });

  useEffect(() => {
    if (delayMs === null || !(delayMs >= 0 && Number.isFinite(delayMs))) return;
    const id = setTimeout(() => {
      latest.current();
    }, delayMs);
    return () => {
      clearTimeout(id);
    };
  }, [delayMs]);
}
