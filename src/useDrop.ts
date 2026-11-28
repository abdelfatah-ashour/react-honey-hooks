import { type RefObject, useRef, useState } from "react";
import { useEventListener } from "./useEventListener";

/**
 * What to do with each kind of drop. Only kinds with a callback are handled; a drop goes to one
 * callback, the first that applies of `onFiles`, `onUri` and `onText`.
 */
export interface DropOptions {
  /** Called with dropped files, such as from the desktop. */
  onFiles?: ((files: File[], event: DragEvent) => void) | undefined;
  /** Called with a dropped link's URL, such as one dragged from another tab. */
  onUri?: ((uri: string, event: DragEvent) => void) | undefined;
  /** Called with dropped text, such as a selection dragged from a page. */
  onText?: ((text: string, event: DragEvent) => void) | undefined;
}

export interface Drop {
  /** Whether something the zone handles is being dragged over it. */
  readonly isOver: boolean;
}

/** The first URL in a `text/uri-list`, whose lines starting with `#` are comments. */
function firstUri(list: string): string | undefined {
  return list
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line !== "" && !line.startsWith("#"));
}

/**
 * Calls the callback for the first kind of data the drop carries that has one: files, then a
 * link, then text. Returns whether one was called.
 */
function deliver(event: DragEvent, options: DropOptions): boolean {
  const data = event.dataTransfer;
  if (!data) return false;
  const types = [...data.types];
  if (options.onFiles && types.includes("Files")) {
    options.onFiles([...data.files], event);
    return true;
  }
  const uri = types.includes("text/uri-list") ? firstUri(data.getData("text/uri-list")) : undefined;
  if (options.onUri && uri !== undefined) {
    options.onUri(uri, event);
    return true;
  }
  if (options.onText && types.includes("text/plain")) {
    options.onText(data.getData("text/plain"), event);
    return true;
  }
  return false;
}

/**
 * Whether the drag carries a kind of data with a callback. Only the types can be read until the
 * drop, so this decides from them.
 */
function handles(event: DragEvent, options: DropOptions): boolean {
  const types = [...(event.dataTransfer?.types ?? [])];
  return (
    (options.onFiles !== undefined && types.includes("Files")) ||
    (options.onUri !== undefined && types.includes("text/uri-list")) ||
    (options.onText !== undefined && types.includes("text/plain"))
  );
}

/**
 * Turns the element held by `ref` into a drop zone for files, links and text: returns `{ isOver
 * }`, whether something it handles is being dragged over it. Only kinds of data with a callback
 * are handled, and each drop goes to one callback: `onFiles` if it carries files, otherwise
 * `onUri` with the first URL of a link, otherwise `onText`. Other drags are ignored, left to the
 * browser. Moving across the element's children doesn't make `isOver` flicker, and a handled
 * drop isn't opened by the browser. The latest callbacks are always used; listeners follow the
 * ref to a new element and are removed on unmount. For files filtered by type, use
 * `useFileDrop`.
 */
export function useDrop(ref: RefObject<HTMLElement | null>, options: DropOptions): Drop {
  const [isOver, setIsOver] = useState(false);
  /**
   * Entered minus left: moving onto a child fires its dragenter before the zone's dragleave, so
   * counting keeps `isOver` from flickering.
   */
  const depth = useRef(0);

  useEventListener(
    "dragenter",
    (event) => {
      if (!handles(event, options)) return;
      depth.current++;
      setIsOver(true);
    },
    { target: ref },
  );
  useEventListener(
    "dragleave",
    (event) => {
      if (!handles(event, options)) return;
      depth.current = Math.max(depth.current - 1, 0);
      if (depth.current === 0) setIsOver(false);
    },
    { target: ref },
  );
  useEventListener(
    "dragover",
    (event) => {
      // Cancelling dragover is what allows a drop here.
      if (handles(event, options)) event.preventDefault();
    },
    { target: ref },
  );
  useEventListener(
    "drop",
    (event) => {
      if (!handles(event, options)) return;
      // Stops the browser opening a dropped file or link in place of the page.
      event.preventDefault();
      depth.current = 0;
      setIsOver(false);
      deliver(event, options);
    },
    { target: ref },
  );
  return { isOver };
}
