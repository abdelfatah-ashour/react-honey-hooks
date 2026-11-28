import { useEffect } from "react";
import { useLatest } from "./useLatest";

/**
 * `useInterval` timed with animation frames: calls `callback` on the first frame each time `ms`
 * has passed since the last call (or since it started). Browsers pause frames while the tab is
 * hidden, so it stops in the background, and when the tab is shown again it calls once rather
 * than catching up on every missed call; this suits animation and other visual work. Pass
 * `null` to pause; 0, a negative, `NaN` or an infinite `ms` also pauses. Resuming or changing
 * `ms` counts from zero again. The latest `callback` is always called without restarting, so it
 * need not be memoised. Nothing runs on the server.
 */
export function useRafInterval(callback: () => void, ms: number | null): void {
  const latest = useLatest(callback);
  useEffect(() => {
    if (ms === null || !(ms > 0 && Number.isFinite(ms))) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      if (now - last >= ms) {
        last = now;
        latest.current();
      }
      frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [latest, ms]);
}
