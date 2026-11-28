import { useSyncExternalStore } from "react";

export interface WindowScroll {
  readonly x: number;
  readonly y: number;
}

/** Re-reads at most once per frame, however many scroll events arrive. */
function subscribe(onChange: () => void): () => void {
  let frame: number | undefined;
  const onScroll = () => {
    frame ??= requestAnimationFrame(() => {
      frame = undefined;
      onChange();
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}

/** The last position read, so the snapshot keeps its identity until it changes. */
let last: WindowScroll = { x: 0, y: 0 };

function getSnapshot(): WindowScroll {
  const x = window.scrollX;
  const y = window.scrollY;
  if (last.x !== x || last.y !== y) last = { x, y };
  return last;
}

const SERVER_SCROLL: WindowScroll = { x: 0, y: 0 };

/**
 * Returns the page's scroll position, `{ x, y }` in CSS pixels, and re-renders as it scrolls, at
 * most once per animation frame however many scroll events arrive. During server rendering and
 * on the first render while hydrating it is `{ x: 0, y: 0 }`, so hydration matches. It returns the
 * same object while the position is unchanged.
 */
export function useWindowScroll(): WindowScroll {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SCROLL);
}
