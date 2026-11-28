import { type RefObject, useEffect, useRef, useState } from "react";

export interface ScrollPosition {
  /** How far the element is scrolled from the left, in CSS pixels. */
  readonly x: number;
  /** How far the element is scrolled from the top, in CSS pixels. */
  readonly y: number;
}

interface Listening {
  element: Element;
  stop: () => void;
}

/**
 * Returns how far the element held by `ref` is scrolled, `{ x, y }` in CSS pixels, and
 * re-renders as it scrolls, at most once per animation frame. For the page itself, use
 * `useWindowScroll`. It is `{ x: 0, y: 0 }` on the server and until there is an element, keeps
 * the last position while the ref holds no element, and returns the same object while the
 * position is unchanged. It follows the ref to a new element after a render, and stops listening
 * when the component unmounts.
 */
export function useScroll(ref: RefObject<Element | null>): ScrollPosition {
  const [position, setPosition] = useState<ScrollPosition>({ x: 0, y: 0 });
  const listening = useRef<Listening | null>(null);

  // Runs after every render because a ref's element can change without anything else changing.
  useEffect(() => {
    const element = ref.current;
    if (listening.current?.element === element) return;
    listening.current?.stop();
    listening.current = null;
    if (!element) return;

    const read = () => {
      const x = element.scrollLeft;
      const y = element.scrollTop;
      setPosition((previous) => (previous.x === x && previous.y === y ? previous : { x, y }));
    };
    let frame: number | undefined;
    const onScroll = () => {
      frame ??= requestAnimationFrame(() => {
        frame = undefined;
        read();
      });
    };
    read();
    element.addEventListener("scroll", onScroll, { passive: true });
    listening.current = {
      element,
      stop: () => {
        element.removeEventListener("scroll", onScroll);
        if (frame !== undefined) cancelAnimationFrame(frame);
      },
    };
  });

  useEffect(
    () => () => {
      listening.current?.stop();
      listening.current = null;
    },
    [],
  );

  return position;
}
