import { useEffect, useRef, type RefObject } from "react";

export type ClickOutsideEvent = MouseEvent | TouchEvent;

const EVENTS = ["mousedown", "touchstart"] as const;

/**
 * Calls `handler` when a mouse press or touch starts outside the element held by `ref`.
 * Presses on the element or its descendants are ignored, as is everything while `ref`
 * is unattached. The latest `handler` is always used, so it need not be memoised.
 */
export function useClickOutside(
  ref: RefObject<Element | null>,
  handler: (event: ClickOutsideEvent) => void,
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const listener = (event: ClickOutsideEvent) => {
      const element = ref.current;
      if (!element || !(event.target instanceof Node) || element.contains(event.target)) return;
      handlerRef.current(event);
    };
    for (const type of EVENTS) document.addEventListener(type, listener);
    return () => {
      for (const type of EVENTS) document.removeEventListener(type, listener);
    };
  }, [ref]);
}
