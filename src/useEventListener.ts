import { useEffect, useRef, type RefObject } from "react";

export interface EventListenerHookOptions {
  /** Set to `false` to stop listening. Defaults to `true`. */
  enabled?: boolean;
  /** Listen in the capture phase. Defaults to `false`. */
  capture?: boolean;
  /** Promise not to call `preventDefault()`, which lets scrolling start sooner. */
  passive?: boolean;
  /** Remove the listener after its first call. Defaults to `false`. */
  once?: boolean;
}

/** Where to listen: `window` (the default), `document`, or the element held by a ref. */
export type EventListenerTarget = Window | Document | RefObject<HTMLElement | null>;

interface Attached {
  node: EventTarget;
  type: string;
  capture: boolean;
  passive: boolean | undefined;
  once: boolean;
  listener: (event: Event) => void;
}

function resolve(target: EventListenerTarget | undefined): EventTarget | null {
  if (target === undefined) return window;
  return target instanceof EventTarget ? target : target.current;
}

/**
 * Listens for `type` events on `window`, or on `options.target`: `document` or an element ref.
 * The event type is checked against the target, and the handler receives the matching event
 * type. The latest `handler` is always called without re-subscribing, so it does not need to
 * be memoised. The listener is re-attached after a render that changes the target element,
 * `type` or options, and removed when the component unmounts.
 */
export function useEventListener<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: EventListenerHookOptions & { target?: Window },
): void;
export function useEventListener<K extends keyof DocumentEventMap>(
  type: K,
  handler: (event: DocumentEventMap[K]) => void,
  options: EventListenerHookOptions & { target: Document },
): void;
export function useEventListener<K extends keyof HTMLElementEventMap>(
  type: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options: EventListenerHookOptions & { target: RefObject<HTMLElement | null> },
): void;
export function useEventListener(
  type: string,
  handler: (event: Event) => void,
  options: EventListenerHookOptions & { target?: EventListenerTarget } = {},
): void {
  const { target, enabled = true, capture = false, passive, once = false } = options;
  const latest = useRef(handler);
  const attached = useRef<Attached | null>(null);

  useEffect(() => {
    latest.current = handler;
  });

  // Runs after every render because a ref's element can change without anything else changing.
  useEffect(() => {
    const node = enabled ? resolve(target) : null;
    const current = attached.current;
    if (
      current?.node === node &&
      current.type === type &&
      current.capture === capture &&
      current.passive === passive &&
      current.once === once
    ) {
      return;
    }
    detach(attached);
    if (!node) return;
    const listener = (event: Event) => {
      latest.current(event);
    };
    // Leave `passive` out when unset so the browser keeps its default for the event type.
    node.addEventListener(type, listener, {
      capture,
      once,
      ...(passive === undefined ? {} : { passive }),
    });
    attached.current = { node, type, capture, passive, once, listener };
  });

  useEffect(
    () => () => {
      detach(attached);
    },
    [],
  );
}

function detach(attached: RefObject<Attached | null>): void {
  const current = attached.current;
  if (!current) return;
  current.node.removeEventListener(current.type, current.listener, { capture: current.capture });
  attached.current = null;
}
