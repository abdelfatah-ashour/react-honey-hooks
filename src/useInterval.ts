import { useEffect, useRef } from "react";

/**
 * Calls `callback` every `delayMs` milliseconds. Pass `null` to pause; any delay that is not a
 * positive, finite number also pauses, because a 0 ms interval would run as fast as the
 * browser allows. Changing `delayMs` restarts the interval. The latest `callback` is always
 * called without restarting it, so it does not need to be memoised.
 */
export function useInterval(callback: () => void, delayMs: number | null): void {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });

  useEffect(() => {
    if (delayMs === null || !(delayMs > 0 && Number.isFinite(delayMs))) return;
    const id = setInterval(() => {
      latest.current();
    }, delayMs);
    return () => {
      clearInterval(id);
    };
  }, [delayMs]);
}
