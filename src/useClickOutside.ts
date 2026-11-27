import { useEffect, useRef, type RefObject } from "react";

export type ClickOutsideEvent = MouseEvent | TouchEvent;

/** One element ref, or several that together count as "inside". */
export type ClickOutsideRefs = RefObject<Element | null> | readonly RefObject<Element | null>[];

export interface ClickOutsideOptions {
  /** Set to `false` to stop listening, for example while a menu is closed. Defaults to `true`. */
  enabled?: boolean;
}

const EVENTS = ["mousedown", "touchstart"] as const;

function isOutside(refs: ClickOutsideRefs, target: Node): boolean {
  const list = "current" in refs ? [refs] : refs;
  let attached = false;
  for (const { current } of list) {
    if (!current) continue;
    if (current.contains(target)) return false;
    attached = true;
  }
  return attached;
}

/**
 * Calls `handler` when a mouse press or touch starts outside every element held by `refs`.
 * Presses on those elements or their descendants are ignored, as is everything while no
 * ref is attached. The latest `refs` and `handler` are always used, so neither needs to be
 * memoised. Pass `{ enabled: false }` to pause listening.
 */
export function useClickOutside(
  refs: ClickOutsideRefs,
  handler: (event: ClickOutsideEvent) => void,
  { enabled = true }: ClickOutsideOptions = {},
): void {
  const latest = useRef({ refs, handler });

  useEffect(() => {
    latest.current = { refs, handler };
  });

  useEffect(() => {
    if (!enabled) return;
    const listener = (event: ClickOutsideEvent) => {
      const { refs, handler } = latest.current;
      if (event.target instanceof Node && isOutside(refs, event.target)) handler(event);
    };
    for (const type of EVENTS) document.addEventListener(type, listener);
    return () => {
      for (const type of EVENTS) document.removeEventListener(type, listener);
    };
  }, [enabled]);
}
