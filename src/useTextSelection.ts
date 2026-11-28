import { type RefObject, useEffect, useState } from "react";

/** The selected text and where it is. */
export interface TextSelection {
  /** The selected text; empty when nothing (or nothing in the element) is selected. */
  readonly text: string;
  /** The selection's bounding box in the viewport, or `null` with no selection. */
  readonly rect: DOMRect | null;
}

const NONE: TextSelection = { text: "", rect: null };

/** `range` cut down to the part inside `element`, or `null` if none of it is. */
function clip(range: Range, element: Element): Range | null {
  const inside = document.createRange();
  inside.selectNodeContents(element);
  if (
    range.compareBoundaryPoints(Range.END_TO_START, inside) >= 0 ||
    range.compareBoundaryPoints(Range.START_TO_END, inside) <= 0
  ) {
    return null;
  }
  if (range.compareBoundaryPoints(Range.START_TO_START, inside) > 0) {
    inside.setStart(range.startContainer, range.startOffset);
  }
  if (range.compareBoundaryPoints(Range.END_TO_END, inside) < 0) {
    inside.setEnd(range.endContainer, range.endOffset);
  }
  return inside;
}

/** The current selection, or only its part inside `element` when one is given. */
function readSelection(element: Element | null | undefined): TextSelection {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return NONE;
  let range: Range | null = selection.getRangeAt(0);
  if (element !== undefined) range = element ? clip(range, element) : null;
  const text = element === undefined ? selection.toString() : (range?.toString() ?? "");
  if (!range || text === "") return NONE;
  // Not every environment lays out text (jsdom doesn't), so a range may have no box.
  const rect =
    typeof range.getBoundingClientRect === "function" ? range.getBoundingClientRect() : null;
  return { text, rect };
}

/**
 * Returns the text the user has selected and its bounding box, and re-renders as the selection
 * changes, such as to show a "quote" or "share" button beside it. Given a `ref`, only the part
 * of the selection inside that element counts, so a selection elsewhere gives no text. It is
 * `{ text: "", rect: null }` when nothing is selected and on the server, and it stops listening
 * on unmount.
 */
export function useTextSelection(ref?: RefObject<Element | null>): TextSelection {
  const [selection, setSelection] = useState<TextSelection>(NONE);
  useEffect(() => {
    const update = () => {
      const next = readSelection(ref ? ref.current : undefined);
      setSelection((previous) =>
        previous.text === next.text && previous.rect === next.rect ? previous : next,
      );
    };
    update();
    document.addEventListener("selectionchange", update);
    return () => {
      document.removeEventListener("selectionchange", update);
    };
  }, [ref]);
  return selection;
}
