import { useSyncExternalStore, type RefObject } from "react";

/**
 * Where focus is going while it moves between two elements. Browsers fire `focusout` first,
 * with focus briefly on `<body>`, and React may re-render before `focusin` lands it, so the
 * element named by `focusout`'s `relatedTarget` counts as focused until then.
 */
let incoming: Element | null = null;

function onFocusOut(event: FocusEvent): void {
  incoming = event.relatedTarget instanceof Element ? event.relatedTarget : null;
}

function onFocusIn(): void {
  incoming = null;
}

function subscribe(onChange: () => void): () => void {
  // Capture, so `incoming` is up to date before any subscriber's `onChange` reads it.
  window.addEventListener("focusout", onFocusOut, true);
  window.addEventListener("focusin", onFocusIn, true);
  window.addEventListener("focusin", onChange);
  window.addEventListener("focusout", onChange);
  return () => {
    window.removeEventListener("focusout", onFocusOut, true);
    window.removeEventListener("focusin", onFocusIn, true);
    window.removeEventListener("focusin", onChange);
    window.removeEventListener("focusout", onChange);
  };
}

/** The element that has focus, or is about to get it while focus moves between elements. */
function focusedElement(): Element | null {
  return incoming ?? document.activeElement;
}

/**
 * Returns whether focus is on the element held by `ref` or anywhere inside it, like CSS
 * `:focus-within`, and re-renders when focus moves in or out. It is right from the first render
 * when focus starts inside, follows the ref to a new element, stays `true` while focus moves
 * between elements inside it, and is `false` during server rendering.
 */
export function useFocusWithin(ref: RefObject<Element | null>): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ref.current?.contains(focusedElement()) ?? false,
    () => false,
  );
}
