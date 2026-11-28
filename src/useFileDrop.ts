import { useEffect, useRef, useState, type RefObject } from "react";
import { useEventListener } from "./useEventListener";

/** Whether the drag carries files, rather than text or a link. */
function hasFiles(event: DragEvent): boolean {
  return [...(event.dataTransfer?.types ?? [])].includes("Files");
}

export interface FileDropOptions {
  /**
   * The files to accept, as in `<input type="file" accept>`: MIME types (`"image/png"`),
   * wildcards (`"image/*"`) and extensions (`".pdf"`), comma-separated. Defaults to any file.
   */
  accept?: string;
  /** Set to `false` to stop handling drags and drops. Defaults to `true`. */
  enabled?: boolean;
  /** Accept several files at once. When false, only the first accepted file is. Defaults to `true`. */
  multiple?: boolean;
}

export interface FileDrop {
  /** Whether files are being dragged over the element. */
  readonly isOver: boolean;
}

/** Whether `file` matches one of the `accept` patterns; extensions ignore case. */
function matches(file: File, patterns: string[]): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) return name.endsWith(pattern);
    if (pattern.endsWith("/*")) return type.startsWith(pattern.slice(0, -1));
    return type === pattern;
  });
}

/** Splits dropped files into accepted and rejected. */
function sort(files: File[], { accept, multiple = true }: FileDropOptions) {
  const patterns = (accept ?? "")
    .split(",")
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);
  const accepted: File[] = [];
  const rejected: File[] = [];
  for (const file of files) {
    const fits = patterns.length === 0 || matches(file, patterns);
    if (fits && (multiple || accepted.length === 0)) accepted.push(file);
    else rejected.push(file);
  }
  return { accepted, rejected };
}

/**
 * Turns the element held by `ref` into a drop zone for files: returns `{ isOver }`, whether files
 * are being dragged over it, and calls `onDrop(accepted, rejected)` with the dropped files, split
 * by `accept` (as in `<input type="file">`) and `multiple`. Moving across the element's children
 * doesn't make `isOver` flicker. Drags without files, such as text or links, are ignored, and a
 * dropped file isn't opened by the browser. The latest `onDrop` is always called; listeners
 * follow the ref to a new element and are removed on unmount or while `enabled` is false.
 */
export function useFileDrop(
  ref: RefObject<HTMLElement | null>,
  onDrop: (accepted: File[], rejected: File[]) => void,
  options: FileDropOptions = {},
): FileDrop {
  const [isOver, setIsOver] = useState(false);
  /**
   * Entered minus left: moving onto a child fires its dragenter before the zone's dragleave, so
   * counting keeps `isOver` from flickering.
   */
  const depth = useRef(0);
  const enabled = options.enabled ?? true;

  // Disabling ends any drag in progress, so re-enabling doesn't bring back a stale isOver.
  if (!enabled && isOver) setIsOver(false);
  useEffect(() => {
    if (!enabled) depth.current = 0;
  }, [enabled]);

  useEventListener(
    "dragenter",
    (event) => {
      if (!hasFiles(event)) return;
      depth.current++;
      setIsOver(true);
    },
    { target: ref, enabled },
  );
  useEventListener(
    "dragleave",
    (event) => {
      if (!hasFiles(event)) return;
      depth.current = Math.max(depth.current - 1, 0);
      if (depth.current === 0) setIsOver(false);
    },
    { target: ref, enabled },
  );
  useEventListener(
    "dragover",
    (event) => {
      // Cancelling dragover is what allows a drop here.
      if (hasFiles(event)) event.preventDefault();
    },
    { target: ref, enabled },
  );
  useEventListener(
    "drop",
    (event) => {
      if (!hasFiles(event)) return;
      // Stops the browser opening the file in place of the page.
      event.preventDefault();
      depth.current = 0;
      setIsOver(false);
      const { accepted, rejected } = sort([...(event.dataTransfer?.files ?? [])], options);
      onDrop(accepted, rejected);
    },
    { target: ref, enabled },
  );

  return { isOver };
}
