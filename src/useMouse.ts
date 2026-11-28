import { type RefObject, useEffect, useState } from "react";

/** Where the pointer is within an element, and the element's size, in CSS pixels. */
export interface MouseElementPosition {
  /** From the element's left edge; negative or beyond `width` when outside it. */
  readonly x: number;
  /** From the element's top edge; negative or beyond `height` when outside it. */
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Where the mouse is, in CSS pixels. */
export interface MouseState {
  /** From the viewport's left edge. */
  readonly clientX: number;
  /** From the viewport's top edge. */
  readonly clientY: number;
  /** From the page's left edge, including scrolling. */
  readonly pageX: number;
  /** From the page's top edge, including scrolling. */
  readonly pageY: number;
  readonly screenX: number;
  readonly screenY: number;
  /** Relative to the element held by the `ref` given, or `null` with no element. */
  readonly element: MouseElementPosition | null;
}

/**
 * Tracks the mouse: returns where it is in the viewport, the page and the screen, and re-renders
 * as it moves, at most once per animation frame. Given a `ref`, it also returns the position
 * within that element and the element's size, measured on each update. It is `null` on the
 * server and until the mouse first moves over the page, and stops listening on unmount.
 */
export function useMouse(ref?: RefObject<Element | null>): MouseState | null {
  const [state, setState] = useState<MouseState | null>(null);
  useEffect(() => {
    let last: MouseEvent | undefined;
    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      if (!last) return;
      const { clientX, clientY, screenX, screenY } = last;
      const target = ref?.current;
      const rect = target?.getBoundingClientRect();
      setState({
        clientX,
        clientY,
        pageX: clientX + window.scrollX,
        pageY: clientY + window.scrollY,
        screenX,
        screenY,
        element: rect
          ? {
              x: clientX - rect.left,
              y: clientY - rect.top,
              width: rect.width,
              height: rect.height,
            }
          : null,
      });
    };
    const onMove = (event: MouseEvent) => {
      last = event;
      frame ??= requestAnimationFrame(update);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [ref]);
  return state;
}
