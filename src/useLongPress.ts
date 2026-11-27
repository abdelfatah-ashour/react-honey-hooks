import { useEffect, useRef, type RefObject } from "react";
import { useEventListener } from "./useEventListener";

export interface LongPressOptions {
  /** How long the pointer must be held down, in milliseconds. Defaults to 500. */
  delayMs?: number;
  /** Set to `false` to stop listening; a press in progress is cancelled. Defaults to `true`. */
  enabled?: boolean;
}

/** How far the pointer may move, in CSS pixels, before the press counts as a drag. */
const MOVE_TOLERANCE = 10;

/**
 * Stops the next click anywhere, so releasing a long press doesn't also click. It listens on
 * `window` in the capture phase, ahead of every other listener, and gives up at the next
 * pointerdown or keydown in case the press ended without a click. Returns a remover.
 */
function suppressNextClick(): () => void {
  const stop = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
    remove();
  };
  const remove = () => {
    window.removeEventListener("click", stop, true);
    window.removeEventListener("pointerdown", remove, true);
    window.removeEventListener("keydown", remove, true);
  };
  window.addEventListener("click", stop, true);
  window.addEventListener("pointerdown", remove, true);
  window.addEventListener("keydown", remove, true);
  return remove;
}

interface Press {
  pointerId: number;
  timer: ReturnType<typeof setTimeout>;
  x: number;
  y: number;
}

/**
 * Calls `handler` with the `pointerdown` event when the element held by `ref` is pressed and
 * held for `delayMs` (500 by default) with the main mouse button, a pen or one finger.
 * Releasing, leaving the element, a cancelled pointer or moving more than 10 px first cancels
 * the press. The click that follows a long press is cancelled, so the element can have both a
 * click and a long-press action. Keyboard presses are not long presses. A delay that isn't a
 * finite number of 0 or more never fires. The latest `handler` is always called, so it does not
 * need to be memoised; listeners follow the ref to a new element and are removed on unmount.
 */
export function useLongPress(
  ref: RefObject<HTMLElement | null>,
  handler: (event: PointerEvent) => void,
  { delayMs = 500, enabled = true }: LongPressOptions = {},
): void {
  const press = useRef<Press | null>(null);
  const stopSuppressing = useRef<(() => void) | null>(null);
  const latest = useRef(handler);

  useEffect(() => {
    latest.current = handler;
  });

  const cancel = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };
  /** Ends the press, unless the event comes from another pointer, such as a second finger. */
  const end = (event: PointerEvent) => {
    if (event.pointerId === press.current?.pointerId) cancel();
  };

  useEventListener(
    "pointerdown",
    (event) => {
      // Only the main button, or the first finger of a touch.
      if (event.button !== 0 || !event.isPrimary) return;
      if (!(delayMs >= 0 && Number.isFinite(delayMs))) return;
      cancel();
      press.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        timer: setTimeout(() => {
          press.current = null;
          stopSuppressing.current?.();
          stopSuppressing.current = suppressNextClick();
          latest.current(event);
        }, delayMs),
      };
    },
    { target: ref, enabled },
  );

  useEventListener(
    "pointermove",
    (event) => {
      const current = press.current;
      if (event.pointerId !== current?.pointerId) return;
      const distance = Math.hypot(event.clientX - current.x, event.clientY - current.y);
      if (distance > MOVE_TOLERANCE) cancel();
    },
    { target: ref, enabled },
  );

  useEventListener("pointerup", end, { target: ref, enabled });
  useEventListener("pointerleave", end, { target: ref, enabled });
  useEventListener("pointercancel", end, { target: ref, enabled });

  useEffect(() => {
    if (!enabled) cancel();
  }, [enabled]);

  useEffect(
    () => () => {
      cancel();
      stopSuppressing.current?.();
    },
    [],
  );
}
