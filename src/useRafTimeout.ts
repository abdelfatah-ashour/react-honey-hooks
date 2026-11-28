import { useEffect } from "react";
import { useLatest } from "./useLatest";

/**
 * `useTimeout` timed with animation frames: calls `callback` once, on the first frame at least
 * `ms` after mounting. Frames pause while the tab is hidden, so it waits until the tab is shown
 * rather than firing in the background, which suits visual work. Changing `ms` starts the wait
 * again from now; `null` (or a negative, `NaN` or infinite `ms`) cancels it until a valid one is
 * given, and 0 calls it on the next frame. The latest `callback` is always called, so it need
 * not be memoised. Nothing runs on the server.
 */
export function useRafTimeout(callback: () => void, ms: number | null): void {
  const latest = useLatest(callback);
  useEffect(() => {
    if (ms === null || !(ms >= 0 && Number.isFinite(ms))) return;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      if (now - start >= ms) latest.current();
      else frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [latest, ms]);
}
