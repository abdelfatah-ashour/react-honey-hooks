import { useEffect, useRef, type RefObject } from "react";

interface Observed {
  element: Element;
  key: string;
  observer: MutationObserver;
}

const DEFAULT_OPTIONS: MutationObserverInit = { childList: true, subtree: true };

/**
 * Calls `callback` with the DOM changes to the element held by `ref`, using a
 * `MutationObserver`. By default it reports children added or removed anywhere inside; pass
 * `options` to watch attributes or text instead. The latest `callback` is always called, so it
 * doesn't need to be memoised; options are compared by value. The observer follows the ref to a
 * new element after a render and disconnects on unmount. Options that watch nothing throw the
 * browser's `TypeError`.
 */
export function useMutationObserver(
  ref: RefObject<Element | null>,
  callback: MutationCallback,
  options: MutationObserverInit = DEFAULT_OPTIONS,
): void {
  const latest = useRef(callback);
  const observed = useRef<Observed | null>(null);

  useEffect(() => {
    latest.current = callback;
  });

  // Runs after every render because a ref's element can change without anything else changing.
  // Options are compared by value, so a new object with the same options doesn't re-observe.
  useEffect(() => {
    const element = ref.current;
    const key = JSON.stringify(options);
    const current = observed.current;
    if (current?.element === element && current.key === key) return;
    disconnect(observed);
    if (!element) return;
    const observer = new MutationObserver((mutations, self) => {
      latest.current(mutations, self);
    });
    observer.observe(element, options);
    observed.current = { element, key, observer };
  });

  useEffect(
    () => () => {
      disconnect(observed);
    },
    [],
  );
}

function disconnect(observed: RefObject<Observed | null>): void {
  observed.current?.observer.disconnect();
  observed.current = null;
}
