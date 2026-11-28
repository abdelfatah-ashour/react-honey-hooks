import { useSyncExternalStore, type RefObject } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("focusin", onChange);
  window.addEventListener("focusout", onChange);
  return () => {
    window.removeEventListener("focusin", onChange);
    window.removeEventListener("focusout", onChange);
  };
}

/**
 * Returns whether focus is on the element held by `ref` or anywhere inside it, like CSS
 * `:focus-within`, and re-renders when focus moves in or out. It is right from the first render
 * when focus starts inside, follows the ref to a new element, and is `false` during server
 * rendering.
 */
export function useFocusWithin(ref: RefObject<Element | null>): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ref.current?.contains(document.activeElement) ?? false,
    () => false,
  );
}
