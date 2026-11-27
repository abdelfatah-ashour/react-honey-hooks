import { useEffect, useState } from "react";

const ACTIVITY = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"];

/**
 * Returns `true` once `ms` milliseconds pass with no pointer, keyboard, wheel, touch or scroll
 * activity anywhere on the page, and `false` again on the next activity or when the tab becomes
 * visible again. It starts `false`, is `false` during server rendering, and a new `ms` restarts
 * the wait. A delay that isn't a positive, finite number never goes idle.
 */
export function useIdle(ms: number): boolean {
  const [idle, setIdle] = useState(false);
  const [previousMs, setPreviousMs] = useState(ms);
  // A new `ms` restarts the wait, so it is not idle yet. Object.is, so NaN equals itself.
  if (!Object.is(ms, previousMs)) {
    setPreviousMs(ms);
    setIdle(false);
  }

  useEffect(() => {
    if (!(ms > 0 && Number.isFinite(ms))) return;
    let last = Date.now();
    let isIdle = false;
    let timer: ReturnType<typeof setTimeout>;

    // Activity only records the time, so frequent events like pointermove stay cheap; the timer
    // waits out whatever is left of `ms` since the last activity.
    const check = () => {
      const remaining = last + ms - Date.now();
      if (remaining > 0) {
        timer = setTimeout(check, remaining);
        return;
      }
      isIdle = true;
      setIdle(true);
    };
    const onActivity = () => {
      last = Date.now();
      if (!isIdle) return;
      isIdle = false;
      setIdle(false);
      timer = setTimeout(check, ms);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") onActivity();
    };

    timer = setTimeout(check, ms);
    document.addEventListener("visibilitychange", onVisibilityChange);
    // Capture, so scrolling any element counts although `scroll` doesn't bubble.
    const options = { capture: true, passive: true };
    for (const type of ACTIVITY) window.addEventListener(type, onActivity, options);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      for (const type of ACTIVITY) window.removeEventListener(type, onActivity, options);
    };
  }, [ms]);

  return idle;
}
