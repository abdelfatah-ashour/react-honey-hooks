import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

export interface InViewOptions {
  /** Stay `true` once the element has been in view, and stop observing it. */
  once?: boolean;
  /** The scrolling ancestor to measure against. Defaults to the viewport. */
  root?: Element | Document | null;
  /** Grows or shrinks the root's box, in CSS margin syntax, e.g. `"200px 0px"`. */
  rootMargin?: string;
  /** How much of the element must be visible: 0 (any pixel, the default) to 1 (all of it). */
  threshold?: number | readonly number[];
}

interface Observed {
  element: Element;
  root: Element | Document | null;
  key: string;
  observer: IntersectionObserver;
}

/**
 * Returns whether the element held by `ref` is in view, using an `IntersectionObserver`. It is
 * `false` until the first observation, during server rendering and while the ref holds no
 * element, and `true` in browsers without `IntersectionObserver`. With `once`, it stays `true`
 * after the element first comes into view. The observer
 * is replaced after a render that changes the ref's element or the options (thresholds are
 * compared by value), and disconnected when the component unmounts.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { once = false, root = null, rootMargin = "0px", threshold = 0 }: InViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);
  const supported = useSyncExternalStore(subscribeToNothing, isSupported, isSupportedOnServer);
  const observed = useRef<Observed | null>(null);
  const seen = useRef(false);

  // Runs after every render because a ref's element can change without anything else changing.
  useEffect(() => {
    const element = once && seen.current ? null : ref.current;
    const thresholds = typeof threshold === "number" ? [threshold] : [...threshold];
    const key = JSON.stringify([rootMargin, thresholds, once]);
    const current = observed.current;
    if (current?.element === element && current.key === key && current.root === root) {
      return;
    }
    disconnect(observed);
    if (!element) return;
    if (!supported) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (once && entry.isIntersecting) {
          seen.current = true;
          disconnect(observed);
        }
      },
      { root, rootMargin, threshold: thresholds },
    );
    observer.observe(element);
    observed.current = { element, root, key, observer };
  });

  useEffect(
    () => () => {
      disconnect(observed);
    },
    [],
  );

  // Without the API we can't tell, so show the content rather than hide it forever.
  return supported ? inView : true;
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

function isSupported(): boolean {
  return typeof IntersectionObserver !== "undefined";
}

/** Assume support on the server, so it renders `false` like a supporting browser's first render. */
function isSupportedOnServer(): boolean {
  return true;
}

function disconnect(observed: RefObject<Observed | null>): void {
  observed.current?.observer.disconnect();
  observed.current = null;
}
