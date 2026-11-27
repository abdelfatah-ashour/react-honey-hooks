import { useState, type RefObject } from "react";
import { useEventListener } from "./useEventListener";

/**
 * Returns whether a mouse or pen pointer is over the element held by `ref` or any of its
 * children. Touch is ignored, as touch screens have no hover. It is `false` during server
 * rendering, and when the pointer leaves the window. It checks the ref's current element on
 * every pointer movement, so it follows the ref to a new element; listeners are removed on
 * unmount.
 */
export function useHover(ref: RefObject<Element | null>): boolean {
  const [hovered, setHovered] = useState(false);

  // On window, which these events bubble up to, so nothing touches `document` while rendering.
  // Checking the ref's element on every move also follows the ref to a new element.
  useEventListener("pointerover", (event) => {
    // A tap fires pointerover too, and nothing would end the hover; touch has no hover.
    if (event.pointerType === "touch") return;
    const element = ref.current;
    setHovered(element !== null && event.target instanceof Node && element.contains(event.target));
  });

  useEventListener("pointerout", (event) => {
    // No relatedTarget: the pointer left the window.
    if (event.relatedTarget === null) setHovered(false);
  });

  return hovered;
}
