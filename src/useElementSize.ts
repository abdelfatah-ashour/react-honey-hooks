import { useEffect, useRef, useState, type RefObject } from "react";

export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

export interface ElementSizeOptions {
  /** Which box to measure: `"content-box"` (the default) or `"border-box"`. */
  box?: "content-box" | "border-box";
}

function measure(entry: ResizeObserverEntry, box: ElementSizeOptions["box"]): ElementSize {
  if (box === "border-box") {
    const border = entry.borderBoxSize[0];
    if (border) {
      // borderBoxSize is in logical sizes; the inline direction is vertical in vertical text.
      const vertical = /^(vertical|sideways)/.test(getComputedStyle(entry.target).writingMode);
      return vertical
        ? { width: border.blockSize, height: border.inlineSize }
        : { width: border.inlineSize, height: border.blockSize };
    }
  }
  return { width: entry.contentRect.width, height: entry.contentRect.height };
}

interface Observed {
  element: Element;
  box: NonNullable<ElementSizeOptions["box"]>;
  observer: ResizeObserver;
}

/**
 * Returns the `{ width, height }` of the element held by `ref`, in CSS pixels, and re-renders
 * when it changes, using a `ResizeObserver`. Measures the content box by default, or the border
 * box (including padding and border) with `box: "border-box"`. It is `0 × 0` during server
 * rendering, before the first measurement and in browsers without `ResizeObserver`, keeps the
 * last size while the ref holds no element, and returns the same object while the size is
 * unchanged. The observer follows the ref to a new element after a render, and is
 * disconnected when the component unmounts.
 */
export function useElementSize(
  ref: RefObject<Element | null>,
  { box = "content-box" }: ElementSizeOptions = {},
): ElementSize {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
  const observed = useRef<Observed | null>(null);

  // Runs after every render because a ref's element can change without anything else changing.
  useEffect(() => {
    const element = ref.current;
    const current = observed.current;
    if (current?.element === element && current.box === box) return;
    disconnect(observed);
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      const { width, height } = measure(entry, box);
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      );
    });
    observer.observe(element, { box });
    observed.current = { element, box, observer };
  });

  useEffect(
    () => () => {
      disconnect(observed);
    },
    [],
  );

  return size;
}

function disconnect(observed: RefObject<Observed | null>): void {
  observed.current?.observer.disconnect();
  observed.current = null;
}
